// api/src/routes/adquisiciones.routes.js
// Módulo: SICOMPRAS - Adquisiciones (Baja Cuantía)
// Mismo patrón que planMedios.routes.js / juridica.routes.js / calendar.routes.js / pac.routes.js:
// verifyToken en todas las rutas, checkPermission('adquisiciones:<accion>') por ruta y la validación
// de entrada con express-validator aquí (el controlador ya no la repite).

const express = require("express");
const router = express.Router();
const controller = require("../controllers/adquisiciones.controller");
const uploadDocumentoSoporte = require("../middleware/uploadDocumentoSoporteAdquisiciones");
const config = require("../config/adquisiciones.config");
const { verifyToken, checkPermission } = require("../middleware/auth.middleware");
const { body, param, validationResult } = require("express-validator");
const { puedeVerTodos } = require("../services/adquisiciones/domain/visibilidad");

// Responde 400 con el detalle si alguna validación de express-validator falló.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// Los listados cross-expediente (reportes) son solo para quien ve todos los expedientes; quien
// únicamente emite solicitudes ve las suyas en la bandeja.
const requireVerTodo = (req, res, next) => {
  if (puedeVerTodos(req.user)) return next();
  return res.status(403).json({ message: "Acceso denegado. Este reporte es solo para el personal de gestión." });
};

router.use(verifyToken); // todas las rutas de este módulo requieren sesión activa

// --- Catálogos (lectura abierta a cualquier usuario autenticado del módulo) ---
router.get("/catalogos/unidades", checkPermission("adquisiciones:read"), controller.getUnidades);
router.get("/catalogos/renglones", checkPermission("adquisiciones:read"), controller.getRenglones);
router.get("/catalogos/partidas", checkPermission("adquisiciones:read"), controller.getPartidas);
router.get("/catalogos/estados", checkPermission("adquisiciones:read"), controller.getEstados);
router.get("/insumos-maga", checkPermission("adquisiciones:create"), controller.buscarInsumosMaga);
router.get(
  "/catalogos/unidades/:idUnidad/usuarios",
  checkPermission("adquisiciones:create"),
  controller.getUsuariosPorUnidad
);

// --- Firmantes por unidad (administración: adquisiciones:config) ---
router.get(
  "/catalogos/unidades/:idUnidad/asignaciones",
  checkPermission("adquisiciones:config"),
  controller.getAsignacionesUnidad
);
router.post(
  "/catalogos/unidades/:idUnidad/asignaciones",
  checkPermission("adquisiciones:config"),
  controller.asignarUsuarioUnidad
);
router.delete(
  "/catalogos/unidades/:idUnidad/asignaciones/:idUsuario",
  checkPermission("adquisiciones:config"),
  controller.quitarAsignacionUnidad
);

// --- Unidades Solicitantes (administración de catálogo: adquisiciones:config) ---
router.get("/unidades", checkPermission("adquisiciones:read"), controller.getAllUnidadesSolicitantes);
router.post(
  "/unidades",
  checkPermission("adquisiciones:config"),
  [
    body("nombre").isString().trim().notEmpty().withMessage("El nombre de la unidad es requerido."),
    body("codigo_unidad").isString().trim().notEmpty().withMessage("El código de la unidad es requerido."),
  ],
  validate,
  controller.createUnidadSolicitante
);
router.put(
  "/unidades/:id",
  checkPermission("adquisiciones:config"),
  [param("id").isInt({ min: 1 }).withMessage("ID de unidad inválido.")],
  validate,
  controller.updateUnidadSolicitante
);

// --- Proveedores (administración de catálogo: adquisiciones:config) ---
router.get("/proveedores", checkPermission("adquisiciones:read"), controller.getAllProveedores);
router.get(
  "/proveedores/:id",
  checkPermission("adquisiciones:read"),
  [param("id").isInt({ min: 1 }).withMessage("ID de proveedor inválido.")],
  validate,
  controller.getProveedorById
);
router.post(
  "/proveedores",
  checkPermission("adquisiciones:config"),
  [
    body("razon_social").isString().trim().notEmpty().withMessage("La razón social es requerida."),
    body("nit").isString().trim().notEmpty().withMessage("El NIT es requerido."),
  ],
  validate,
  controller.createProveedor
);
router.put(
  "/proveedores/:id",
  checkPermission("adquisiciones:config"),
  [param("id").isInt({ min: 1 }).withMessage("ID de proveedor inválido.")],
  validate,
  controller.updateProveedor
);

