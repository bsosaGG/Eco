/**
 * Occupational Health & Safety (SSO) Controller (Ola 5 - Core Humanis SCSPR)
 * Compliant with Acuerdo Gubernativo 229-2014 and 33-2016 (MINTRAB).
 * Manages Bipartite SSO Committee, Accident/Incident Log, and Medical Emergency Profiles.
 */

const db = require("../config/db-core-humanis");
const trainingsService = require("../services/trainings.service");
const { buildIncidentLinks, buildIncidentCollectionLinks } = require("../utils/hateoas.helper");

class OccupationalHealthController {
  async getCommittee(req, res) {
    try {
      const periodRes = await db.query(
        `SELECT * FROM sso_comite_periodos WHERE estado = 'VIGENTE' ORDER BY fecha_constitucion DESC LIMIT 1`
      );
      if (periodRes.rows.length === 0) {
        return res.json({ success: true, committee: null, members: [] });
      }
      const committee = periodRes.rows[0];
      committee.nombre_comite = committee.nombre_gestion;
      const membersRes = await db.query(
        `SELECT m.*, p.cui_dpi, p.primer_nombre, p.primer_apellido, r.codigo as renglon_codigo, pn.nombre as puesto_nominal
         FROM sso_comite_miembros m
         JOIN personas p ON p.id = m.persona_id
         LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
         LEFT JOIN renglones_presupuestarios r ON r.id = rl.renglon_id
         LEFT JOIN puestos_nominales pn ON pn.id = rl.puesto_nominal_id
         WHERE m.periodo_id = $1 AND m.activo = true
         ORDER BY m.representacion ASC, m.cargo_comite ASC`,
        [committee.id]
      );
      return res.json({ success: true, committee, members: membersRes.rows });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al obtener comité SSO: " + err.message });
    }
  }

