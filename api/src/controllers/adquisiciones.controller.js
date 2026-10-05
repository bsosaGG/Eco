// api/src/controllers/adquisiciones.controller.js
// Módulo: SICOMPRAS - Adquisiciones (Baja Cuantía). Capa HTTP delgada: extrae parámetros de la
// petición, llama al caso de uso correspondiente y arma la respuesta. No contiene reglas de negocio
// ni SQL; los errores (ValidationError, NotFoundError, ConflictError, ...) los resuelve el
// errorHandler global a partir de su `statusCode`. La validación de entrada (express-validator)
// se hace en las rutas.
const catalogos = require("../services/adquisiciones/catalogos.service");
const unidades = require("../services/adquisiciones/unidades.service");
const proveedores = require("../services/adquisiciones/proveedores.service");
const firmantes = require("../services/adquisiciones/firmantes.service");
const usuariosModulo = require("../services/adquisiciones/usuarios-modulo.service");
const insumos = require("../services/adquisiciones/insumos.service");
const expedientes = require("../services/adquisiciones/expedientes.service");
const cotizaciones = require("../services/adquisiciones/cotizaciones.service");
const cdp = require("../services/adquisiciones/cdp.service");
const ordenesCompra = require("../services/adquisiciones/ordenes-compra.service");
const recepcion = require("../services/adquisiciones/recepcion.service");
const faseFinanciera = require("../services/adquisiciones/fase-financiera.service");
const bitacora = require("../services/adquisiciones/bitacora.service");
const reportes = require("../services/adquisiciones/reportes.service");
const solicitudPdf = require("../services/adquisiciones/solicitud-pdf.service");
const notificaciones = require("../services/adquisiciones/notificaciones.service");
const { puedeVerTodos } = require("../services/adquisiciones/domain/visibilidad");
const config = require("../config/adquisiciones.config");
const { ValidationError } = require("../services/adquisiciones/errors");

// Quién hace la petición y si ve todos los expedientes o solo los que emitió (domain/visibilidad.js).
const actorDe = (req) => ({ userId: req.user.userId, verTodo: puedeVerTodos(req.user) });

const handle = (action) => (req, res, next) => Promise.resolve(action(req, res)).catch(next);

class AdquisicionesController {
  // --- Catálogos ---
  getUnidades = handle(async (req, res) => res.json(await catalogos.getUnidades()));
  getRenglones = handle(async (req, res) => res.json(await catalogos.getRenglones()));
  getPartidas = handle(async (req, res) => res.json(await catalogos.getPartidas()));
  getEstados = handle(async (req, res) => res.json(await catalogos.getEstados()));

  // Búsqueda de apoyo en el catálogo público de insumos MAGA/SIGES (sin precio). Nunca debe romper
  // la pantalla de creación: si falla, responde una lista vacía en vez de propagar el error.
  buscarInsumosMaga = async (req, res) => {
    try {
      res.json(await insumos.buscarInsumosMaga(req.query.q));
    } catch (error) {
      console.error("Error inesperado buscando insumos MAGA:", error.message);
      res.json([]);
    }
  };

  // --- Unidades Solicitantes (catálogo administrable) ---
  getAllUnidadesSolicitantes = handle(async (req, res) =>
    res.json(await unidades.getAllUnidadesSolicitantes(req.query.searchQuery || ""))
  );

  createUnidadSolicitante = handle(async (req, res) =>
    res.status(201).json(await unidades.createUnidadSolicitante(req.body))
  );

  updateUnidadSolicitante = handle(async (req, res) =>
    res.json(await unidades.updateUnidadSolicitante(parseInt(req.params.id), req.body))
  );

  // --- Proveedores ---
  getAllProveedores = handle(async (req, res) => {
    const { limit, offset, searchQuery } = req.query;
    res.json(
      await proveedores.getAllProveedores({
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0,
        searchQuery: searchQuery || "",
      })
    );
  });

  getProveedorById = handle(async (req, res) => res.json(await proveedores.getProveedorById(parseInt(req.params.id))));
  createProveedor = handle(async (req, res) => res.status(201).json(await proveedores.createProveedor(req.body)));
  updateProveedor = handle(async (req, res) =>
    res.json(await proveedores.updateProveedor(parseInt(req.params.id), req.body))
  );

  // --- Personas del módulo y firmantes por unidad ---
  getUsuariosModulo = handle(async (req, res) => res.json(await usuariosModulo.getUsuariosModulo()));
  getUsuariosPorUnidad = handle(async (req, res) => res.json(await firmantes.getUsuariosPorUnidad(req.params.idUnidad)));
  getAsignacionesUnidad = handle(async (req, res) =>
    res.json(await firmantes.getAsignacionesUnidad(req.params.idUnidad))
  );

  asignarUsuarioUnidad = handle(async (req, res) => {
    const { id_usuario, cargo } = req.body;
    if (!id_usuario) throw new ValidationError("id_usuario es requerido.");
    res.status(201).json(await firmantes.asignarUsuarioUnidad(req.params.idUnidad, id_usuario, cargo));
  });

  quitarAsignacionUnidad = handle(async (req, res) =>
    res.json(await firmantes.quitarAsignacionUnidad(req.params.idUnidad, req.params.idUsuario))
  );

  // --- Expedientes (CU-01) ---
  getExpedientes = handle(async (req, res) => res.json(await expedientes.listarExpedientes(req.query, actorDe(req))));
  getExpedienteById = handle(async (req, res) =>
    res.json(await expedientes.getExpedientePorId(req.params.id, actorDe(req)))
  );

  crearExpediente = handle(async (req, res) =>
    res.status(201).json(await expedientes.crearExpediente(req.body, req.user.userId))
  );

