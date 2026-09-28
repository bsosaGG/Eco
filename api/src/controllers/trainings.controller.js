/**
 * Trainings Controller (Ola 5 - Core Humanis SCSPR)
 * RESTful Level 3 HATEOAS controller for Annual Training Plan (PAC),
 * course enrollments, hours accreditation, and induction tracking.
 */

const db = require("../config/db-core-humanis");
const trainingsService = require("../services/trainings.service");
const { buildTrainingLinks, buildTrainingCollectionLinks } = require("../utils/hateoas.helper");

class TrainingsController {
  async getTrainings(req, res) {
    try {
      const { area_tematica, modalidad, estado, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const whereClauses = [];
      const params = [];

      if (area_tematica) {
        params.push(area_tematica);
        whereClauses.push(`t.area_tematica = $${params.length}`);
      }
      if (modalidad) {
        params.push(modalidad);
        whereClauses.push(`t.modalidad = $${params.length}`);
      }
      if (estado) {
        params.push(estado);
        whereClauses.push(`t.estado = $${params.length}`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
      const countRes = await db.query(`SELECT COUNT(*) as total FROM capacitaciones_programas t ${whereSql}`, params);
      const total = parseInt(countRes.rows[0]?.total || "0", 10);

      params.push(Number(limit));
      params.push(offset);
      const query = `
        SELECT t.*,
               COUNT(p.id) as total_inscritos,
               COUNT(CASE WHEN p.estado = 'APROBADO' THEN 1 END) as total_aprobados
        FROM capacitaciones_programas t
        LEFT JOIN capacitaciones_participantes p ON p.programa_id = t.id
        ${whereSql}
        GROUP BY t.id
        ORDER BY t.fecha_inicio DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;
      const result = await db.query(query, params);
      const items = result.rows.map((row) => ({ ...row, _links: buildTrainingLinks(row.id) }));

      return res.json({
        success: true,
        data: items,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
        _links: buildTrainingCollectionLinks(Number(page), Math.ceil(total / Number(limit)), Number(limit)),
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al listar capacitaciones: " + err.message });
    }
  }

  async getTrainingById(req, res) {
    try {
      const { id } = req.params;
      const progRes = await db.query(`SELECT * FROM capacitaciones_programas WHERE id = $1`, [id]);
      if (progRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Programa de capacitación no encontrado" });
      }
      const programa = progRes.rows[0];
      const partRes = await db.query(
        `SELECT cp.*, p.cui_dpi, p.primer_nombre, p.primer_apellido, r.codigo as renglon_codigo
         FROM capacitaciones_participantes cp
         JOIN personas p ON p.id = cp.persona_id
         LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
         LEFT JOIN renglones_presupuestarios r ON r.id = rl.renglon_id
         WHERE cp.programa_id = $1
         ORDER BY cp.created_at ASC`,
        [id]
      );
      programa.participantes = partRes.rows;
      programa._links = buildTrainingLinks(id);
      return res.json({ success: true, data: programa });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al obtener capacitación: " + err.message });
    }
  }

  async createTraining(req, res) {
    try {
      const { codigo_curso, titulo, area_tematica, modalidad = "VIRTUAL", horas_lectivas, entidad_facilitadora, nombre_instructor, objetivo_capacitacion, temario_resumen, fecha_inicio, fecha_fin, cupo_maximo = 30 } = req.body;
      if (!titulo || !area_tematica || !horas_lectivas || !entidad_facilitadora || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ success: false, message: "Título, área, horas, entidad y fechas son obligatorios" });
      }

      let code = codigo_curso;
      if (!code) {
        const countRes = await db.query(`SELECT COUNT(*) as total FROM capacitaciones_programas WHERE EXTRACT(YEAR FROM created_at) = $1`, [new Date().getFullYear()]);
        const num = String(parseInt(countRes.rows[0]?.total || "0", 10) + 1).padStart(3, "0");
        code = `CAP-${new Date().getFullYear()}-${num}`;
      }

      const insertRes = await db.query(
        `INSERT INTO capacitaciones_programas (codigo_curso, titulo, area_tematica, modalidad, horas_lectivas, entidad_facilitadora, nombre_instructor, objetivo_capacitacion, temario_resumen, fecha_inicio, fecha_fin, cupo_maximo, estado, creado_por_usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'CONVOCATORIA_ABIERTA', $13)
         RETURNING *`,
        [code, titulo, area_tematica, modalidad, horas_lectivas, entidad_facilitadora, nombre_instructor || "", objetivo_capacitacion || "", temario_resumen || "", fecha_inicio, fecha_fin, cupo_maximo, req.user?.id || null]
      );
      const created = insertRes.rows[0];
      created._links = buildTrainingLinks(created.id);
      return res.status(201).json({ success: true, message: `Curso ${code} creado exitosamente`, data: created });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al crear curso: " + err.message });
    }
  }

  async updateTrainingStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const updateRes = await db.query(`UPDATE capacitaciones_programas SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`, [estado, id]);
      if (updateRes.rows.length === 0) return res.status(404).json({ success: false, message: "Curso no encontrado" });
      return res.json({ success: true, message: `Estado actualizado a ${estado}`, data: updateRes.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al actualizar estado: " + err.message });
    }
  }

  async enrollParticipant(req, res) {
    try {
      const { id } = req.params;
      const { persona_id, origen_inscripcion = "ASIGNACION_RRHH", evaluacion_desempeno_origen_id } = req.body;
      if (!persona_id) return res.status(400).json({ success: false, message: "persona_id es obligatorio" });

      const insertRes = await db.query(
        `INSERT INTO capacitaciones_participantes (programa_id, persona_id, origen_inscripcion, evaluacion_desempeno_origen_id, estado)
         VALUES ($1, $2, $3, $4, 'INSCRITO')
         ON CONFLICT (programa_id, persona_id) DO UPDATE SET origen_inscripcion = EXCLUDED.origen_inscripcion, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [id, persona_id, origen_inscripcion, evaluacion_desempeno_origen_id || null]
      );
      return res.status(201).json({ success: true, message: "Colaborador inscrito en la capacitación", data: insertRes.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al inscribir participante: " + err.message });
    }
  }

  async gradeParticipant(req, res) {
    try {
      const { id, enrId } = req.params;
      const { calificacion_final, porcentaje_asistencia, observaciones } = req.body;
      const evalRes = trainingsService.evaluateParticipantPassing(calificacion_final, porcentaje_asistencia);
      let certHash = null;
      let certDate = null;

      if (evalRes.passed) {
        const pRes = await db.query(`SELECT persona_id FROM capacitaciones_participantes WHERE id = $1`, [enrId]);
        certDate = new Date().toISOString().split("T")[0];
        certHash = trainingsService.generateCertificateHash(pRes.rows[0]?.persona_id || "SCSPR", id, certDate);
      }

      const updateRes = await db.query(
        `UPDATE capacitaciones_participantes SET
           calificacion_final = $1, porcentaje_asistencia = $2, estado = $3,
           hash_certificado = COALESCE($4, hash_certificado), fecha_certificacion = COALESCE($5, fecha_certificacion),
           observaciones = COALESCE($6, observaciones), updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 AND programa_id = $8 RETURNING *`,
        [calificacion_final, porcentaje_asistencia, evalRes.estado, certHash, certDate, observaciones || null, enrId, id]
      );
      return res.json({ success: true, message: `Calificación registrada: ${evalRes.estado}`, data: updateRes.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al calificar participante: " + err.message });
    }
  }

  async getCollaboratorTrainings(req, res) {
    try {
      const { personaId } = req.params;
      const result = await db.query(
        `SELECT cp.*, t.codigo_curso, t.titulo as curso_titulo, t.area_tematica, t.modalidad, t.horas_lectivas, t.entidad_facilitadora
         FROM capacitaciones_participantes cp
         JOIN capacitaciones_programas t ON t.id = cp.programa_id
         WHERE cp.persona_id = $1
         ORDER BY t.fecha_inicio DESC`,
        [personaId]
      );
      const totalHours = trainingsService.calculateAccreditedHours(result.rows);
      return res.json({ success: true, total_horas_acreditadas: totalHours, data: result.rows });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al obtener capacitaciones del colaborador: " + err.message });
    }
  }
}

module.exports = new TrainingsController();
