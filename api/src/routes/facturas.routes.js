const express = require("express");
const router = express.Router();
const facturasController = require("../controllers/facturas.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { body, param } = require("express-validator");

// Rutas de Facturas
router.get("/", authMiddleware.verifyToken, facturasController.getAllFacturas);

router.get(
  "/:id",
  authMiddleware.verifyToken,
  [param("id").isInt({ min: 1 }).withMessage("ID de factura inválido.")],
  facturasController.getFacturaById
);

router.post(
  "/",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    body("numero_factura")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("El número de factura es requerido."),
    body("serie_factura")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("La serie de factura es requerida."),
    body("fecha_factura")
      .isISO8601()
      .withMessage("Fecha de factura inválida (YYYY-MM-DD)."),
    body("id_proveedor")
      .isInt({ min: 1 })
      .withMessage(
        "El ID del proveedor es requerido y debe ser un número entero."
      ),
  ],
  facturasController.createFactura
);

router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    param("id").isInt({ min: 1 }).withMessage("ID de factura inválido."),
    body("numero_factura")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("El número de factura es requerido."),
    body("serie_factura")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("La serie de factura es requerida."),
    body("fecha_factura")
      .isISO8601()
      .withMessage("Fecha de factura inválida (YYYY-MM-DD)."),
    body("id_proveedor")
      .isInt({ min: 1 })
      .withMessage(
        "El ID del proveedor es requerido y debe ser un número entero."
      ),
  ],
  facturasController.updateFactura
);

router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [param("id").isInt({ min: 1 }).withMessage("ID de factura inválido.")],
  facturasController.deleteFactura
);

module.exports = router;
