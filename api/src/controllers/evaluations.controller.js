/**
 * Evaluations Controller (Ola 4 - Core Humanis SCSPR)
 * RESTful Level 3 HATEOAS controller for periodic performance evaluations and improvement plans.
 */

const db = require("../config/db-core-humanis");
const evaluationsService = require("../services/evaluations.service");
const { buildEvaluationLinks, buildEvaluationCollectionLinks } = require("../utils/hateoas.helper");

class EvaluationsController {
  async getDefaultFactors(req, res) {
    try {
      const { tipo = "ONSEC_011_022" } = req.query;
      const factors = evaluationsService.getDefaultFactors(tipo);
      return res.json({ success: true, tipo, data: factors });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al obtener factores: " + error.message });
    }
  }

  async getEvaluations(req, res) {
    try {
      const { persona_id, periodo, escala, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClauses = [];
      let params = [];

      if (persona_id) {
        params.push(persona_id);
        whereClauses.push(`e.persona_id = $${params.length}`);
      }
      if (periodo) {
        params.push(periodo);
        whereClauses.push(`e.periodo_evaluado = $${params.length}`);
      }
      if (escala) {
        params.push(escala);
        whereClauses.push(`e.resultado_escala = $${params.length}`);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM evaluaciones_desempeno e ${whereSql}`,
        params
      );
      const total = parseInt(countResult.rows[0]?.total || "0", 10);

      params.push(Number(limit));
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const query = `
        SELECT e.*,
               p.cui_dpi, p.primer_nombre, p.primer_apellido,
               r.codigo as renglon_codigo,
               pn.nombre as puesto_nominal,
               u.nombres as evaluador_nombre, u.apellidos as evaluador_apellido
        FROM evaluaciones_desempeno e
        JOIN personas p ON p.id = e.persona_id
        LEFT JOIN puestos_nominales pn ON pn.id = p.puesto_nominal_id
        LEFT JOIN renglones_presupuestarios r ON r.id = p.renglon_id
        LEFT JOIN usuarios u ON u.id = e.evaluador_usuario_id
        ${whereSql}
        ORDER BY e.created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await db.query(query, params);

      const items = result.rows.map((row) => ({
        ...row,
        _links: buildEvaluationLinks(row.id),
      }));

      return res.json({
        success: true,
        data: items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        _links: buildEvaluationCollectionLinks(Number(page), Math.ceil(total / Number(limit)), Number(limit)),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al listar evaluaciones: " + error.message });
    }
  }

  async getEvaluationById(req, res) {
    try {
      const { id } = req.params;
      const evalRes = await db.query(
        `SELECT e.*,
                p.cui_dpi, p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido,
                pn.nombre as puesto_nominal, pf.nombre as puesto_funcional,
                u.nombres as evaluador_nombre, u.apellidos as evaluador_apellido
         FROM evaluaciones_desempeno e
         JOIN personas p ON p.id = e.persona_id
         LEFT JOIN puestos_nominales pn ON pn.id = p.puesto_nominal_id
         LEFT JOIN puestos_funcionales pf ON pf.id = p.puesto_funcional_id
         LEFT JOIN usuarios u ON u.id = e.evaluador_usuario_id
         WHERE e.id = $1`,
        [id]
      );

      if (evalRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Evaluación no encontrada" });
      }

      const evaluacion = evalRes.rows[0];
      const factoresRes = await db.query(
        `SELECT * FROM evaluaciones_factores_detalle WHERE evaluacion_id = $1 ORDER BY ponderacion_maxima DESC`,
        [id]
      );

      evaluacion.factores = factoresRes.rows;
      evaluacion._links = buildEvaluationLinks(id);

      return res.json({ success: true, data: evaluacion });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al obtener evaluación: " + error.message });
    }
  }

  async createEvaluation(req, res) {
    const client = await db.getClient ? await db.getClient() : db;
    try {
      const {
        persona_id,
        periodo_evaluado,
        tipo_instrumento = "ONSEC_011_022",
        observaciones_evaluador,
        compromisos_colaborador,
        plan_mejora_detalle,
        fecha_reevaluacion,
        factores = [],
      } = req.body;

      if (!persona_id || !periodo_evaluado) {
        return res.status(400).json({ success: false, message: "Colaborador y período evaluado son obligatorios" });
      }

      const factorsToUse = factores.length > 0 ? factores : evaluationsService.getDefaultFactors(tipo_instrumento);
      const scoreResult = evaluationsService.calculateEvaluationScore(factorsToUse, tipo_instrumento);

      const anio = new Date().getFullYear();
      const countRes = await client.query(
        `SELECT COUNT(*) as total FROM evaluaciones_desempeno WHERE EXTRACT(YEAR FROM created_at) = $1`,
        [anio]
      );
      const nextNum = String(parseInt(countRes.rows[0]?.total || "0", 10) + 1).padStart(3, "0");
      const correlativo = `SCSPR-ED-${anio}-${nextNum}`;

      const insertEval = await client.query(
        `INSERT INTO evaluaciones_desempeno (
          correlativo, persona_id, evaluador_usuario_id, periodo_evaluado, tipo_instrumento,
          calificacion_total, resultado_escala, observaciones_evaluador, compromisos_colaborador,
          requiere_plan_mejora, plan_mejora_detalle, fecha_reevaluacion, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'COMPLETADA')
        RETURNING *`,
        [
          correlativo,
          persona_id,
          req.user?.id || null,
          periodo_evaluado,
          tipo_instrumento,
          scoreResult.calificacion_total,
          scoreResult.resultado_escala,
          observaciones_evaluador || "",
          compromisos_colaborador || "",
          scoreResult.requiere_plan_mejora,
          scoreResult.requiere_plan_mejora ? (plan_mejora_detalle || "Plan de mejora a 90 días") : null,
          scoreResult.requiere_plan_mejora ? (fecha_reevaluacion || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]) : null,
        ]
      );

      const nuevaEval = insertEval.rows[0];

      for (const factor of factorsToUse) {
        await client.query(
          `INSERT INTO evaluaciones_factores_detalle (
            evaluacion_id, factor_clave, factor_descripcion, ponderacion_maxima,
            puntaje_obtenido, justificacion_factor
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            nuevaEval.id,
            factor.factor_clave,
            factor.factor_descripcion || "",
            factor.ponderacion_maxima,
            factor.puntaje_obtenido || 0,
            factor.justificacion_factor || null,
          ]
        );
      }

      nuevaEval._links = buildEvaluationLinks(nuevaEval.id);

      return res.status(201).json({
        success: true,
        message: `Evaluación ${correlativo} registrada. Calificación: ${scoreResult.calificacion_total}/100 (${scoreResult.resultado_escala})`,
        data: nuevaEval,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al crear evaluación: " + error.message });
    }
  }

  async getCollaboratorEvaluations(req, res) {
    try {
      const { personaId } = req.params;
      const result = await db.query(
        `SELECT e.*, u.nombres as evaluador_nombre, u.apellidos as evaluador_apellido
         FROM evaluaciones_desempeno e
         LEFT JOIN usuarios u ON u.id = e.evaluador_usuario_id
         WHERE e.persona_id = $1
         ORDER BY e.created_at DESC`,
        [personaId]
      );

      return res.json({ success: true, data: result.rows });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error al obtener evaluaciones del colaborador: " + error.message });
    }
  }
}

module.exports = new EvaluationsController();
