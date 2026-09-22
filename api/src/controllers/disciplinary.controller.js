/**
 * Disciplinary Controller (Ola 3 - Core Humanis SCSPR)
 * RESTful Level 3 HATEOAS controller for disciplinary records, hearings, and defense rights (Art. 12 CPRG).
 */

const db = require("../config/db-core-humanis");
const { buildDisciplinaryLinks } = require("../utils/hateoas.helper");

class DisciplinaryController {
  async getRecords(req, res) {
    try {
      const { persona_id, estado, gravedad_falta, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClauses = [];
      let params = [];

      if (persona_id) {
        params.push(persona_id);
        whereClauses.push(`ed.persona_id = $${params.length}`);
      }
      if (estado) {
        params.push(estado);
        whereClauses.push(`ed.estado = $${params.length}`);
      }
      if (gravedad_falta) {
        params.push(gravedad_falta);
        whereClauses.push(`ed.gravedad_falta = $${params.length}`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const countResult = await db.query(`SELECT COUNT(*) as total FROM expedientes_disciplinarios ed ${whereSql}`, params);
      const total = parseInt(countResult.rows[0]?.total || "0", 10);

      params.push(Number(limit));
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const query = `
        SELECT ed.*, p.primer_nombre, p.primer_apellido, p.cui_dpi, pf.nombre as puesto_funcional
        FROM expedientes_disciplinarios ed
        JOIN personas p ON ed.persona_id = p.id
        LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.estado = 'ACTIVO'
        LEFT JOIN puestos_funcionales pf ON rl.puesto_funcional_id = pf.id
        ${whereSql}
        ORDER BY ed.created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await db.query(query, params);
      const totalPages = Math.ceil(total / Number(limit)) || 1;

      const itemsWithLinks = result.rows.map((row) => ({
        ...row,
        _links: buildDisciplinaryLinks(row),
      }));

      return res.status(200).json({
        data: itemsWithLinks,
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      });
    } catch (error) {
      console.error("Error in getRecords:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createRecord(req, res) {
    try {
      const {
        persona_id,
        fecha_incidente,
        gravedad_falta,
        tipo_sancion_propuesta,
        hechos_denuncia,
        base_legal = "Ley de Servicio Civil Decreto 1748 Art. 74",
      } = req.body;

      if (!persona_id || !fecha_incidente || !gravedad_falta || !hechos_denuncia) {
        return res.status(400).json({ success: false, message: "Campos obligatorios faltantes" });
      }

      const anio = new Date(fecha_incidente).getFullYear() || new Date().getFullYear();
      const countResult = await db.query(
        "SELECT COUNT(*) as total FROM expedientes_disciplinarios WHERE EXTRACT(YEAR FROM created_at) = $1",
        [anio]
      );
      const sec = parseInt(countResult.rows[0]?.total || "0", 10) + 1;
      const correlativo = `SCSPR-URH-DISC-${anio}-${String(sec).padStart(4, "0")}`;

      const insertResult = await db.query(
        `INSERT INTO expedientes_disciplinarios (
          correlativo, persona_id, jefatura_denunciante_id, fecha_incidente,
          gravedad_falta, tipo_sancion_propuesta, hechos_denuncia, base_legal, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'REGISTRADO')
        RETURNING *`,
        [
          correlativo,
          persona_id,
          req.user?.id || null,
          fecha_incidente,
          gravedad_falta,
          tipo_sancion_propuesta,
          hechos_denuncia,
          base_legal,
        ]
      );

      const nuevo = insertResult.rows[0];
      return res.status(201).json({
        data: {
          ...nuevo,
          _links: buildDisciplinaryLinks(nuevo),
        },
      });
    } catch (error) {
      console.error("Error in createRecord:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRecordById(req, res) {
    try {
      const { id } = req.params;
      const recordResult = await db.query(
        `SELECT ed.*, p.primer_nombre, p.primer_apellido, p.cui_dpi, pf.nombre as puesto_funcional
         FROM expedientes_disciplinarios ed
         JOIN personas p ON ed.persona_id = p.id
         LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.estado = 'ACTIVO'
         LEFT JOIN puestos_funcionales pf ON rl.puesto_funcional_id = pf.id
         WHERE ed.id = $1`,
        [id]
      );

      if (recordResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Expediente disciplinario no encontrado" });
      }

      const record = recordResult.rows[0];

      const hearingsResult = await db.query(
        "SELECT * FROM audiencias_descargo WHERE expediente_disciplinario_id = $1 ORDER BY created_at DESC",
        [id]
      );

      return res.status(200).json({
        data: {
          ...record,
          audiencias: hearingsResult.rows,
          _links: buildDisciplinaryLinks(record),
        },
      });
    } catch (error) {
      console.error("Error in getRecordById:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createHearing(req, res) {
    try {
      const { id } = req.params;
      const { fecha_notificacion } = req.body;
      const notifDate = fecha_notificacion ? new Date(fecha_notificacion) : new Date();

      // Compute 3 business days (skip weekends)
      let added = 0;
      let cur = new Date(notifDate);
      while (added < 3) {
        cur.setDate(cur.getDate() + 1);
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
          added++;
        }
      }
      const fechaLimiteStr = cur.toISOString().split("T")[0];
      const fechaNotifStr = notifDate.toISOString().split("T")[0];

      const insertResult = await db.query(
        `INSERT INTO audiencias_descargo (
          expediente_disciplinario_id, fecha_notificacion, fecha_limite_evacuacion
        ) VALUES ($1, $2, $3)
        RETURNING *`,
        [id, fechaNotifStr, fechaLimiteStr]
      );

      await db.query(
        "UPDATE expedientes_disciplinarios SET estado = 'AUDIENCIA_CONFERIDA', updated_at = NOW() WHERE id = $1",
        [id]
      );

      return res.status(201).json({
        success: true,
        message: "Audiencia de descargo conferida por 3 días hábiles",
        data: insertResult.rows[0],
      });
    } catch (error) {
      console.error("Error in createHearing:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async submitDescargo(req, res) {
    try {
      const { id, hearingId } = req.params;
      const { memorial_descargo } = req.body;

      const hearingResult = await db.query(
        "SELECT * FROM audiencias_descargo WHERE id = $1 AND expediente_disciplinario_id = $2",
        [hearingId, id]
      );

      if (hearingResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Audiencia no encontrada" });
      }

      const h = hearingResult.rows[0];
      const hoy = new Date().toISOString().split("T")[0];
      const aTiempo = hoy <= h.fecha_limite_evacuacion;

      const updateResult = await db.query(
        `UPDATE audiencias_descargo
         SET memorial_descargo = $1, fecha_presentacion = $2, presentado_a_tiempo = $3
         WHERE id = $4
         RETURNING *`,
        [memorial_descargo, hoy, aTiempo, hearingId]
      );

      await db.query(
        "UPDATE expedientes_disciplinarios SET estado = 'DESCARGO_RECIBIDO', updated_at = NOW() WHERE id = $1",
        [id]
      );

      return res.status(200).json({
        success: true,
        message: aTiempo ? "Descargo recibido dentro del plazo de ley" : "Descargo recibido de forma extemporánea",
        data: updateResult.rows[0],
      });
    } catch (error) {
      console.error("Error in submitDescargo:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async resolveRecord(req, res) {
    try {
      const { id } = req.params;
      const { tipo_sancion_definitiva, dias_suspension = 0, estado = "RESUELTO" } = req.body;

      const updateResult = await db.query(
        `UPDATE expedientes_disciplinarios
         SET tipo_sancion_definitiva = $1, dias_suspension = $2, estado = $3,
             fecha_resolucion = CURRENT_DATE, resuelto_por_usuario_id = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [tipo_sancion_definitiva, Number(dias_suspension) || 0, estado, req.user?.id || null, id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Expediente no encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Resolución disciplinaria emitida",
        data: updateResult.rows[0],
      });
    } catch (error) {
      console.error("Error in resolveRecord:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new DisciplinaryController();
