const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET_KEY_SCSCR;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN_SCSCR;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET_KEY_SCSCR no está definido.");
  process.exit(1);
}

const loginUser = async (nombreUsuario, password) => {
  // Buscar usuario por nombre_usuario
  const userQuery =
    "SELECT id_usuario, nombre_usuario, password_hash, rol, activo FROM usuarios WHERE nombre_usuario = $1";
  const { rows } = await db.query(userQuery, [nombreUsuario]);

  if (rows.length === 0) {
    throw new Error("Usuario no encontrado.");
  }

  const user = rows[0];

  if (!user.activo) {
    throw new Error("La cuenta de usuario está inactiva.");
  }

  // Verificar contraseña
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error("Credenciales inválidas."); // Mensaje genérico por seguridad
  }

  // Usuario autenticado, generar JWT
  const payload = {
    userId: user.id_usuario,
    username: user.nombre_usuario,
    role: user.rol,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Actualizar ultimo_login
  await db.query(
    "UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = $1",
    [user.id_usuario]
  );

  return {
    token,
    user: {
      id: user.id_usuario,
      username: user.nombre_usuario,
      role: user.rol,
    },
  };
};

module.exports = {
  loginUser,
};
