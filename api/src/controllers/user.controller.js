const userService = require("../services/user.service");
const { validationResult } = require("express-validator");

const getMyProfile = async (req, res, next) => {
  try {
    // req.user.userId viene del middleware verifyToken
    const userProfile = await userService.getUserProfile(req.user.userId);
    res.json(userProfile);
  } catch (error) {
    next(error);
  }
};

const updateMyName = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { nombre_completo } = req.body;
    const updatedUser = await userService.updateUserName(
      req.user.userId,
      nombre_completo
    );
    res.json({
      message: "Nombre actualizado correctamente.",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const updateMyProfilePicture = async (req, res, next) => {
  // Multer ya habrá procesado el archivo y lo pondrá en req.file
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No se seleccionó ningún archivo de imagen." });
  }
  try {
    const updatedUser = await userService.updateUserProfilePicture(
      req.user.userId,
      req.file
    );
    res.json({
      message: "Foto de perfil actualizada correctamente.",
      user: updatedUser,
    });
  } catch (error) {
    // Si el error es por no encontrar el archivo subido (Multer falló antes)
    if (error.message === "No se proporcionó archivo de imagen.") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// --- CONTROLADORES PARA ADMINISTRACIÓN ---

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.findAll();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const createUserByAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    // El servicio se encargará del hashing de la contraseña
    const newUser = await userService.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    // Manejar errores como email duplicado
    if (error.message.includes("duplicate key")) {
      return res
        .status(409)
        .json({ message: "El correo electrónico ya está en uso." });
    }
    next(error);
  }
};

const updateUserByAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const updatedUser = await userService.update(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    res.json(updatedUser);
  } catch (error) {
    if (error.message.includes("duplicate key")) {
      return res
        .status(409)
        .json({ message: "El correo electrónico ya está en uso." });
    }
    next(error);
  }
};

const deleteUserByAdmin = async (req, res, next) => {
  try {
    // El servicio debe implementar la lógica de borrado lógico (desactivar)
    const result = await userService.softDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    res.status(204).send(); // 204 No Content
  } catch (error) {
    next(error);
  }
};

const updateUserAccessByAdmin = async (req, res, next) => {
  try {
    await userService.updateUserAccess(req.params.id, req.body);
    res
      .status(200)
      .json({ message: "Accesos del usuario actualizados correctamente." });
  } catch (error) {
    next(error);
  }
};

const resetPasswordByAdminController = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    await userService.resetPasswordByAdmin(req.params.id, newPassword);
    res
      .status(200)
      .json({ message: "Contraseña del usuario restablecida correctamente." });
  } catch (error) {
    // Pasa el error para que el manejador de errores lo capture
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyName,
  updateMyProfilePicture,
  getAllUsers,
  getUserById,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  updateUserAccessByAdmin,
  resetPasswordByAdminController,
};
