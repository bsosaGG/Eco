/**
 * SERVICIO DE NEGOCIO: CONTROL DE ASISTENCIA E INCIDENCIAS BIOMÉTRICAS (OLA 2 - MÓDULO 2)
 * Secretaría de Comunicación Social de la Presidencia (SCSPR)
 */

const db = require('../config/db-core-humanis');
const mockStore = require('../config/mock-store');
const auditService = require('./audit.service');

class AttendanceService {
  /**
   * Evaluar puntualidad de una marca de entrada contra la jornada configurada
   */
  evaluatePunctuality({ entryTime, expectedEntry = '08:00:00', toleranceMinutes = 15 }) {
    const [entryH, entryM] = entryTime.split(':').map(Number);
    const [expH, expM] = expectedEntry.split(':').map(Number);

    const entryTotalMin = entryH * 60 + entryM;
    const expTotalMin = expH * 60 + expM;
    const diffMin = entryTotalMin - expTotalMin;

    if (diffMin <= toleranceMinutes) {
      return { status: 'ON_TIME', delayMinutes: 0 };
    } else {
      return { status: 'DELAYED', delayMinutes: diffMin };
    }
  }

  /**
   * Registrar marcas de asistencia biométrica (Individual o Lote)
   */
  async registerPunches(punches = []) {
    const results = [];
    for (const p of punches) {
      if (db.isHealthy && db.pool) {
        const query = `
          INSERT INTO asistencia_marcas (persona_id, fecha_hora, tipo_marca, dispositivo_id, origen, registrado_por_usuario_id)
          VALUES ($1, $2, $3, COALESCE($4, 'BIOMETRICO_PRINCIPAL'), COALESCE($5, 'BIOMETRICO'), $6)
          RETURNING *
        `;
        const res = await db.pool.query(query, [
          p.persona_id,
          p.fecha_hora,
          p.tipo_marca,
          p.dispositivo_id,
          p.origen,
          p.usuario_id
        ]);
        results.push(res.rows[0]);
      } else {
        results.push({ id: `mock-punch-${Date.now()}`, ...p });
      }
    }
    return results;
  }

  /**
   * Obtener historial de marcas biométricas por persona
   */
  async getPunchesByCollaborator(personaId, limit = 50) {
    if (db.isHealthy && db.pool) {
      const res = await db.pool.query(
        `SELECT * FROM asistencia_marcas WHERE persona_id = $1 ORDER BY fecha_hora DESC LIMIT $2`,
        [personaId, limit]
      );
      return res.rows;
    } else {
      return mockStore.asistenciaMarcas || [];
    }
  }

  /**
   * Actualizar estado de justificación de incidencia (Aprobar / Rechazar)
   */
  async updateIncidentStatus(incidentId, { justificada, motivo, usuario_id }) {
    if (db.isHealthy && db.pool) {
      const res = await db.pool.query(
        `UPDATE asistencia_incidencias
         SET justificada = $1, justificacion_motivo = COALESCE($2, justificacion_motivo), aprobado_por_usuario_id = $3
         WHERE id = $4
         RETURNING *`,
        [justificada, motivo, usuario_id, incidentId]
      );
      return res.rows[0];
    } else {
      return { id: incidentId, justificada, justificacion_motivo: motivo, aprobado_por_usuario_id: usuario_id };
    }
  }

  /**
   * Obtener jornadas institucionales disponibles
   */
  async getJornadas() {
    if (db.isHealthy && db.pool) {
      const res = await db.pool.query(`SELECT * FROM jornadas_institucionales ORDER BY created_at DESC`);
      return res.rows;
    } else {
      return [
        { id: '1', codigo: 'JORNADA_SCSPR_STD', nombre: 'Jornada Ordinaria SCSPR (8:00 a 16:30)', hora_entrada: '08:00:00', hora_salida: '16:30:00', tolerancia_minutos: 15 }
      ];
    }
  }
}

module.exports = new AttendanceService();