// --- Usuarios del módulo (para el selector de "Asignar a", CU-01 paso 2) ---
// Cualquiera que pueda asignar necesita ver la lista de personas asignables;
// no requiere ser admin (a diferencia de GET /api/user, que sí es solo para admins).
router.get("/usuarios", checkPermission("adquisiciones:assign"), controller.getUsuariosModulo);

// --- CU-01: Solicitud de Compra ---
router.get("/expedientes", checkPermission("adquisiciones:read"), controller.getExpedientes);
router.get("/expedientes/:id", checkPermission("adquisiciones:read"), controller.getExpedienteById);
router.get("/expedientes/:id/pdf", checkPermission("adquisiciones:read"), controller.descargarSolicitudPdf);
router.post(
  "/expedientes",
  checkPermission("adquisiciones:create"),
  [
    body("id_unidad_solicitante").isInt({ min: 1 }).withMessage("La unidad solicitante es requerida."),
    body("objeto_compra").notEmpty().withMessage("El objeto de la compra es requerido."),
    body("justificacion").notEmpty().withMessage("La justificación es requerida."),
  ],
  validate,
  controller.crearExpediente
);
router.post(
  "/expedientes/:id/asignar",
  checkPermission("adquisiciones:assign"),
  controller.asignarExpediente
);

// --- CU-02: Cotizaciones ---
router.post(
  "/expedientes/:id/cotizaciones",
  checkPermission("adquisiciones:manage-cotizaciones"),
  [
    body("id_proveedor").isInt({ min: 1 }).withMessage("El proveedor es requerido."),
    body("monto_ofertado").isFloat({ min: 0 }).withMessage("El monto ofertado es requerido."),
  ],
  validate,
  controller.registrarCotizacion
);
router.post(
  "/expedientes/:id/cotizaciones/:cotId/adjudicar",
  checkPermission("adquisiciones:manage-cotizaciones"),
  [param("cotId").isInt({ min: 1 }).withMessage("ID de cotización inválido.")],
  validate,
  controller.adjudicarCotizacion
);

// --- CU-03: Certificado de Disponibilidad Presupuestaria ---
router.post(
  "/expedientes/:id/cdp",
  checkPermission("adquisiciones:elaborar-cdp"),
  [
    body("id_partida").isInt({ min: 1 }).withMessage("La partida presupuestaria es requerida."),
    body("monto_reservado").isFloat({ min: 0.01 }).withMessage("El monto a reservar es requerido."),
  ],
  validate,
  controller.elaborarCdp
);
router.post(
  "/cdp/:id/aprobar",
  checkPermission("adquisiciones:aprobar-cdp"),
  [param("id").isInt({ min: 1 }).withMessage("ID de CDP inválido.")],
  validate,
  controller.aprobarCdp
);
router.post(
  "/cdp/:id/vobo",
  checkPermission("adquisiciones:vobo-financiero"),
  [param("id").isInt({ min: 1 }).withMessage("ID de CDP inválido.")],
  validate,
  controller.voboCdp
);

// --- CU-04: Orden de Compra ---
router.post(
  "/expedientes/:id/orden-compra",
  checkPermission("adquisiciones:elaborar-oc"),
  [body("monto_total").isFloat({ min: 0.01 }).withMessage("El monto total es requerido.")],
  validate,
  controller.elaborarOrdenCompra
);
router.post(
  "/orden-compra/:id/aprobar",
  checkPermission("adquisiciones:aprobar-oc"),
  [param("id").isInt({ min: 1 }).withMessage("ID de Orden de Compra inválido.")],
  validate,
  controller.aprobarOrdenCompra
);
router.post(
  "/orden-compra/:id/autorizar",
  checkPermission("adquisiciones:autorizar-oc"),
  [param("id").isInt({ min: 1 }).withMessage("ID de Orden de Compra inválido.")],
  validate,
  controller.autorizarOrdenCompra
);

