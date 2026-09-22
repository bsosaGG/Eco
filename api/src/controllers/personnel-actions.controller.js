/**
 * Personnel Actions Controller (Ola 3 - Core Humanis SCSPR)
 * RESTful Level 3 HATEOAS controller for personnel movements, ONSEC notices, and CGC DJP tracking.
 */

const db = require("../config/db-core-humanis");
const { buildPersonnelActionLinks } = require("../utils/hateoas.helper");

class PersonnelActionsController {
  async getPersonnelActions(req, res) {
    try {
      const { persona_id, tipo_accion, estado, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClauses = [];
      let params = [];

      if (persona_id) {
        params.push(persona_id);
        whereClauses.push(`ap.persona_id = $${params.length}`);
      }
      if (tipo_accion) {
        params.push(tipo_accion);
        whereClauses.push(`ap.tipo_accion = $${params.length}`);
      }
      if (estado) {
        params.push(estado);
        whereClauses.push(`ap.estado = $${params.length}`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const countResult = await db.query(`SELECT COUNT(*) as total FROM acciones_personal ap ${whereSql}`, params);
      const total = parseInt(countResult.rows[0]?.total || "0", 10);

      params.push(Number(limit));
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const query = `
        SELECT ap.*, p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido,
               p.cui_dpi, pf.nombre as puesto_funcional, ua.nombre as unidad_administrativa
        FROM acciones_personal ap
        JOIN personas p ON ap.persona_id = p.id
        LEFT JOIN puestos_funcionales pf ON ap.puesto_funcional_id = pf.id
        LEFT JOIN unidades_administrativas ua ON ap.unidad_admin_id = ua.id
        ${whereSql}
        ORDER BY ap.fecha_efectiva DESC, ap.created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await db.query(query, params);
      const totalPages = Math.ceil(total / Number(limit)) || 1;

      // Enrich with deadline alerts
      const itemsWithLinks = result.rows.map((row) => {
        const hoy = new Date();
        let alertaDjp = null;
        if (row.requiere_djp_cgc && !row.djp_cumplida && row.fecha_limite_djp_cgc) {
          const limite = new Date(row.fecha_limite_djp_cgc);
          const diffDias = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
          alertaDjp = {
            diasRestantes: diffDias,
            semaforo: diffDias <= 5 ? "ROJO" : diffDias <= 15 ? "AMBAR" : "VERDE",
            vencida: diffDias < 0,
          };
        }

        return {
          ...row,
          alertaDjp,
          _links: buildPersonnelActionLinks(row),
        };
      });

      return res.status(200).json({
        data: itemsWithLinks,
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      });
    } catch (error) {
      console.error("Error in getPersonnelActions:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createPersonnelAction(req, res) {
    try {
      const {
        persona_id,
        tipo_accion,
        fecha_efectiva,
        fecha_rige_hasta,
        acuerdo_numero,
        acta_toma_posesion,
        puesto_nominal_id,
        puesto_funcional_id,
        unidad_admin_id,
        salario_nuevo,
        justificacion,
      } = req.body;

      if (!persona_id || !tipo_accion || !fecha_efectiva || !justificacion) {
        return res.status(400).json({ success: false, message: "Campos requeridos faltantes" });
      }

      const personaCheck = await db.query("SELECT id FROM personas WHERE id = $1", [persona_id]);
      if (personaCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
      }

      const anio = new Date(fecha_efectiva).getFullYear() || new Date().getFullYear();
      const countResult = await db.query(
        "SELECT COUNT(*) as total FROM acciones_personal WHERE EXTRACT(YEAR FROM created_at) = $1",
        [anio]
      );
      const sec = parseInt(countResult.rows[0]?.total || "0", 10) + 1;
      const correlativo = `SCSPR-URH-AP-${anio}-${String(sec).padStart(4, "0")}`;

      // Calculate DJP deadline: exactly 30 calendar days from effective date
      const fechaEfectivaDate = new Date(fecha_efectiva);
      const fechaLimiteDjp = new Date(fechaEfectivaDate);
      fechaLimiteDjp.setDate(fechaLimiteDjp.getDate() + 30);
      const fechaLimiteDjpStr = fechaLimiteDjp.toISOString().split("T")[0];

      const insertResult = await db.query(
        `INSERT INTO acciones_personal (
          correlativo, persona_id, tipo_accion, fecha_efectiva, fecha_rige_hasta,
          acuerdo_numero, acta_toma_posesion, puesto_nominal_id, puesto_funcional_id,
          unidad_admin_id, salario_nuevo, justificacion, estado, requiere_djp_cgc,
          fecha_limite_djp_cgc, autorizado_por_usuario_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'BORRADOR', TRUE, $13, $14)
        RETURNING *`,
        [
          correlativo,
          persona_id,
          tipo_accion,
          fecha_efectiva,
          fecha_rige_hasta || null,
          acuerdo_numero || null,
          acta_toma_posesion || null,
          puesto_nominal_id || null,
          puesto_funcional_id || null,
          unidad_admin_id || null,
          salario_nuevo || null,
          justificacion,
          fechaLimiteDjpStr,
          req.user?.id || null,
        ]
      );

      const nueva = insertResult.rows[0];
      return res.status(201).json({
        data: {
          ...nueva,
          _links: buildPersonnelActionLinks(nueva),
        },
      });
    } catch (error) {
      console.error("Error in createPersonnelAction:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPersonnelActionById(req, res) {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT ap.*, p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido,
                p.cui_dpi, p.nit, pf.nombre as puesto_funcional, ua.nombre as unidad_administrativa
         FROM acciones_personal ap
         JOIN personas p ON ap.persona_id = p.id
         LEFT JOIN puestos_funcionales pf ON ap.puesto_funcional_id = pf.id
         LEFT JOIN unidades_administrativas ua ON ap.unidad_admin_id = ua.id
         WHERE ap.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Acción de personal no encontrada" });
      }

      const action = result.rows[0];
      return res.status(200).json({
        data: {
          ...action,
          _links: buildPersonnelActionLinks(action),
        },
      });
    } catch (error) {
      console.error("Error in getPersonnelActionById:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const validos = ["BORRADOR", "EN_FIRMA", "APROBADO", "ANULADO"];

      if (!validos.includes(estado)) {
        return res.status(400).json({ success: false, message: `Estado inválido: ${estado}` });
      }

      const updateResult = await db.query(
        "UPDATE acciones_personal SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [estado, id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Acción de personal no encontrada" });
      }

      const action = updateResult.rows[0];

      // If approved, update active employment relationship if salary or position changed
      if (estado === "APROBADO" && action.salario_nuevo) {
        await db.query(
          `UPDATE relaciones_laborales
           SET salario_honorarios = $1,
               puesto_funcional_id = COALESCE($2, puesto_funcional_id),
               updated_at = NOW()
           WHERE persona_id = $3 AND estado = 'ACTIVO'`,
          [action.salario_nuevo, action.puesto_funcional_id, action.persona_id]
        );
      }

      return res.status(200).json({
        data: {
          ...action,
          _links: buildPersonnelActionLinks(action),
        },
      });
    } catch (error) {
      console.error("Error in updateStatus:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateCgcDjpStatus(req, res) {
    try {
      const { id } = req.params;
      const { djp_cumplida } = req.body;

      const updateResult = await db.query(
        "UPDATE acciones_personal SET djp_cumplida = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [Boolean(djp_cumplida), id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Acción de personal no encontrada" });
      }

      return res.status(200).json({
        success: true,
        data: updateResult.rows[0],
      });
    } catch (error) {
      console.error("Error in updateCgcDjpStatus:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PersonnelActionsController();
