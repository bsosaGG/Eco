// api/src/routes/pac.routes.js
const express = require("express");
const router = express.Router();
const pacController = require("../controllers/pac.controller");
const authMiddleware = require("../middleware/auth.middleware"); // Asumo que ya existe
const { checkPermission } = require("../middleware/permission.middleware"); // Lo crearemos ahora
const { body } = require("express-validator");

// Endpoint para crear una nueva solicitud
// 1. Verifica que el usuario esté autenticado (authMiddleware)
// 2. Verifica que el usuario tenga el permiso 'CREAR_PAC' (checkPermission)
// 3. Valida los datos del body
// 4. Llama al controlador
router.post(
  "/",
  authMiddleware.verifyToken,
  checkPermission("CREAR_PAC"),
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

// ... Aquí agregaremos las rutas para GET, PUT, DELETE

module.exports = router;
