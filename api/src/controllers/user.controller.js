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

module.exports = {
  getMyProfile,
  updateMyName,
  updateMyProfilePicture,
};
