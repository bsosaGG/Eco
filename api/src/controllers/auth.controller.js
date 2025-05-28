const authService = require("../services/auth.service");
const { validationResult } = require("express-validator");

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre_usuario, password } = req.body;

  try {
    const result = await authService.loginUser(nombre_usuario, password);
    res.status(200).json(result);
  } catch (error) {
    // Errores específicos del servicio de login
    if (
      error.message === "Usuario no encontrado." ||
      error.message === "Credenciales inválidas." ||
      error.message === "La cuenta de usuario está inactiva."
    ) {
      return res
        .status(401)
        .json({ message: "Credenciales incorrectas o cuenta inactiva." }); // Mensaje genérico por seguridad
    }
    next(error); // Otros errores al manejador global
  }
};

module.exports = {
  login,
};
