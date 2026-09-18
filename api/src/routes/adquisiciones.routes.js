// api/src/routes/adquisiciones.routes.js
// Módulo: SICOMPRAS - Adquisiciones (Baja Cuantía)
// Mismo patrón que juridica.routes.js / calendar.routes.js / pac.routes.js:
// verifyToken en todas las rutas, checkPermission('adquisiciones:<accion>') por ruta.

const express = require("express");
const router = express.Router();
const controller = require("../controllers/adquisiciones.controller");
const { verifyToken, checkPermission } = require("../middleware/auth.middleware");
const { body, param } = require("express-validator");

router.use(verifyToken); // todas las rutas de este módulo requieren sesión activa

// --- Catálogos (lectura abierta a cualquier usuario autenticado del módulo) ---
router.get("/catalogos/unidades", checkPermission("adquisiciones:read"), controller.getUnidades);
router.get("/catalogos/renglones", checkPermission("adquisiciones:read"), controller.getRenglones);
router.get("/catalogos/partidas", checkPermission("adquisiciones:read"), controller.getPartidas);
router.get("/catalogos/estados", checkPermission("adquisiciones:read"), controller.getEstados);

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

// --- CU-01: Solicitud de Compra ---
router.get("/expedientes", checkPermission("adquisiciones:read"), controller.getExpedientes);
router.get("/expedientes/:id", checkPermission("adquisiciones:read"), controller.getExpedienteById);
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
router.post("/expedientes/:id/cdp", checkPermission("adquisiciones:elaborar-cdp"), controller.elaborarCdp);
router.post("/cdp/:id/aprobar", checkPermission("adquisiciones:aprobar-cdp"), controller.aprobarCdp);
router.post("/cdp/:id/vobo", checkPermission("adquisiciones:vobo-financiero"), controller.voboCdp);

// --- CU-04: Orden de Compra ---
router.post(
  "/expedientes/:id/orden-compra",
  checkPermission("adquisiciones:elaborar-oc"),
  controller.elaborarOrdenCompra
);
router.post(
  "/orden-compra/:id/aprobar",
  checkPermission("adquisiciones:aprobar-oc"),
  controller.aprobarOrdenCompra
);
router.post(
  "/orden-compra/:id/autorizar",
  checkPermission("adquisiciones:autorizar-oc"),
  controller.autorizarOrdenCompra
);

// --- CU-05 / CU-06: Recepción y documentos de soporte ---
router.post(
  "/orden-compra/:id/recepcion",
  checkPermission("adquisiciones:confirmar-recepcion"),
  controller.registrarRecepcion
);
router.post(
  "/expedientes/:id/documentos-soporte",
  checkPermission("adquisiciones:conformar-pago"),
  controller.adjuntarDocumentoSoporte
);
router.post(
  "/expedientes/:id/trasladar-contabilidad",
  checkPermission("adquisiciones:conformar-pago"),
  controller.trasladarAContabilidad
);

// --- CU-07 / CU-08 / CU-09: Fase financiera ---
router.post(
  "/expedientes/:id/compromiso",
  checkPermission("adquisiciones:registrar-compromiso"),
  controller.registrarCompromiso
);
router.post(
  "/compromiso/:id/devengado",
  checkPermission("adquisiciones:registrar-devengado"),
  controller.registrarDevengado
);
router.post(
  "/devengado/:id/solicitar-pago",
  checkPermission("adquisiciones:solicitar-pago"),
  controller.solicitarPago
);
router.post(
  "/solicitud-pago/:id/autorizar",
  checkPermission("adquisiciones:autorizar-pago"),
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

module.exports = router;
