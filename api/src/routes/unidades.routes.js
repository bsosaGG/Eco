const express = require("express");
const router = express.Router();
const unidadesController = require("../controllers/unidades.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { body, param } = require("express-validator");

// Rutas de Unidades/Direcciones
router.get("/", authMiddleware.verifyToken, unidadesController.getAllUnidades);

router.get(
  "/:id",
  authMiddleware.verifyToken,
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID de unidad/dirección inválido."),
  ],
  unidadesController.getUnidadById
);

router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    body("nombre")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("El nombre de la unidad/dirección es requerido."),
    body("descripcion")
      .isString()
      .trim()
      .optional({ nullable: true, checkFalsy: true })
      .withMessage("Descripción debe ser una cadena de texto."),
  ],
  unidadesController.createUnidad
);

router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID de unidad/dirección inválido."),
    body("nombre")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("El nombre de la unidad/dirección es requerido."),
    body("descripcion")
      .isString()
      .trim()
      .optional({ nullable: true, checkFalsy: true })
      .withMessage("Descripción debe ser una cadena de texto."),
  ],
  unidadesController.updateUnidad
);

router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID de unidad/dirección inválido."),
  ],
  unidadesController.deleteUnidad
);

module.exports = router;
