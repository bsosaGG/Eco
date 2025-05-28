const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { body } = require("express-validator");

// POST /api/auth/login
router.post(
  "/login",
  [
    body("nombre_usuario")
      .notEmpty()
      .withMessage("El nombre de usuario es obligatorio.")
      .trim(),
    body("password").notEmpty().withMessage("La contraseña es obligatoria."),
  ],
  authController.login
);

module.exports = router;
