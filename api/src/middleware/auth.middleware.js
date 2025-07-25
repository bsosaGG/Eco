const jwt = require("jsonwebtoken");
const db = require("../config/db-users"); // Asegúrate que esta es la conexión a la DB de usuarios
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET_KEY_SCSCR;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ message: "No se proporcionó token de autenticación." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expirado." });
      }
      return res
        .status(401)
        .json({ message: "Token inválido o no autorizado." });
    }
    req.user = decoded; // Contendrá { userId, email, role, name }
    next();
  });
};

/**
 * Middleware para verificar si el usuario tiene un permiso específico.
 * Un 'admin' siempre tiene acceso.
 * La verificación busca permisos directos y permisos heredados de perfiles.
 * @param {string} requiredPermission La clave del permiso requerido (ej. 'inv-item:read').
 * @returns {function} Un middleware de Express.
 */
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    // Asumimos que verifyToken ya se ejecutó, por lo que req.user existe.
    const { userId, role } = req.user;

    // 1. El rol 'admin' tiene acceso universal y omite la verificación.
    if (role === "admin") {
      return next();
    }

    try {
      // 2. Consulta SQL optimizada para verificar el permiso.
      const permissionQuery = `
                SELECT 1
                FROM permisos p
                WHERE p.clave_permiso = $1 AND (
                    -- A) El usuario tiene el permiso asignado directamente
                    EXISTS (
                        SELECT 1
                        FROM usuario_permisos up
                        WHERE up.id_usuario = $2 AND up.id_permiso = p.id_permiso
                    ) OR
                    -- B) El usuario tiene un perfil que contiene el permiso
                    EXISTS (
                        SELECT 1
                        FROM usuario_perfiles upf
                        JOIN perfil_permisos pp ON upf.id_perfil = pp.id_perfil
                        WHERE upf.id_usuario = $2 AND pp.id_permiso = p.id_permiso
                    )
                )
                LIMIT 1;
            `;

      const { rows } = await db.query(permissionQuery, [
        requiredPermission,
        userId,
      ]);

      // 3. Si la consulta devuelve una fila, el usuario tiene el permiso.
      if (rows.length > 0) {
        return next(); // ¡Permiso concedido!
      } else {
        // 4. Si no, se le niega el acceso.
        return res
          .status(403)
          .json({ message: "Acceso denegado. Permisos insuficientes." });
      }
    } catch (error) {
      console.error("Error al verificar permisos:", error);
      return res
        .status(500)
        .json({ message: "Error interno al verificar permisos." });
    }
  };
};

// Se omite la función isAdmin ya que checkPermission('rol:admin') la puede reemplazar,
// pero la dejamos por si la usas en otro lado.
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Acceso denegado. Requiere rol de administrador." });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  checkPermission, // Exportamos la nueva función
};
