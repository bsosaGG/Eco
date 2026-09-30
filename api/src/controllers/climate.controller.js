/**
 * Climate Controller (Ola 5 - Core Humanis SCSPR)
 * Manages Workplace Climate Surveys, Blind Cryptographic Voting,
 * and Aggregated eNPS Analytics.
 */

const db = require("../config/db-core-humanis");
const trainingsService = require("../services/trainings.service");
const { buildSurveyLinks } = require("../utils/hateoas.helper");

class ClimateController {
  async getSurveys(req, res) {
    try {
      const result = await db.query(
        `SELECT c.*,
                c.periodo_anio as anio_gestion,
                c.fecha_cierre as fecha_fin,
                COUNT(DISTINCT p.id) as total_participantes
         FROM clima_campanas c
         LEFT JOIN clima_participaciones_ciegas p ON p.campana_id = c.id
         GROUP BY c.id
         ORDER BY c.fecha_inicio DESC`
      );
      const items = result.rows.map((r) => ({ ...r, _links: buildSurveyLinks(r.id) }));
      return res.json({ success: true, data: items });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al listar encuestas: " + err.message });
    }
  }

  async getActiveSurvey(req, res) {
    try {
      const campRes = await db.query(
        `SELECT *, periodo_anio as anio_gestion, fecha_cierre as fecha_fin FROM clima_campanas WHERE estado = 'ACTIVA' ORDER BY fecha_inicio DESC LIMIT 1`
      );
      if (campRes.rows.length === 0) {
        return res.json({ success: true, campaign: null, questions: [], hasParticipated: false });
      }
      const campaign = campRes.rows[0];
      const qRes = await db.query(
        `SELECT id, campana_id, dimension, texto_pregunta as pregunta_texto, texto_pregunta, tipo_respuesta, orden as orden_visual, orden
         FROM clima_preguntas
         WHERE campana_id = $1
         ORDER BY orden ASC`,
        [campaign.id]
      );

      let hasParticipated = false;
      if (req.user?.id) {
        const blindToken = trainingsService.generateBlindParticipationToken(req.user.id, campaign.id);
        const checkRes = await db.query(
          `SELECT id FROM clima_participaciones_ciegas WHERE campana_id = $1 AND token_participacion_ciego = $2`,
          [campaign.id, blindToken]
        );
        hasParticipated = checkRes.rows.length > 0;
      }

      campaign._links = buildSurveyLinks(campaign.id);
      return res.json({
        success: true,
        campaign,
        questions: qRes.rows,
        hasParticipated,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al obtener encuesta activa: " + err.message });
    }
  }

  async createSurvey(req, res) {
    try {
      const { titulo, descripcion, anio_gestion = new Date().getFullYear(), fecha_inicio, fecha_fin, fecha_cierre, preguntas = [] } = req.body;
      const cierre = fecha_cierre || fecha_fin;
      if (!titulo || !fecha_inicio || !cierre) {
        return res.status(400).json({ success: false, message: "Título y fechas son obligatorios" });
      }

      const campRes = await db.query(
        `INSERT INTO clima_campanas (titulo, descripcion, periodo_anio, fecha_inicio, fecha_cierre, estado, creado_por_usuario_id)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVA', $6) RETURNING *`,
        [titulo, descripcion || "", anio_gestion, fecha_inicio, cierre, req.user?.id || null]
      );
      const camp = campRes.rows[0];

      if (Array.isArray(preguntas) && preguntas.length > 0) {
        for (let i = 0; i < preguntas.length; i++) {
          const p = preguntas[i];
          await db.query(
            `INSERT INTO clima_preguntas (campana_id, dimension, texto_pregunta, tipo_respuesta, orden)
             VALUES ($1, $2, $3, $4, $5)`,
            [camp.id, p.dimension || "CONDICIONES", p.texto_pregunta || p.pregunta_texto, p.tipo_respuesta || "LIKERT_1_5", i + 1]
          );
        }
      }

      camp._links = buildSurveyLinks(camp.id);
      return res.status(201).json({ success: true, message: "Campaña de clima laboral creada", data: camp });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al crear encuesta: " + err.message });
    }
  }

  async submitAnonymousResponse(req, res) {
    try {
      const { id } = req.params;
      const { respuestas = [] } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Usuario no autenticado" });
      }

      const campRes = await db.query(`SELECT estado FROM clima_campanas WHERE id = $1`, [id]);
      if (campRes.rows.length === 0 || campRes.rows[0].estado !== "ACTIVA") {
        return res.status(400).json({ success: false, message: "La campaña no está activa o no existe" });
      }

      // Check blind cryptographic token
      const blindToken = trainingsService.generateBlindParticipationToken(userId, id);
      const tokenCheck = await db.query(
        `SELECT id FROM clima_participaciones_ciegas WHERE campana_id = $1 AND token_participacion_ciego = $2`,
        [id, blindToken]
      );
      if (tokenCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: "Ya ha emitido su voto en esta encuesta (voto ciego único)" });
      }

      // Register participation token
      await db.query(
        `INSERT INTO clima_participaciones_ciegas (campana_id, token_participacion_ciego) VALUES ($1, $2)`,
        [id, blindToken]
      );

      // Register completely disassociated responses
      for (const r of respuestas) {
        const score = r.puntuacion_numerica !== undefined ? r.puntuacion_numerica : (r.valor_escala || null);
        const comment = r.respuesta_texto || r.texto_comentario || null;
        await db.query(
          `INSERT INTO clima_respuestas_anonimas (campana_id, pregunta_id, puntuacion_numerica, respuesta_texto)
           VALUES ($1, $2, $3, $4)`,
          [id, r.pregunta_id, score, comment]
        );
      }

      // Update total_respuestas counter in campana
      await db.query(`UPDATE clima_campanas SET total_respuestas = total_respuestas + 1 WHERE id = $1`, [id]);

      return res.status(201).json({
        success: true,
        message: "Sus respuestas anónimas fueron registradas exitosamente garantizando estricta privacidad",
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al registrar respuestas: " + err.message });
    }
  }

  async getSurveyResults(req, res) {
    try {
      const { id } = req.params;
      const respRes = await db.query(
        `SELECT r.id, r.campana_id, r.pregunta_id, r.puntuacion_numerica as valor_escala, r.respuesta_texto as texto_comentario, r.created_at,
                p.dimension, p.texto_pregunta as pregunta_texto, p.tipo_respuesta
         FROM clima_respuestas_anonimas r
         JOIN clima_preguntas p ON p.id = r.pregunta_id
         WHERE r.campana_id = $1`,
        [id]
      );

      const partRes = await db.query(
        `SELECT COUNT(*) as total FROM clima_participaciones_ciegas WHERE campana_id = $1`,
        [id]
      );
      const totalVotos = parseInt(partRes.rows[0]?.total || "0", 10);

      // Calculate eNPS and dimension averages
      const enpsMetrics = trainingsService.calculateEnps(respRes.rows);

      // Group by dimension
      const dimensionStats = {};
      respRes.rows.forEach((r) => {
        if (r.valor_escala !== null) {
          if (!dimensionStats[r.dimension]) {
            dimensionStats[r.dimension] = { dimension: r.dimension, sum: 0, count: 0, average: 0 };
          }
          dimensionStats[r.dimension].sum += Number(r.valor_escala);
          dimensionStats[r.dimension].count += 1;
        }
      });

      Object.values(dimensionStats).forEach((d) => {
        d.average = d.count > 0 ? Number((d.sum / d.count).toFixed(2)) : 0;
      });

      const comments = respRes.rows
        .filter((r) => r.texto_comentario && r.texto_comentario.trim().length > 0)
        .map((r) => ({
          dimension: r.dimension,
          texto_comentario: r.texto_comentario,
          created_at: r.created_at,
        }));

      return res.json({
        success: true,
        total_participantes: totalVotos,
        enps: enpsMetrics,
        dimensiones: Object.values(dimensionStats),
        comentarios: comments,
        _links: buildSurveyLinks(id),
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al calcular resultados de clima: " + err.message });
    }
  }
}

module.exports = new ClimateController();
