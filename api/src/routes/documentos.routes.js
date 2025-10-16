// api/src/routes/documentos.routes.js
const express = require("express");
const router = express.Router();
const documentosController = require("../controllers/documentos.controller");
const {
  verifyToken,
  checkPermission,
} = require("../middleware/auth.middleware");
// CORRECCIÓN: Importamos el nuevo middleware específico para plantillas.
const uploadPlantillaMiddleware = require("../middleware/uploadPlantilla");
const { param, body } = require("express-validator");

// POST /api/documentos/plantillas - Sube una nueva plantilla .docx
router.post(
  "/plantillas",
  verifyToken,
  checkPermission("documentos-plantilla:create"),
  // CORRECCIÓN: Usamos el middleware directamente, como en tu patrón user.routes.js.
  uploadPlantillaMiddleware,
  documentosController.crearPlantilla
);

// GET /api/documentos/plantillas - Obtiene una lista de las plantillas (metadatos)
router.get(
  "/plantillas",
  verifyToken,
  checkPermission("documentos-plantilla:read"),
  documentosController.obtenerPlantillas
);

// PUT /api/documentos/plantillas/:id - Actualiza metadatos de una plantilla
router.put(
  "/plantillas/:id",
  verifyToken,
  checkPermission("documentos-plantilla:update"),
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID de la plantilla debe ser un número entero."),
    body("nombre").notEmpty().withMessage("El nombre no puede estar vacío."),
  ],
  documentosController.actualizarPlantilla
);

// DELETE /api/documentos/plantillas/:id - Elimina una plantilla
router.delete(
  "/plantillas/:id",
  verifyToken,
  checkPermission("documentos-plantilla:delete"),
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID de la plantilla debe ser un número entero."),
  ],
  documentosController.eliminarPlantilla
);

// POST /api/documentos/plantillas/:id/generar - Genera un documento
router.post(
  "/plantillas/:id/generar",
  verifyToken,
  checkPermission("documentos-plantilla:generate"),
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID de la plantilla debe ser un número entero."),
    body("datos")
      .isObject()
      .withMessage("El campo 'datos' debe ser un objeto JSON."),
  ],
  documentosController.generarDocumento
);

module.exports = router;
