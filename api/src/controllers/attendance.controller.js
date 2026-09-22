/**
 * CONTROLADOR RESTFUL: GESTIÓN DE ASISTENCIA E INCIDENCIAS (OLA 2)
 * Secretaría de Comunicación Social de la Presidencia (SCSPR)
 */

const db = require('../config/db-core-humanis');
const mockStore = require('../config/mock-store');
const auditService = require('../services/audit.service');

class AttendanceController {
  async getIncidents(req, res) {
    try {
      const { persona_id, fecha, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      if (db.isHealthy && db.pool) {
        let query = `
          SELECT ai.*, p.primer_nombre || ' ' || p.primer_apellido AS colaborador_nombre, p.cui_dpi
          FROM asistencia_incidencias ai
          JOIN personas p ON ai.persona_id = p.id
          WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (persona_id) {
          query += ` AND ai.persona_id = $${idx++}`;
          values.push(persona_id);
        }
        if (fecha) {
          query += ` AND ai.fecha = $${idx++}`;
          values.push(fecha);
        }

        query += ` ORDER BY ai.fecha DESC, ai.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        values.push(limit, offset);

        const result = await db.pool.query(query, values);
        const countRes = await db.pool.query(`SELECT COUNT(*) FROM asistencia_incidencias`);

        return res.status(200).json({
          success: true,
          total: parseInt(countRes.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          data: result.rows.map(row => ({
            ...row,
            _links: {
              self: { href: `/api/v1/attendance/incidents/${row.id}`, method: 'GET' },
              collaborator: { href: `/api/v1/collaborators/${row.persona_id}`, method: 'GET' }
            }
          }))
        });
      } else {
        const mockData = mockStore.incidencias || [];
        return res.status(200).json({
          success: true,
          total: mockData.length,
          page: 1,
          limit: 10,
          data: mockData
        });
      }
    } catch (error) {
      console.error('Error in getIncidents:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createIncident(req, res) {
    try {
      const { persona_id, fecha, tipo_incidencia, minutos_retraso, justificada, justificacion_motivo } = req.body;
      if (!persona_id || !fecha || !tipo_incidencia) {
        return res.status(400).json({
          success: false,
          message: 'Los campos persona_id, fecha y tipo_incidencia son obligatorios'
        });
      }

      if (db.isHealthy && db.pool) {
        const result = await db.pool.query(
          `INSERT INTO asistencia_incidencias (
            persona_id, fecha, tipo_incidencia, minutos_retraso, justificada, justificacion_motivo, aprobado_por_usuario_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [persona_id, fecha, tipo_incidencia, minutos_retraso || 0, justificada || false, justificacion_motivo || '', req.user.id]
        );

        const newIncident = result.rows[0];

        await auditService.logAction({
          usuario_id: req.user.id,
          accion: 'CREATE_ATTENDANCE_INCIDENT',
          tabla_afectada: 'asistencia_incidencias',
          registro_id: newIncident.id,
          valores_nuevos: newIncident
        });

        return res.status(201).json({
          success: true,
          message: 'Incidencia de asistencia registrada exitosamente',
          data: {
            ...newIncident,
            _links: {
              self: { href: `/api/v1/attendance/incidents/${newIncident.id}`, method: 'GET' }
            }
          }
        });
      } else {
        const mockIncident = {
          id: `mock-incident-${Date.now()}`,
          persona_id,
          fecha,
          tipo_incidencia,
          minutos_retraso: minutos_retraso || 0,
          justificada: justificada || false,
          created_at: new Date().toISOString()
        };
        if (!mockStore.incidencias) mockStore.incidencias = [];
        mockStore.incidencias.push(mockIncident);

        return res.status(201).json({
          success: true,
          message: 'Incidencia registrada exitosamente (mock)',
          data: mockIncident
        });
      }
    } catch (error) {
      console.error('Error in createIncident:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async registerPunches(req, res) {
    try {
      const attendanceService = require('../services/attendance.service');
      const punches = Array.isArray(req.body) ? req.body : [req.body];
      const results = await attendanceService.registerPunches(punches);
      res.status(201).json({
        success: true,
        message: `${results.length} marcajes biométricos procesados exitosamente`,
        data: results
      });
    } catch (error) {
      console.error('Error in registerPunches:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPunches(req, res) {
    try {
      const attendanceService = require('../services/attendance.service');
      const { persona_id } = req.params;
      const punches = await attendanceService.getPunchesByCollaborator(persona_id);
      res.status(200).json({
        success: true,
        total: punches.length,
        data: punches
      });
    } catch (error) {
      console.error('Error in getPunches:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateIncidentStatus(req, res) {
    try {
      const attendanceService = require('../services/attendance.service');
      const { id } = req.params;
      const { justificada, motivo } = req.body;
      const updated = await attendanceService.updateIncidentStatus(id, {
        justificada,
        motivo,
        usuario_id: req.user?.id
      });
      res.status(200).json({
        success: true,
        message: 'Estado de la incidencia actualizado exitosamente',
        data: updated
      });
    } catch (error) {
      console.error('Error in updateIncidentStatus:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getJornadas(req, res) {
    try {
      const attendanceService = require('../services/attendance.service');
      const jornadas = await attendanceService.getJornadas();
      res.status(200).json({
        success: true,
        data: jornadas
      });
    } catch (error) {
      console.error('Error in getJornadas:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AttendanceController();


