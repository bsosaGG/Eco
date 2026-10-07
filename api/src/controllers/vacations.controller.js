/**
 * CONTROLADOR RESTFUL: GESTIÓN DE VACACIONES (OLA 2)
 * Secretaría de Comunicación Social de la Presidencia (SCSPR)
 */

const vacationsService = require('../services/vacations.service');
const templatesService = require('../services/templates.service');
const { buildVacationCollectionLinks } = require('../utils/hateoas.helper');

class VacationsController {
  /**
   * Obtener todos los saldos kardex de colaboradores
   */
  async getAllBalances(req, res) {
    try {
      const { year } = req.query;
      const balances = await vacationsService.getAllBalances(year);
      res.status(200).json({
        success: true,
        data: balances
      });
    } catch (error) {
      console.error('Error in getAllBalances:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

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

  /**
   * Obtener detalle enriquecido de solicitud de vacaciones
   */
  async getRequestDetail(req, res) {
    try {
      const { id } = req.params;
      const detail = await vacationsService.getRequestById(id);
      if (!detail) {
        return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
      }

      res.status(200).json({
        success: true,
        data: {
          ...detail,
          _links: {
            self: { href: `/api/v1/vacations/requests/${id}`, method: 'GET' },
            printPdf: { href: `/api/v1/vacations/requests/${id}/print?format=pdf`, method: 'GET' },
            printDocx: { href: `/api/v1/vacations/requests/${id}/print?format=docx`, method: 'GET' },
            updateStatus: { href: `/api/v1/vacations/requests/${id}/status`, method: 'PATCH' }
          }
        }
      });
    } catch (error) {
      console.error('Error in getRequestDetail:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Imprimir Boleta Oficial de Vacaciones mediante plantilla modificable .docx / .pdf
   */
  async printRequest(req, res) {
    try {
      const { id } = req.params;
      const { format = 'pdf' } = req.query;
      const detail = await vacationsService.getRequestById(id);
      if (!detail) {
        return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
      }

      const saldoPrevio = Number(detail.dias_pendientes || 15) + (detail.estado === 'APROBADO_RRHH' ? Number(detail.dias_solicitados) : 0);
      const saldoRemanente = Math.max(0, saldoPrevio - Number(detail.dias_solicitados));

      const templateData = {
        correlativo: detail.correlativo || `SCSPR-VAC-${detail.id.slice(0, 8)}`,
        fecha_solicitud: new Date(detail.created_at).toISOString().slice(0, 10),
        colaborador_nombre: detail.colaborador_nombre || `${detail.primer_nombre} ${detail.primer_apellido}`,
        cui_dpi: detail.cui_dpi || '-',
        renglon_codigo: detail.renglon_codigo || '011',
        puesto_funcional: detail.puesto_funcional || 'Servidor Público',
        unidad_administrativa: detail.unidad_administrativa || 'Secretaría de Comunicación Social',
        fecha_inicio: detail.fecha_inicio ? String(detail.fecha_inicio).slice(0, 10) : '-',
        fecha_fin: detail.fecha_fin ? String(detail.fecha_fin).slice(0, 10) : '-',
        dias_solicitados: String(detail.dias_solicitados || 0),
        saldo_previo: saldoPrevio.toFixed(2),
        saldo_remanente: saldoRemanente.toFixed(2),
        motivo: detail.observaciones || 'Descanso anual correspondiente a período reglamentario.',
        jefe_nombre: detail.jefe_aprobador_nombre || 'Jefe Inmediato Autorizador'
      };

      const result = await templatesService.renderDocument('BOLETA_SOLICITUD_VACACIONES', templateData, format);
      const filename = `Boleta_Vacaciones_${templateData.correlativo}.${result.extension}`;

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.send(result.buffer);
    } catch (error) {
      console.error('Error in printRequest:', error);
      res.status(500).json({ success: false, message: 'Error al generar boleta: ' + error.message });
    }
  }
}

module.exports = new VacationsController();
