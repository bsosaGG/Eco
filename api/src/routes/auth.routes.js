const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { body, param } = require("express-validator"); // param para el token

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Ingrese un correo electrónico válido."), // Cambiado de nombre_usuario
    body("password").notEmpty().withMessage("La contraseña es obligatoria."),
  ],
  authController.login
);

module.exports = router;
