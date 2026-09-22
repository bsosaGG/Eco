/**
 * CONTROLADOR RESTFUL: GESTIÓN DE VACACIONES (OLA 2)
 * Secretaría de Comunicación Social de la Presidencia (SCSPR)
 */

const vacationsService = require('../services/vacations.service');
const { buildVacationCollectionLinks } = require('../utils/hateoas.helper');

class VacationsController {
  /**
   * Obtener saldo kardex de vacaciones por colaborador
   */
  async getBalance(req, res) {
    try {
      const { collaboratorId } = req.params;
      const { year } = req.query;
      const balance = await vacationsService.getCollaboratorBalance(collaboratorId, year);

      res.status(200).json({
        success: true,
        data: {
          ...balance,
          _links: {
            self: { href: `/api/v1/vacations/balances/${collaboratorId}?year=${year || new Date().getFullYear()}`, method: 'GET' },
            createRequest: { href: '/api/v1/vacations/requests', method: 'POST' },
            collaborator: { href: `/api/v1/collaborators/${collaboratorId}`, method: 'GET' }
          }
        }
      });
    } catch (error) {
      console.error('Error in getBalance:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Listar solicitudes de vacaciones
   */
  async getRequests(req, res) {
    try {
      const { persona_id, estado, unidad_id, page, limit } = req.query;
      const result = await vacationsService.getVacationRequests({ persona_id, estado, unidad_id, page, limit });

      const dataWithLinks = result.data.map(item => ({
        ...item,
        _links: {
          self: { href: `/api/v1/vacations/requests/${item.id}`, method: 'GET' },
          updateStatus: { href: `/api/v1/vacations/requests/${item.id}/status`, method: 'PATCH' },
          pdf: { href: `/api/v1/vacations/requests/${item.id}/pdf`, method: 'GET' }
        }
      }));

      res.status(200).json({
        success: true,
        total: result.total,
        page: result.page,
        limit: result.limit,
        data: dataWithLinks,
        _links: buildVacationCollectionLinks({ page: result.page, limit: result.limit, total: result.total })
      });
    } catch (error) {
      console.error('Error in getRequests:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Crear nueva solicitud de vacaciones
   */
  async createRequest(req, res) {
    try {
      const { persona_id, fecha_inicio, fecha_fin, observaciones } = req.body;
      if (!persona_id || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Los campos persona_id, fecha_inicio y fecha_fin son obligatorios'
        });
      }

      const newReq = await vacationsService.createVacationRequest(
        { persona_id, fecha_inicio, fecha_fin, observaciones },
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Solicitud de vacaciones creada exitosamente',
        data: {
          ...newReq,
          _links: {
            self: { href: `/api/v1/vacations/requests/${newReq.id}`, method: 'GET' },
            approveJefe: { href: `/api/v1/vacations/requests/${newReq.id}/status`, method: 'PATCH' }
          }
        }
      });
    } catch (error) {
      console.error('Error in createRequest:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Actualizar estado de aprobación (Jefe / RRHH)
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;

      if (!estado) {
        return res.status(400).json({ success: false, message: 'El campo estado es obligatorio' });
      }

      const updated = await vacationsService.updateRequestStatus(id, estado, req.user, observaciones);

      res.status(200).json({
        success: true,
        message: `Estado de la solicitud actualizado a ${estado}`,
        data: {
          ...updated,
          _links: {
            self: { href: `/api/v1/vacations/requests/${id}`, method: 'GET' },
            pdf: { href: `/api/v1/vacations/requests/${id}/pdf`, method: 'GET' }
          }
        }
      });
    } catch (error) {
      console.error('Error in updateStatus:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new VacationsController();
