const express = require("express");
const router = express.Router();
const proveedoresController = require("../controllers/proveedores.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { body, param } = require("express-validator");

// Rutas de Proveedores
// Solo usuarios autenticados pueden ver. Admins pueden crear, actualizar, eliminar.

router.get(
  "/",
  authMiddleware.verifyToken,
  proveedoresController.getAllProveedores
);

router.get(
  "/:id",
  authMiddleware.verifyToken,
  [param("id").isInt({ min: 1 }).withMessage("ID de proveedor inválido.")],
  proveedoresController.getProveedorById
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
      .withMessage("El nombre del proveedor es requerido."),
    body("nit")
      .isString()
      .trim()
      .optional({ nullable: true, checkFalsy: true })
      .withMessage("NIT debe ser una cadena de texto."),
  ],
  proveedoresController.createProveedor
);

router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    param("id").isInt({ min: 1 }).withMessage("ID de proveedor inválido."),
    body("nombre")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("El nombre del proveedor es requerido."),
    body("nit")
      .isString()
      .trim()
      .optional({ nullable: true, checkFalsy: true })
      .withMessage("NIT debe ser una cadena de texto."),
  ],
  proveedoresController.updateProveedor
);

router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [param("id").isInt({ min: 1 }).withMessage("ID de proveedor inválido.")],
  proveedoresController.deleteProveedor
);

module.exports = router;
