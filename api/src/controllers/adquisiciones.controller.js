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

  // Búsqueda de apoyo en el catálogo público de insumos MAGA/SIGES (sin precio,
  // ver nota en el service). Nunca debe romper la pantalla de creación: si falla,
  // responde una lista vacía en vez de propagar el error.
  async buscarInsumosMaga(req, res) {
    try {
      const resultados = await service.buscarInsumosMaga(req.query.q);
      res.json(resultados);
    } catch (error) {
      console.error("Error inesperado buscando insumos MAGA:", error.message);
      res.json([]);
    }
  }

  // --- Unidades Solicitantes (catálogo administrable) ---
  async getAllUnidadesSolicitantes(req, res, next) {
    try {
      const { searchQuery } = req.query;
      res.json(await service.getAllUnidadesSolicitantes(searchQuery || ""));
    } catch (error) {
      next(error);
    }
  }

  async createUnidadSolicitante(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const unidad = await service.createUnidadSolicitante(req.body);
      res.status(201).json(unidad);
    } catch (error) {
      next(error);
    }
  }

  async updateUnidadSolicitante(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const unidad = await service.updateUnidadSolicitante(parseInt(req.params.id), req.body);
      if (!unidad) {
        return res.status(404).json({ message: "Unidad solicitante no encontrada para actualizar." });
      }
      res.json(unidad);
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

  async getUsuariosModulo(req, res, next) {
    try {
      res.json(await service.getUsuariosModulo());
    } catch (error) {
      next(error);
    }
  }

  async getAsignacionesUnidad(req, res, next) {
    try {
      res.json(await service.getAsignacionesUnidad(req.params.idUnidad));
    } catch (error) {
      next(error);
    }
  }

  async asignarUsuarioUnidad(req, res, next) {
    try {
      const { id_usuario, cargo } = req.body;
      if (!id_usuario) {
        return res.status(400).json({ message: "id_usuario es requerido." });
      }
      const asignacion = await service.asignarUsuarioUnidad(req.params.idUnidad, id_usuario, cargo);
      res.status(201).json(asignacion);
    } catch (error) {
      next(error);
    }
  }

  async quitarAsignacionUnidad(req, res, next) {
    try {
      res.json(await service.quitarAsignacionUnidad(req.params.idUnidad, req.params.idUsuario));
    } catch (error) {
      next(error);
    }
  }

  async descargarSolicitudPdf(req, res, next) {
    try {
      const { buffer, codigoExpediente } = await service.generarSolicitudPdf(req.params.id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Solicitud_Compra_${codigoExpediente}.pdf"`
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async getUsuariosPorUnidad(req, res, next) {
    try {
      res.json(await service.getUsuariosPorUnidad(req.params.idUnidad));
    } catch (error) {
      next(error);
    }
  }

  async asignarExpediente(req, res, next) {
    try {
      const { id_usuario_asignado } = req.body;
      if (!id_usuario_asignado) {
        return res.status(400).json({ message: "id_usuario_asignado es requerido." });
      }
      const expediente = await service.asignarExpediente(
        req.params.id,
        id_usuario_asignado,
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

  // --- CU-03: Certificado de Disponibilidad Presupuestaria ---
  async elaborarCdp(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const expediente = await service.elaborarCdp(req.params.id, req.body, req.user.userId);
      res.status(201).json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async aprobarCdp(req, res, next) {
    try {
      const expediente = await service.aprobarCdp(req.params.id, req.user.userId);
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async voboCdp(req, res, next) {
    try {
      const expediente = await service.voboCdp(req.params.id, req.user.userId);
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  // --- CU-04: Orden de Compra ---
  async elaborarOrdenCompra(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const expediente = await service.elaborarOrdenCompra(req.params.id, req.body, req.user.userId);
      res.status(201).json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async aprobarOrdenCompra(req, res, next) {
    try {
      const expediente = await service.aprobarOrdenCompra(req.params.id, req.user.userId);
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async autorizarOrdenCompra(req, res, next) {
    try {
      const expediente = await service.autorizarOrdenCompra(req.params.id, req.user.userId);
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async registrarRecepcion(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const expediente = await service.registrarRecepcion(req.params.id, req.body, req.user.userId);
      res.status(201).json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async adjuntarDocumentoSoporte(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Debe adjuntar un archivo." });
    }
    try {
      const archivoUrl = `adquisiciones/documentos-soporte/${req.file.filename}`;
      const expediente = await service.adjuntarDocumentoSoporte(req.params.id, req.body, archivoUrl, req.user.userId);
      res.status(201).json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async trasladarAContabilidad(req, res, next) {
    try {
      const expediente = await service.trasladarAContabilidad(req.params.id, req.user.userId);
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async registrarCompromiso(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const expediente = await service.registrarCompromiso(req.params.id, req.body, req.user.userId);
      res.status(201).json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async registrarDevengado(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const expediente = await service.registrarDevengado(req.params.id, req.body, req.user.userId);
      res.status(201).json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async solicitarPago(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const expediente = await service.solicitarPago(req.params.id, req.body, req.user.userId);
      res.status(201).json(expediente);
    } catch (error) {
      next(error);
    }
  }

  async autorizarPago(req, res, next) {
    try {
      const expediente = await service.autorizarPago(req.params.id, req.user.userId);
      res.json(expediente);
    } catch (error) {
      next(error);
    }
  }

  // --- Reportes / vistas administrativas (listados cross-expediente) ---
  async getReporteCotizaciones(req, res, next) {
    try {
      res.json(await service.getReporteCotizaciones());
    } catch (error) {
      next(error);
    }
  }

  async getReporteCdp(req, res, next) {
    try {
      res.json(await service.getReporteCdp());
    } catch (error) {
      next(error);
    }
  }

  async getReporteOrdenesCompra(req, res, next) {
    try {
      res.json(await service.getReporteOrdenesCompra());
    } catch (error) {
      next(error);
    }
  }

  async getReporteFinanciera(req, res, next) {
    try {
      res.json(await service.getReporteFinanciera());
    } catch (error) {
      next(error);
    }
  }

  async getReporteResumen(req, res, next) {
    try {
      res.json(await service.getReporteResumen());
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdquisicionesController();
