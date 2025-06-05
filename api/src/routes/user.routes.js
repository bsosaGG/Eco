const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const uploadProfilePicMiddleware = require("../middleware/uploadProfilePic");
const { body } = require("express-validator");

// Todas las rutas aquí requieren autenticación
router.use(verifyToken);

// GET /api/user/profile - Obtener perfil del usuario logueado
router.get("/profile", userController.getMyProfile);

// PUT /api/user/profile/name - Actualizar nombre completo
router.put(
  "/profile/name",
  [
    body("nombre_completo")
      .notEmpty()
      .withMessage("El nombre completo es obligatorio.")
      .trim()
      .escape(),
  ],
  userController.updateMyName
);

// POST /api/user/profile/picture - Actualizar foto de perfil
// Usamos POST para subida de archivos, aunque semánticamente sea un PUT/PATCH.
router.post(
  "/profile/picture",
  uploadProfilePicMiddleware, // Middleware de Multer para la foto
  userController.updateMyProfilePicture
);

module.exports = router;
