// api/src/routes/pac.routes.js
const express = require("express");
const router = express.Router();
const pacController = require("../controllers/pac.controller");
const authMiddleware = require("../middleware/auth.middleware"); // Asumo que ya existe
// const { checkPermission } = require("../middleware/permission.middleware"); // Lo crearemos ahora
const { body, param } = require("express-validator");

router.get(
  "/catalogs/unidades",
  authMiddleware.verifyToken,
  pacController.getAllUnidades
);
router.get(
  "/catalogs/modalidades",
  authMiddleware.verifyToken,
  pacController.getAllModalidades
);
router.get(
  "/catalogs/renglones",
  authMiddleware.verifyToken,
  pacController.getAllRenglones
);
router.get(
  "/catalogs/estados",
  authMiddleware.verifyToken,
  pacController.getAllEstados
);

// Endpoint para crear una nueva solicitud
// 1. Verifica que el usuario esté autenticado (authMiddleware)
// 2. Verifica que el usuario tenga el permiso 'pac-item:create' (checkPermission)
// 3. Valida los datos del body
// 4. Llama al controlador
router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.checkPermission("pac-item:create"),
  [
    // Reglas de validación
    body("id_unidad_solicitante")
      .isInt({ min: 1 })
      .withMessage("El ID de la unidad es requerido."),
    body("id_modalidad_compra")
      .isInt({ min: 1 })
      .withMessage("El ID de la modalidad es requerido."),
    body("id_renglon")
      .isInt({ min: 1 })
      .withMessage("El ID del renglón es requerido."),
    body("descripcion")
      .notEmpty()
      .withMessage("La descripción no puede estar vacía."),
    body("unidad_medida")
      .notEmpty()
      .withMessage("La unidad de medida es requerida."),
  ],
  pacController.crearSolicitud
);

// Endpoint para modificar una solicitud
// 1. Verifica que el usuario esté autenticado (authMiddleware)
// 2. Verifica que el usuario tenga el permiso 'pac-item:update' (checkPermission)
// 3. Valida los datos del body
// 4. Llama al controlador
router.put(
  "/:codigo",
  authMiddleware.verifyToken,
  authMiddleware.checkPermission("pac-item:update"),
  [
    // Reglas de validación
    body("id_unidad_solicitante")
      .isInt({ min: 1 })
      .withMessage("El ID de la unidad es requerido."),
    body("id_modalidad_compra")
      .isInt({ min: 1 })
      .withMessage("El ID de la modalidad es requerido."),
    body("id_renglon")
      .isInt({ min: 1 })
      .withMessage("El ID del renglón es requerido."),
    body("descripcion")
      .notEmpty()
      .withMessage("La descripción no puede estar vacía."),
    body("unidad_medida")
      .notEmpty()
      .withMessage("La unidad de medida es requerida."),
  ],
  pacController.modificarSolicitud
);

// GET /api/pac - Obtener todas las solicitudes
router.get(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.checkPermission("pac-item:read"),
  pacController.getAllSolicitudes
);

// GET /api/pac/:codigo - Obtener una solicitud por su código
router.get(
  "/:codigo",
  authMiddleware.verifyToken,
  authMiddleware.checkPermission("pac-item:read"),
  [
    // Validamos que el parámetro 'codigo' no esté vacío
    param("codigo")
      .notEmpty()
      .withMessage("El código de solicitud es requerido."),
  ],
  pacController.getSolicitudPorCodigo
);

router.post(
  "/:codigo/estado",
  authMiddleware.verifyToken,
  authMiddleware.checkPermission("pac-item:manage-status"), // Un nuevo permiso
  pacController.cambiarEstado
);

module.exports = router;
