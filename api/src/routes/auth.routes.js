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

// POST /api/auth/signup
router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Ingrese un correo electrónico válido."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("La contraseña debe tener al menos 8 caracteres."),
    // .matches(/\d/).withMessage('La contraseña debe contener un número.') // Ejemplo de más reglas
    // .matches(/[A-Z]/).withMessage('La contraseña debe contener una mayúscula.'), // Ejemplo
    body("nombre_completo")
      .notEmpty()
      .withMessage("El nombre completo es obligatorio.")
      .trim()
      .escape(),
    body("confirm_password").custom((value, { req }) => {
      // Para confirmación de contraseña en el form de signup
      if (value !== req.body.password) {
        throw new Error("Las contraseñas no coinciden.");
      }
      return true;
    }),
  ],
  authController.signup
);

// GET /api/auth/verify-email/:token
router.get(
  "/verify-email/:token",
  [param("token").isHexadecimal().withMessage("Token inválido.")], // Validar que el token parezca un token hex
  authController.verifyEmail
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .withMessage("Ingrese un correo electrónico válido.")
  ],
  authController.forgotPasswordController
);

// GET /api/auth/reset-password-page/:token  (Renderiza la página HTML para el reseteo)
router.get(
  "/reset-password-page/:token",
  [param("token").isHexadecimal().withMessage("Token inválido.")],
  authController.renderResetPasswordPage
);

// POST /api/auth/reset-password/:token (Procesa el formulario de nueva contraseña)
router.post(
  "/reset-password/:token",
  [
    param("token").isHexadecimal().withMessage("Token inválido."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("La nueva contraseña debe tener al menos 8 caracteres."),
    body("confirm_password").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Las contraseñas no coinciden.");
      }
      return true;
    }),
  ],
  authController.resetPasswordController
);

module.exports = router;