  descargarSolicitudPdf = handle(async (req, res) => {
    const { buffer, codigoExpediente } = await solicitudPdf.generarSolicitudPdf(req.params.id, actorDe(req));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Solicitud_Compra_${codigoExpediente}.pdf"`);
    res.send(buffer);
  });

  asignarExpediente = handle(async (req, res) => {
    const { id_usuario_asignado } = req.body;
    if (!id_usuario_asignado) throw new ValidationError("id_usuario_asignado es requerido.");
    res.json(await expedientes.asignarExpediente(req.params.id, id_usuario_asignado, req.user.userId));
  });

  cambiarEstado = handle(async (req, res) => {
    const { nuevoEstadoId, comentario } = req.body;
    if (!nuevoEstadoId) throw new ValidationError("nuevoEstadoId es requerido.");
    res.json(await expedientes.cambiarEstado(req.params.id, nuevoEstadoId, comentario, req.user.userId));
  });

  devolverExpediente = handle(async (req, res) => {
    const { etapa_origen, motivo } = req.body;
    if (!etapa_origen || !motivo) throw new ValidationError("etapa_origen y motivo son requeridos.");
    res.json(await expedientes.devolverExpediente(req.params.id, req.body, req.user.userId));
  });

  getBitacora = handle(async (req, res) => res.json(await bitacora.getBitacora(req.params.id)));

  // --- CU-02: Cotizaciones ---
  registrarCotizacion = handle(async (req, res) =>
    res.status(201).json(await cotizaciones.registrarCotizacion(req.params.id, req.body, req.user.userId))
  );

  adjudicarCotizacion = handle(async (req, res) =>
    res.json(await cotizaciones.adjudicarCotizacion(req.params.id, req.params.cotId, req.user.userId))
  );

  // --- CU-03: Certificado de Disponibilidad Presupuestaria ---
  elaborarCdp = handle(async (req, res) =>
    res.status(201).json(await cdp.elaborarCdp(req.params.id, req.body, req.user.userId))
  );
  aprobarCdp = handle(async (req, res) => res.json(await cdp.aprobarCdp(req.params.id, req.user.userId)));
  voboCdp = handle(async (req, res) => res.json(await cdp.voboCdp(req.params.id, req.user.userId)));

  // --- CU-04: Orden de Compra ---
  elaborarOrdenCompra = handle(async (req, res) =>
    res.status(201).json(await ordenesCompra.elaborarOrdenCompra(req.params.id, req.body, req.user.userId))
  );
  aprobarOrdenCompra = handle(async (req, res) =>
    res.json(await ordenesCompra.aprobarOrdenCompra(req.params.id, req.user.userId))
  );
  autorizarOrdenCompra = handle(async (req, res) =>
    res.json(await ordenesCompra.autorizarOrdenCompra(req.params.id, req.user.userId))
  );

  // --- CU-05 / CU-06: Recepción y documentos de soporte ---
  registrarRecepcion = handle(async (req, res) =>
    res.status(201).json(await recepcion.registrarRecepcion(req.params.id, req.body, req.user.userId))
  );

  adjuntarDocumentoSoporte = handle(async (req, res) => {
    if (!req.file) throw new ValidationError("Debe adjuntar un archivo.");
    const archivoUrl = `${config.storage.documentosSoporteUrlPrefix}/${req.file.filename}`;
    res.status(201).json(await recepcion.adjuntarDocumentoSoporte(req.params.id, req.body, archivoUrl, req.user.userId));
  });

  trasladarAContabilidad = handle(async (req, res) =>
    res.json(await recepcion.trasladarAContabilidad(req.params.id, req.user.userId))
  );

  // --- CU-07 / CU-08 / CU-09: Fase financiera ---
  registrarCompromiso = handle(async (req, res) =>
    res.status(201).json(await faseFinanciera.registrarCompromiso(req.params.id, req.body, req.user.userId))
  );
  registrarDevengado = handle(async (req, res) =>
    res.status(201).json(await faseFinanciera.registrarDevengado(req.params.id, req.body, req.user.userId))
  );
  solicitarPago = handle(async (req, res) =>
    res.status(201).json(await faseFinanciera.solicitarPago(req.params.id, req.body, req.user.userId))
  );
  autorizarPago = handle(async (req, res) =>
    res.json(await faseFinanciera.autorizarPago(req.params.id, req.user.userId))
  );

  // --- Avisos de la persona (campana) ---
  getNotificaciones = handle(async (req, res) =>
    res.json(
      await notificaciones.listarMias(req.user.userId, {
        soloNoLeidas: req.query.solo_no_leidas === "true",
        limite: Math.min(parseInt(req.query.limite) || 30, 100),
      })
    )
  );
  marcarNotificacionLeida = handle(async (req, res) =>
    res.json(await notificaciones.marcarLeida(req.params.id, req.user.userId))
  );
  marcarTodasNotificacionesLeidas = handle(async (req, res) =>
    res.json(await notificaciones.marcarTodasLeidas(req.user.userId))
  );

  // --- Reportes / vistas administrativas (listados cross-expediente) ---
  getReporteCotizaciones = handle(async (req, res) => res.json(await reportes.getReporteCotizaciones()));
  getReporteCdp = handle(async (req, res) => res.json(await reportes.getReporteCdp()));
  getReporteOrdenesCompra = handle(async (req, res) => res.json(await reportes.getReporteOrdenesCompra()));
  getReporteFinanciera = handle(async (req, res) => res.json(await reportes.getReporteFinanciera()));
  getReporteResumen = handle(async (req, res) => res.json(await reportes.getReporteResumen()));
}

module.exports = new AdquisicionesController();
