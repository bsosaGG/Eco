// api/src/controllers/adquisiciones.controller.js
const service = require("../services/adquisiciones.service");
const { validationResult } = require("express-validator");

// Handler reutilizable para los CU que todavía no se implementan (CU-02 a CU-09).
// Deja la ruta ya registrada con su permiso correcto, pero responde 501 en vez
// de un 404 confuso, y deja explícito en el propio JSON qué falta.
const pendiente = (cu, descripcion) => (req, res) => {
  res.status(501).json({
    message: `Todavía no implementado: ${descripcion} (${cu}).`,
  });
};

class AdquisicionesController {
  // --- Catálogos ---
  async getUnidades(req, res, next) {
    try {
      res.json(await service.getUnidades());
    } catch (error) {
      next(error);
    }
  }

  async getRenglones(req, res, next) {
    try {
      res.json(await service.getRenglones());
    } catch (error) {
      next(error);
    }
  }

  async getPartidas(req, res, next) {
    try {
      res.json(await service.getPartidas());
    } catch (error) {
      next(error);
    }
  }

  async getEstados(req, res, next) {
    try {
      res.json(await service.getEstados());
    } catch (error) {
      next(error);
    }
  }

  // --- Proveedores ---
  async getAllProveedores(req, res, next) {
    try {
      const { limit, offset, searchQuery } = req.query;
      const proveedores = await service.getAllProveedores(
        parseInt(limit) || 100,
        parseInt(offset) || 0,
        searchQuery || ""
      );
      res.json(proveedores);
    } catch (error) {
      next(error);
    }
  }

  async getProveedorById(req, res, next) {
    try {
      const proveedor = await service.getProveedorById(parseInt(req.params.id));
      if (!proveedor) {
        return res.status(404).json({ message: "Proveedor no encontrado." });
      }
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  async createProveedor(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const proveedor = await service.createProveedor(req.body);
      res.status(201).json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  async updateProveedor(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const proveedor = await service.updateProveedor(parseInt(req.params.id), req.body);
      if (!proveedor) {
        return res.status(404).json({ message: "Proveedor no encontrado para actualizar." });
      }
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  // --- Expedientes (CU-01) ---
  async getExpedientes(req, res, next) {
    try {
      res.json(await service.getExpedientes(req.query));
    } catch (error) {
      next(error);
    }
  }

  async getExpedienteById(req, res, next) {
    try {
      const expediente = await service.getExpedienteById(req.params.id);
      if (!expediente) {
        return res.status(404).json({ message: "Expediente no encontrado." });
      }
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async crearExpediente(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const usuarioSolicitanteId = req.user.userId;
      const expediente = await service.crearExpediente(req.body, usuarioSolicitanteId);
      res.status(201).json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async asignarExpediente(req, res, next) {
    try {
      const { funcionario_responsable } = req.body;
      if (!funcionario_responsable) {
        return res.status(400).json({ message: "funcionario_responsable es requerido." });
      }
      const expediente = await service.asignarExpediente(
        req.params.id,
        funcionario_responsable,
        req.user.userId
      );
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const { nuevoEstadoId, comentario } = req.body;
      if (!nuevoEstadoId) {
        return res.status(400).json({ message: "nuevoEstadoId es requerido." });
      }
      const expediente = await service.cambiarEstado(
        req.params.id,
        nuevoEstadoId,
        comentario,
        req.user.userId
      );
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async devolverExpediente(req, res, next) {
    try {
      const { etapa_origen, motivo } = req.body;
      if (!etapa_origen || !motivo) {
        return res.status(400).json({ message: "etapa_origen y motivo son requeridos." });
      }
      const expediente = await service.devolverExpediente(req.params.id, req.body, req.user.userId);
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async getBitacora(req, res, next) {
    try {
      res.json(await service.getBitacora(req.params.id));
    } catch (error) {
      next(error);
    }
  }

  // --- CU-02: Cotizaciones ---
  async registrarCotizacion(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const expediente = await service.registrarCotizacion(req.params.id, req.body, req.user.userId);
      res.status(201).json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async adjudicarCotizacion(req, res, next) {
    try {
      const expediente = await service.adjudicarCotizacion(
        req.params.id,
        req.params.cotId,
        req.user.userId
      );
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  // --- CU-03 a CU-09: pendientes, rutas ya registradas con su permiso final ---
  elaborarCdp = pendiente("CU-03", "Elaborar CDP");
  aprobarCdp = pendiente("CU-03", "Aprobar CDP");
  voboCdp = pendiente("CU-03", "Vo.Bo. financiero del CDP");
  elaborarOrdenCompra = pendiente("CU-04", "Elaborar Orden de Compra");
  aprobarOrdenCompra = pendiente("CU-04", "Aprobar Orden de Compra");
  autorizarOrdenCompra = pendiente("CU-04", "Autorizar Orden de Compra");
  registrarRecepcion = pendiente("CU-05", "Registrar recepción del bien/servicio");
  adjuntarDocumentoSoporte = pendiente("CU-06", "Adjuntar documento de soporte");
  trasladarAContabilidad = pendiente("CU-06", "Trasladar expediente a Contabilidad");
  registrarCompromiso = pendiente("CU-07", "Registrar compromiso presupuestario");
  registrarDevengado = pendiente("CU-08", "Registrar devengado");
  solicitarPago = pendiente("CU-09", "Solicitar pago");
  autorizarPago = pendiente("CU-09", "Autorizar pago");
}

module.exports = new AdquisicionesController();
