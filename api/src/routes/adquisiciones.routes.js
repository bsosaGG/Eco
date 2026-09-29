// api/src/routes/adquisiciones.routes.js
// Módulo: SICOMPRAS - Adquisiciones (Baja Cuantía)
// Mismo patrón que juridica.routes.js / calendar.routes.js / pac.routes.js:
// verifyToken en todas las rutas, checkPermission('adquisiciones:<accion>') por ruta.

const express = require("express");
const router = express.Router();
const controller = require("../controllers/adquisiciones.controller");
const { verifyToken, checkPermission } = require("../middleware/auth.middleware");
const { body, param } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- MULTER CONFIG (documentos de soporte, CU-06) ---
const storageDocumentosSoporte = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/adquisiciones/documentos-soporte";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadDocumentoSoporte = multer({
  storage: storageDocumentosSoporte,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

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
  controller.createUnidadSolicitante
);
router.put(
  "/unidades/:id",
  checkPermission("adquisiciones:config"),
  [param("id").isInt({ min: 1 }).withMessage("ID de unidad inválido.")],
  controller.updateUnidadSolicitante
);

// --- Proveedores (administración de catálogo: adquisiciones:config) ---
router.get("/proveedores", checkPermission("adquisiciones:read"), controller.getAllProveedores);
router.get(
  "/proveedores/:id",
  checkPermission("adquisiciones:read"),
  [param("id").isInt({ min: 1 }).withMessage("ID de proveedor inválido.")],
  controller.getProveedorById
);
router.post(
  "/proveedores",
  checkPermission("adquisiciones:config"),
  [
    body("razon_social").isString().trim().notEmpty().withMessage("La razón social es requerida."),
    body("nit").isString().trim().notEmpty().withMessage("El NIT es requerido."),
  ],
  controller.createProveedor
);
router.put(
  "/proveedores/:id",
  checkPermission("adquisiciones:config"),
  [param("id").isInt({ min: 1 }).withMessage("ID de proveedor inválido.")],
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
  controller.registrarCotizacion
);
router.post(
  "/expedientes/:id/cotizaciones/:cotId/adjudicar",
  checkPermission("adquisiciones:manage-cotizaciones"),
  [param("cotId").isInt({ min: 1 }).withMessage("ID de cotización inválido.")],
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
  controller.elaborarCdp
);
router.post(
  "/cdp/:id/aprobar",
  checkPermission("adquisiciones:aprobar-cdp"),
  [param("id").isInt({ min: 1 }).withMessage("ID de CDP inválido.")],
  controller.aprobarCdp
);
router.post(
  "/cdp/:id/vobo",
  checkPermission("adquisiciones:vobo-financiero"),
  [param("id").isInt({ min: 1 }).withMessage("ID de CDP inválido.")],
  controller.voboCdp
);

// --- CU-04: Orden de Compra ---
router.post(
  "/expedientes/:id/orden-compra",
  checkPermission("adquisiciones:elaborar-oc"),
  [body("monto_total").isFloat({ min: 0.01 }).withMessage("El monto total es requerido.")],
  controller.elaborarOrdenCompra
);
router.post(
  "/orden-compra/:id/aprobar",
  checkPermission("adquisiciones:aprobar-oc"),
  [param("id").isInt({ min: 1 }).withMessage("ID de Orden de Compra inválido.")],
  controller.aprobarOrdenCompra
);
router.post(
  "/orden-compra/:id/autorizar",
  checkPermission("adquisiciones:autorizar-oc"),
  [param("id").isInt({ min: 1 }).withMessage("ID de Orden de Compra inválido.")],
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
  controller.registrarRecepcion
);
router.post(
  "/expedientes/:id/documentos-soporte",
  checkPermission("adquisiciones:conformar-pago"),
  uploadDocumentoSoporte.single("archivo"),
  [
    param("id").isInt({ min: 1 }).withMessage("ID de expediente inválido."),
    body("tipo_documento")
      .isIn(["FACTURA", "HOJA_1H_INGRESO", "EGRESO_ALMACEN", "CERTIFICADO_SATISFACCION", "OTRO"])
      .withMessage("Tipo de documento inválido."),
  ],
  controller.adjuntarDocumentoSoporte
);
router.post(
  "/expedientes/:id/trasladar-contabilidad",
  checkPermission("adquisiciones:conformar-pago"),
  [param("id").isInt({ min: 1 }).withMessage("ID de expediente inválido.")],
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
  controller.solicitarPago
);
router.post(
  "/solicitud-pago/:id/autorizar",
  checkPermission("adquisiciones:autorizar-pago"),
  [param("id").isInt({ min: 1 }).withMessage("ID de solicitud de pago inválido.")],
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

// --- Reportes / vistas administrativas (listados cross-expediente) ---
router.get("/reportes/cotizaciones", checkPermission("adquisiciones:read"), controller.getReporteCotizaciones);
router.get("/reportes/cdp", checkPermission("adquisiciones:read"), controller.getReporteCdp);
router.get("/reportes/ordenes-compra", checkPermission("adquisiciones:read"), controller.getReporteOrdenesCompra);
router.get("/reportes/financiera", checkPermission("adquisiciones:read"), controller.getReporteFinanciera);
router.get("/reportes/resumen", checkPermission("adquisiciones:read"), controller.getReporteResumen);

module.exports = router;
