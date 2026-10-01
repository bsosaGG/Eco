// api/src/routes/planMedios.routes.js
// Módulo: Plan de Medios (Formulario Automatizado de Plan de Medios).
// Antes este archivo solo reenviaba las peticiones a un servicio Python; ahora el
// módulo corre dentro del core, con el mismo patrón que adquisiciones.routes.js:
// verifyToken en todas las rutas y checkPermission('plan-medios:<acción>') por ruta.
//
// Permisos: read (consultar), create (subir Brief), update (guardar el formulario,
// diccionario, borrador con IA) y export (generar/descargar documentos).

const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const router = express.Router();
const controller = require("../controllers/planMedios.controller");
const uploadBrief = require("../middleware/uploadBriefPlanMedios");
const { verifyToken, checkPermission } = require("../middleware/auth.middleware");

const EXPEDIENTE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

// Responde 400 con el detalle si alguna validación de express-validator falló.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Datos de entrada inválidos.", errors: errors.array() });
  next();
};

const expedienteId = param("id").matches(EXPEDIENTE_ID_PATTERN).withMessage("Identificador de expediente inválido.");
const mediaIndex = param("index").isInt({ min: 0 }).withMessage("El índice del medio debe ser un entero >= 0.");
const limite = query("limite").optional().isInt({ min: 1, max: 500 }).withMessage("El límite debe estar entre 1 y 500.");

// --- Salud (sin sesión: usado por el despliegue para saber si el módulo responde) ---
router.get("/health", controller.health);

router.use(verifyToken); // el resto del módulo requiere sesión activa

// --- Catálogo de medios (solo lectura) ---
router.get("/medios/catalogo/estado", checkPermission("plan-medios:read"), controller.estadoCatalogo);
router.get("/medios", checkPermission("plan-medios:read"), [limite], validate, controller.listarMedios);
router.get(
  "/medios/:id",
  checkPermission("plan-medios:read"),
  [param("id").isInt({ min: 1 }).withMessage("El identificador del medio debe ser un entero.")],
  validate,
  controller.obtenerMedio
);

// --- Expedientes ---
router.get("/expedientes", checkPermission("plan-medios:read"), [limite], validate, controller.listarExpedientes);
router.post("/expedientes", checkPermission("plan-medios:create"), uploadBrief, controller.crearExpediente);
router.get("/expedientes/:id", checkPermission("plan-medios:read"), [expedienteId], validate, controller.obtenerExpediente);
router.put(
  "/expedientes/:id/resumen",
  checkPermission("plan-medios:update"),
  [
    expedienteId,
    body().isObject().withMessage("El cuerpo de la petición debe ser un objeto JSON."),
    body("fields").optional().isObject().withMessage("fields debe ser un objeto."),
    body("media_entries").optional().isArray({ max: 50 }).withMessage("media_entries debe ser una lista de hasta 50 medios."),
    body("planning_action").optional().isIn(["draft", "continue", "generate"]).withMessage("Acción de planificación inválida."),
    body("priorities").optional().isObject().withMessage("priorities debe ser un objeto."),
  ],
  validate,
  controller.guardarResumen
);
router.get(
  "/expedientes/:id/ranking-medios",
  checkPermission("plan-medios:read"),
  [expedienteId, query("limite").optional().isInt({ min: 1, max: 10 }).withMessage("El límite debe estar entre 1 y 10.")],
  validate,
  controller.rankingMedios
);
router.get("/expedientes/:id/auditoria", checkPermission("plan-medios:read"), [expedienteId, limite], validate, controller.auditoria);

// --- Plan de Medios (Word) ---
router.post("/expedientes/:id/plan-medios", checkPermission("plan-medios:export"), [expedienteId], validate, controller.generarPlanMedios);
router.get(
  "/expedientes/:id/documentos/plan-medios",
  checkPermission("plan-medios:export"),
  [expedienteId],
  validate,
  controller.descargarPlanMedios
);

// --- Solicitudes de Compra (Excel) ---
router.post(
  "/expedientes/:id/solicitudes-compra/:index/preparar",
  checkPermission("plan-medios:export"),
  [expedienteId, mediaIndex],
  validate,
  controller.prepararSolicitud
);
router.post(
  "/expedientes/:id/solicitudes-compra/:index/generar",
  checkPermission("plan-medios:export"),
  [expedienteId, mediaIndex],
  validate,
  controller.generarSolicitud
);
router.get(
  "/expedientes/:id/documentos/solicitud-compra/:index",
  checkPermission("plan-medios:export"),
  [expedienteId, mediaIndex],
  validate,
  controller.descargarSolicitud
);
router.post(
  "/expedientes/:id/solicitudes-compra/:index/justificacion-ia",
  checkPermission("plan-medios:update"),
  [expedienteId, mediaIndex],
  validate,
  controller.justificacionIA
);

// --- Revisión ortográfica y diccionario institucional ---
router.post(
  "/revision-ortografica",
  checkPermission("plan-medios:read"),
  [
    body("text").isString().withMessage("El texto a revisar es requerido.").isLength({ max: 50000 }).withMessage("El texto es demasiado largo."),
    body("language").optional().isString().isLength({ max: 10 }),
  ],
  validate,
  controller.revisarTexto
);
router.post(
  "/diccionario-institucional",
  checkPermission("plan-medios:update"),
  [body("term").isString().withMessage("El término es requerido.")],
  validate,
  controller.agregarTermino
);

module.exports = router;
