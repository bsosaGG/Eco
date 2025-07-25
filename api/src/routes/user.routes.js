const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
// Asegúrate de importar isAdmin y checkPermission
const {
  verifyToken,
  isAdmin,
  checkPermission,
} = require("../middleware/auth.middleware");
const uploadProfilePicMiddleware = require("../middleware/uploadProfilePic");
const { body } = require("express-validator");

// --- Rutas de Perfil Personal ---
router.use(verifyToken); // Aplica autenticación a todas las rutas de este archivo

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
router.post(
  "/profile/picture",
  uploadProfilePicMiddleware,
  userController.updateMyProfilePicture
);

// =================================================================
// --- NUEVAS RUTAS DE ADMINISTRACIÓN DE USUARIOS ---
// Todas las rutas de aquí para abajo requerirán permisos de administrador.
// En un futuro, podrías cambiar isAdmin por checkPermission('admin:users')
// =================================================================
router.use(isAdmin);

// GET /api/user/ - Listar todos los usuarios para el admin
router.get("/", userController.getAllUsers);

// POST /api/user/ - Crear un nuevo usuario como admin
router.post(
  "/",
  [
    body("email").isEmail().withMessage("Email inválido."),
    body("nombre_completo").notEmpty().withMessage("El nombre es obligatorio."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("La contraseña debe tener al menos 8 caracteres."),
    body("rol").isIn(["admin", "usuario"]).withMessage("Rol inválido."),
  ],
  userController.createUserByAdmin
);

// GET /api/user/:id - Obtener detalles de un usuario específico
router.get("/:id", userController.getUserById);

// PUT /api/user/:id - Actualizar un usuario como admin
router.put(
  "/:id",
  [
    body("email").isEmail().withMessage("Email inválido."),
    body("nombre_completo").notEmpty().withMessage("El nombre es obligatorio."),
    body("rol").isIn(["admin", "usuario"]).withMessage("Rol inválido."),
    body("activo")
      .isBoolean()
      .withMessage("El estado activo debe ser un booleano."),
  ],
  userController.updateUserByAdmin
);

// DELETE /api/user/:id - "Eliminar" (desactivar) un usuario
router.delete("/:id", userController.deleteUserByAdmin);

// PUT /api/user/:id/access - Actualizar perfiles y permisos de un usuario
router.put("/:id/access", userController.updateUserAccessByAdmin);

// POST /api/user/:id/reset-password - Restablecer la contraseña de un usuario
router.post(
  "/:id/reset-password",
  [
    body("newPassword")
      .notEmpty()
      .withMessage("La nueva contraseña es obligatoria."),
  ],
  userController.resetPasswordByAdminController
);

module.exports = router;
