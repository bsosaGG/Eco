const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { body } = require("express-validator");
const validateRecaptcha = require("../middleware/validateRecaptcha");
const { verifyToken } = require("../middleware/auth.middleware");

// POST /api/auth/login
router.post(
  "/login",
  validateRecaptcha,
  [
    body("email")
      .isEmail()
      .withMessage("Ingrese un correo electrónico válido."),
    body("password").notEmpty().withMessage("La contraseña es obligatoria."),
  ],
  authController.login
);

// POST /api/auth/verify-password
// Re-confirma la contraseña del usuario ya autenticado (sin reCAPTCHA, sin emitir
// un nuevo token) — usado por el modal de firma electrónica en Adquisiciones.
router.post(
  "/verify-password",
  verifyToken,
  [body("password").notEmpty().withMessage("La contraseña es obligatoria.")],
  authController.verifyPassword
);

module.exports = router;
