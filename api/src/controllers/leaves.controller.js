/**
 * CONTROLADOR RESTFUL: GESTIÓN DE LICENCIAS Y PERMISOS (OLA 2)
 * Secretaría de Comunicación Social de la Presidencia (SCSPR)
 */

const db = require('../config/db-core-humanis');
const mockStore = require('../config/mock-store');
const auditService = require('../services/audit.service');

class LeavesController {
  async getLeaves(req, res) {
    try {
      const { persona_id, tipo, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      if (db.isHealthy && db.pool) {
        let query = `
          SELECT l.*, p.primer_nombre || ' ' || p.primer_apellido AS colaborador_nombre, p.cui_dpi
          FROM licencias_ausencias l
          JOIN personas p ON l.persona_id = p.id
          WHERE 1=1
        `;
        const values = [];
        let idx = 1;

        if (persona_id) {
          query += ` AND l.persona_id = $${idx++}`;
          values.push(persona_id);
        }
        if (tipo) {
          query += ` AND l.tipo_licencia = $${idx++}`;
          values.push(tipo);
        }

        query += ` ORDER BY l.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
        values.push(limit, offset);

        const result = await db.pool.query(query, values);
        const countRes = await db.pool.query(`SELECT COUNT(*) FROM licencias_ausencias`);

        return res.status(200).json({
          success: true,
          total: parseInt(countRes.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          data: result.rows.map(row => ({
            ...row,
            _links: {
              self: { href: `/api/v1/leaves/${row.id}`, method: 'GET' },
              collaborator: { href: `/api/v1/collaborators/${row.persona_id}`, method: 'GET' }
            }
          }))
        });
      } else {
        const mockData = mockStore.licencias || [];
        return res.status(200).json({
          success: true,
          total: mockData.length,
          page: 1,
          limit: 10,
          data: mockData
        });
      }
    } catch (error) {
      console.error('Error in getLeaves:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createLeave(req, res) {
    try {
      const { persona_id, tipo_licencia, fecha_inicio, fecha_fin, documento_soporte_num, observaciones } = req.body;
      if (!persona_id || !tipo_licencia || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Los campos persona_id, tipo_licencia, fecha_inicio y fecha_fin son obligatorios'
        });
      }

      const start = new Date(fecha_inicio);
      const end = new Date(fecha_fin);
      const diasTotales = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

      const year = new Date().getFullYear();
      const countRes = db.isHealthy && db.pool ? await db.pool.query(`SELECT COUNT(*) FROM licencias_ausencias`) : { rows: [{ count: 1 }] };
      const num = parseInt(countRes.rows[0].count) + 1;
      const correlativo = `SCSPR-LIC-${year}-${String(num).padStart(4, '0')}`;

      if (db.isHealthy && db.pool) {
        const result = await db.pool.query(
          `INSERT INTO licencias_ausencias (
            correlativo, persona_id, tipo_licencia, fecha_inicio, fecha_fin, dias_totales,
            documento_soporte_num, estado, observaciones, registrado_por_usuario_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'APROBADO', $8, $9)
          RETURNING *`,
          [correlativo, persona_id, tipo_licencia, fecha_inicio, fecha_fin, diasTotales, documento_soporte_num || '', observaciones || '', req.user.id]
        );

        const newLeave = result.rows[0];

        await auditService.logAction({
          usuario_id: req.user.id,
          accion: 'CREATE_LEAVE',
          tabla_afectada: 'licencias_ausencias',
          registro_id: newLeave.id,
          valores_nuevos: newLeave
        });

        return res.status(201).json({
          success: true,
          message: 'Licencia registrada exitosamente',
          data: {
            ...newLeave,
            _links: {
              self: { href: `/api/v1/leaves/${newLeave.id}`, method: 'GET' }
            }
          }
        });
      } else {
        const mockLeave = {
          id: `mock-leave-${Date.now()}`,
          correlativo,
          persona_id,
          tipo_licencia,
          fecha_inicio,
          fecha_fin,
          dias_totales: diasTotales,
          estado: 'APROBADO',
          created_at: new Date().toISOString()
        };
        if (!mockStore.licencias) mockStore.licencias = [];
        mockStore.licencias.push(mockLeave);

        return res.status(201).json({
          success: true,
          message: 'Licencia registrada exitosamente (mock)',
          data: mockLeave
        });
      }
    } catch (error) {
      console.error('Error in createLeave:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new LeavesController();
