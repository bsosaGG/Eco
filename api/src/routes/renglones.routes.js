const express = require("express");
const router = express.Router();
const renglonesController = require("../controllers/renglones.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { body, param } = require("express-validator");

// Rutas de Renglones
router.get(
  "/",
  authMiddleware.verifyToken,
  renglonesController.getAllRenglones
);

router.get(
  "/:id",
  authMiddleware.verifyToken,
  [param("id").isInt({ min: 1 }).withMessage("ID de renglón inválido.")],
  renglonesController.getRenglonById
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
      .withMessage("El nombre del renglón es requerido."),
  ],
  renglonesController.createRenglon
);

router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [
    param("id").isInt({ min: 1 }).withMessage("ID de renglón inválido."),
    body("nombre")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("El nombre del renglón es requerido."),
  ],
  renglonesController.updateRenglon
);

router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  [param("id").isInt({ min: 1 }).withMessage("ID de renglón inválido.")],
  renglonesController.deleteRenglon
);

module.exports = router;
