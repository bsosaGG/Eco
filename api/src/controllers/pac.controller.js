// api/src/controllers/pac.controller.js
const pacService = require("../services/pac.service");
const { validationResult } = require("express-validator");

class PacController {
  async crearSolicitud(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // El ID del usuario que crea la solicitud viene del token JWT,
      // que el middleware de autenticación ya debió haber verificado.
      const responsableUsuarioId = req.user.userId;

      const nuevaSolicitud = await pacService.crearSolicitud(
        req.body,
        responsableUsuarioId
      );
      res.status(201).json(nuevaSolicitud);
    } catch (error) {
      next(error);
    }
  }

  async modificarSolicitud(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { codigo } = req.params;

      const mSolicitud = await pacService.updateSolicitud(codigo, req.body);
      res.status(201).json(mSolicitud);
    } catch (error) {
      next(error);
    }
  }

  async getAllSolicitudes(req, res, next) {
    try {
      // Los filtros y la paginación vienen como query parameters
      const solicitudes = await pacService.getAllSolicitudes(req.query);
      res.json(solicitudes);
    } catch (error) {
      next(error);
    }
  }

  async getSolicitudPorCodigo(req, res, next) {
    try {
      const { codigo } = req.params;
      // La URL viene codificada, express la decodifica automáticamente
      const solicitud = await pacService.getSolicitudPorCodigo(codigo);

      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada." });
      }
      res.json(solicitud);
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const { codigo } = req.params;
      const { nuevoEstadoId, comentario } = req.body;
      const usuarioId = req.user.userId; // Obtenido del token

      if (!nuevoEstadoId) {
        return res
          .status(400)
          .json({ message: "El nuevo estado es requerido." });
      }

      const result = await pacService.cambiarEstadoSolicitud(
        codigo,
        nuevoEstadoId,
        comentario,
        usuarioId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllUnidades(req, res, next) {
    try {
      const unidades = await pacService.getAllUnidades();
      res.json(unidades);
    } catch (error) {
      next(error);
    }
  }

  async getAllModalidades(req, res, next) {
    try {
      const modalidades = await pacService.getAllModalidades();
      res.json(modalidades);
    } catch (error) {
      next(error);
    }
  }

  async getAllRenglones(req, res, next) {
    try {
      const renglones = await pacService.getAllRenglones();
      res.json(renglones);
    } catch (error) {
      next(error);
    }
  }

  async getAllEstados(req, res, next) {
    try {
      const estados = await pacService.getAllEstados();
      res.json(estados);
    } catch (error) {
      next(error);
    }
  }

  async getReportePorRenglon(req, res, next) {
    try {
      const reporteData = await pacService.getReportePorRenglon();
      res.json(reporteData);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PacController();