  async addCommitteeMember(req, res) {
    try {
      const { periodo_id, persona_id, representacion, tipo_miembro = "TITULAR", cargo_comite = "VOCAL", fecha_acreditacion } = req.body;
      if (!periodo_id || !persona_id || !representacion) {
        return res.status(400).json({ success: false, message: "Periodo, persona y representación son obligatorios" });
      }
      const insertRes = await db.query(
        `INSERT INTO sso_comite_miembros (periodo_id, persona_id, representacion, tipo_miembro, cargo_comite, fecha_acreditacion, activo)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), true)
         RETURNING *`,
        [periodo_id, persona_id, representacion, tipo_miembro, cargo_comite, fecha_acreditacion || null]
      );
      return res.status(201).json({ success: true, message: "Miembro del comité acreditado", data: insertRes.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al agregar miembro: " + err.message });
    }
  }

  async getIncidents(req, res) {
    try {
      const { tipo_evento, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const whereClauses = [];
      const params = [];

      if (tipo_evento) {
        params.push(tipo_evento);
        whereClauses.push(`i.tipo_evento = $${params.length}`);
      }
      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const countRes = await db.query(`SELECT COUNT(*) as total FROM sso_incidentes_accidentes i ${whereSql}`, params);
      const total = parseInt(countRes.rows[0]?.total || "0", 10);

      params.push(Number(limit));
      params.push(offset);
      const query = `
        SELECT i.*, p.cui_dpi, p.primer_nombre, p.primer_apellido, r.codigo as renglon_codigo
        FROM sso_incidentes_accidentes i
        LEFT JOIN personas p ON p.id = i.persona_afectada_id
        LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
        LEFT JOIN renglones_presupuestarios r ON r.id = rl.renglon_id
        ${whereSql}
        ORDER BY i.fecha_hora_evento DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;
      const result = await db.query(query, params);
      const items = result.rows.map((row) => ({ ...row, _links: buildIncidentLinks(row.id) }));

      // Cálculo de tasas de frecuencia y gravedad
      const allIncidentsRes = await db.query(`SELECT tipo_evento, dias_incapacidad_estimados FROM sso_incidentes_accidentes`);
      const metrics = trainingsService.calculateAccidentRates(allIncidentsRes.rows, 34560);

      return res.json({
        success: true,
        metrics,
        data: items,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
        _links: buildIncidentCollectionLinks(Number(page), Math.ceil(total / Number(limit)), Number(limit)),
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al listar accidentes SSO: " + err.message });
    }
  }

  async createIncident(req, res) {
    try {
      const { tipo_evento, fecha_hora_evento, lugar_exacto, persona_afectada_id, descripcion_hechos, parte_cuerpo_afectada, mecanismo_accidente, dias_incapacidad_estimados = 0, requirio_traslado_igss = false, causa_raiz, medidas_correctivas } = req.body;
      if (!tipo_evento || !fecha_hora_evento || !lugar_exacto || !descripcion_hechos || !medidas_correctivas) {
        return res.status(400).json({ success: false, message: "Tipo, fecha, lugar, descripción y medidas son obligatorios" });
      }

      const anio = new Date().getFullYear();
      const countRes = await db.query(`SELECT COUNT(*) as total FROM sso_incidentes_accidentes WHERE EXTRACT(YEAR FROM created_at) = $1`, [anio]);
      const nextNum = String(parseInt(countRes.rows[0]?.total || "0", 10) + 1).padStart(3, "0");
      const correlativo = `INC-SSO-${anio}-${nextNum}`;

      const insertRes = await db.query(
        `INSERT INTO sso_incidentes_accidentes (
           correlativo, tipo_evento, fecha_hora_evento, lugar_exacto, persona_afectada_id,
           descripcion_hechos, parte_cuerpo_afectada, mecanismo_accidente, dias_incapacidad_estimados,
           requirio_traslado_igss, causa_raiz, medidas_correctivas, estado, creado_por_usuario_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'REGISTRADO', $13)
         RETURNING *`,
        [correlativo, tipo_evento, fecha_hora_evento, lugar_exacto, persona_afectada_id || null, descripcion_hechos, parte_cuerpo_afectada || null, mecanismo_accidente || null, dias_incapacidad_estimados, requirio_traslado_igss, causa_raiz || null, medidas_correctivas, req.user?.id || null]
      );
      const row = insertRes.rows[0];
      row._links = buildIncidentLinks(row.id);
      return res.status(201).json({ success: true, message: `Evento ${correlativo} asentado en Libro Oficial de Accidentes`, data: row });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al registrar accidente: " + err.message });
    }
  }

  async getMedicalProfile(req, res) {
    try {
      const { personaId } = req.params;
      const resMed = await db.query(`SELECT * FROM sso_fichas_medicas WHERE persona_id = $1`, [personaId]);
      return res.json({ success: true, data: resMed.rows[0] || null });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al consultar ficha médica: " + err.message });
    }
  }

  async updateMedicalProfile(req, res) {
    try {
      const { personaId } = req.params;
      const { tipo_sangre, alergias_conocidas, padecimientos_cronicos, medicamentos_permanentes, nombre_contacto_emergencia, telefono_contacto_emergencia, parentesco_contacto } = req.body;
      const upsertRes = await db.query(
        `INSERT INTO sso_fichas_medicas (persona_id, tipo_sangre, alergias_conocidas, padecimientos_cronicos, medicamentos_permanentes, nombre_contacto_emergencia, telefono_contacto_emergencia, parentesco_contacto, fecha_ultimo_chequeo, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, CURRENT_TIMESTAMP)
         ON CONFLICT (persona_id) DO UPDATE SET
           tipo_sangre = EXCLUDED.tipo_sangre, alergias_conocidas = EXCLUDED.alergias_conocidas,
           padecimientos_cronicos = EXCLUDED.padecimientos_cronicos, medicamentos_permanentes = EXCLUDED.medicamentos_permanentes,
           nombre_contacto_emergencia = EXCLUDED.nombre_contacto_emergencia, telefono_contacto_emergencia = EXCLUDED.telefono_contacto_emergencia,
           parentesco_contacto = EXCLUDED.parentesco_contacto, fecha_ultimo_chequeo = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [personaId, tipo_sangre || null, alergias_conocidas || null, padecimientos_cronicos || null, medicamentos_permanentes || null, nombre_contacto_emergencia || null, telefono_contacto_emergencia || null, parentesco_contacto || null]
      );
      return res.json({ success: true, message: "Ficha médica ocupacional actualizada", data: upsertRes.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al actualizar ficha médica: " + err.message });
    }
  }

  async getConsultations(req, res) {
    try {
      const { personaId } = req.query;
      let query = `
        SELECT c.*, p.cui_dpi, p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido,
               ua.nombre AS unidad_nombre
        FROM sso_consultas_medicas c
        JOIN personas p ON p.id = c.persona_id
        LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
        LEFT JOIN unidades_administrativas ua ON ua.id = rl.unidad_admin_id
      `;
      const params = [];
      if (personaId) {
        params.push(personaId);
        query += ` WHERE c.persona_id = $1`;
      }
      query += ` ORDER BY c.fecha_consulta DESC`;

      const result = await db.query(query, params);
      return res.json({ success: true, total: result.rows.length, data: result.rows });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al listar consultas médicas: " + err.message });
    }
  }

  async createConsultation(req, res) {
    try {
      const {
        persona_id,
        doctora_nombre = "Dra. Claudia Ramos - SCSPR",
        motivo_consulta,
        diagnostico,
        signos_vitales = {},
        tratamiento_indicado,
        genera_reposo = false,
        dias_reposo = 0,
        remite_igss = false,
        observaciones,
      } = req.body;

      if (!persona_id || !motivo_consulta || !diagnostico) {
        return res.status(400).json({ success: false, message: "Colaborador, motivo y diagnóstico son obligatorios" });
      }

      const insertRes = await db.query(
        `INSERT INTO sso_consultas_medicas (
           persona_id, doctora_nombre, motivo_consulta, diagnostico, signos_vitales,
           tratamiento_indicado, genera_reposo, dias_reposo, remite_igss, observaciones
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          persona_id,
          doctora_nombre,
          motivo_consulta,
          diagnostico,
          JSON.stringify(signos_vitales),
          tratamiento_indicado || null,
          genera_reposo,
          dias_reposo || 0,
          remite_igss,
          observaciones || null,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Consulta médica registrada exitosamente",
        data: insertRes.rows[0],
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error al registrar consulta médica: " + err.message });
    }
  }
}

module.exports = new OccupationalHealthController();