// --- CU-05 / CU-06: Recepción y documentos de soporte ---
router.post(
  "/orden-compra/:id/recepcion",
  checkPermission("adquisiciones:confirmar-recepcion"),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de Orden de Compra inválido."),
    body("recibido_conforme").exists().withMessage("Debe indicar si se recibió conforme."),
  ],
  validate,
  controller.registrarRecepcion
);
router.post(
  "/expedientes/:id/documentos-soporte",
  checkPermission("adquisiciones:conformar-pago"),
  uploadDocumentoSoporte,
  [
    param("id").isInt({ min: 1 }).withMessage("ID de expediente inválido."),
    body("tipo_documento").isIn(config.documentosSoporte.tipos).withMessage("Tipo de documento inválido."),
  ],
  validate,
  controller.adjuntarDocumentoSoporte
);
router.post(
  "/expedientes/:id/trasladar-contabilidad",
  checkPermission("adquisiciones:conformar-pago"),
  [param("id").isInt({ min: 1 }).withMessage("ID de expediente inválido.")],
  validate,
  controller.trasladarAContabilidad
);

// --- CU-07 / CU-08 / CU-09: Fase financiera ---
router.post(
  "/expedientes/:id/compromiso",
  checkPermission("adquisiciones:registrar-compromiso"),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de expediente inválido."),
    body("monto_comprometido").isFloat({ min: 0.01 }).withMessage("El monto comprometido es requerido."),
  ],
  validate,
  controller.registrarCompromiso
);
router.post(
  "/compromiso/:id/devengado",
  checkPermission("adquisiciones:registrar-devengado"),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de compromiso inválido."),
    body("monto_devengado").isFloat({ min: 0.01 }).withMessage("El monto devengado es requerido."),
    body("retencion_isr").optional().isFloat({ min: 0 }).withMessage("La retención de ISR debe ser un número válido."),
  ],
  validate,
  controller.registrarDevengado
);
router.post(
  "/devengado/:id/solicitar-pago",
  checkPermission("adquisiciones:solicitar-pago"),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de devengado inválido."),
    body("entidad_bancaria").notEmpty().withMessage("La entidad bancaria es requerida."),
    body("tipo_cuenta").notEmpty().withMessage("El tipo de cuenta es requerido."),
    body("numero_cuenta").notEmpty().withMessage("El número de cuenta es requerido."),
  ],
  validate,
  controller.solicitarPago
);
router.post(
  "/solicitud-pago/:id/autorizar",
  checkPermission("adquisiciones:autorizar-pago"),
  [param("id").isInt({ min: 1 }).withMessage("ID de solicitud de pago inválido.")],
  validate,
  controller.autorizarPago
);

// --- Transversales ---
router.put(
  "/expedientes/:id/estado",
  checkPermission("adquisiciones:read"), // el propio cambio granular lo valida cada flujo específico arriba; esta ruta genérica queda para casos administrativos
  controller.cambiarEstado
);
router.post(
  "/expedientes/:id/devolver",
  checkPermission("adquisiciones:devolver"),
  controller.devolverExpediente
);
router.get(
  "/expedientes/:id/bitacora",
  checkPermission("adquisiciones:audit"),
  controller.getBitacora
);

// --- Avisos de la persona (campana): cada quien ve y marca solo los suyos ---
router.get("/notificaciones", checkPermission("adquisiciones:read"), controller.getNotificaciones);
router.post("/notificaciones/leer-todas", checkPermission("adquisiciones:read"), controller.marcarTodasNotificacionesLeidas);
router.post(
  "/notificaciones/:id/leida",
  checkPermission("adquisiciones:read"),
  [param("id").isInt({ min: 1 }).withMessage("ID de aviso inválido.")],
  validate,
  controller.marcarNotificacionLeida
);

// --- Reportes / vistas administrativas (listados cross-expediente) ---
router.get("/reportes/cotizaciones", checkPermission("adquisiciones:read"), requireVerTodo, controller.getReporteCotizaciones);
router.get("/reportes/cdp", checkPermission("adquisiciones:read"), requireVerTodo, controller.getReporteCdp);
router.get("/reportes/ordenes-compra", checkPermission("adquisiciones:read"), requireVerTodo, controller.getReporteOrdenesCompra);
router.get("/reportes/financiera", checkPermission("adquisiciones:read"), requireVerTodo, controller.getReporteFinanciera);
router.get("/reportes/resumen", checkPermission("adquisiciones:read"), requireVerTodo, controller.getReporteResumen);

module.exports = router;
