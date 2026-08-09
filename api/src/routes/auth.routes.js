const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { body } = require("express-validator");
const validateRecaptcha = require("../middleware/validateRecaptcha");

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

module.exports = router;
