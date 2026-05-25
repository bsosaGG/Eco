const jwt = require("jsonwebtoken");
const db = require("../config/db-users");
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

  // El callback de verify debe ser 'async' para usar 'await'
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expirado." });
      }
      return res
        .status(401)
        .json({ message: "Token inválido o no autorizado." });
    }

    try {
      // 1. Obtenemos el ID del usuario desde el token decodificado
      const { userId } = decoded; // 2. Consultamos la base de datos EN TIEMPO REAL
      const { rows } = await db.query(
        "SELECT activo FROM usuarios WHERE id_usuario = $1",
        [userId],
      ); // 3. Validamos el estado del usuario

      if (rows.length === 0) {
        // El usuario fue eliminado después de iniciar sesión
        return res.status(401).json({ message: "Usuario no encontrado." });
      }

      if (rows[0].activo === false) {
        // ¡El usuario fue desactivado!
        return res.status(403).json({
          message: "Acceso denegado. Su cuenta ha sido desactivada.",
        });
      } // 4. Si el usuario existe Y está activo, continuamos

      req.user = decoded;
      next();
    } catch (dbError) {
      console.error("Error al verificar estado de usuario:", dbError);
      return res
        .status(500)
        .json({ message: "Error interno al verificar la sesión." });
    }
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

    // RESOLUCIÓN DINÁMICA DE CONTEXTO
    let permissionToQuery = requiredPermission;
    if (requiredPermission.startsWith("CONTEXT:")) {
      const action = requiredPermission.split(":")[1]; // 'create', 'read', 'config'
      // Si req.appTipo es 'impresiones', el permiso final será 'impresiones:action'
      permissionToQuery = `${req.appTipo}:${action}`;
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
        permissionToQuery,
        userId,
      ]);

      // 3. Si la consulta devuelve una fila, el usuario tiene el permiso.
      if (rows.length > 0) {
        return next(); // ¡Permiso concedido!
      } else {
        // 4. Si no, se le niega el acceso.
        return res
          .status(403)
          .json({
            message: `Acceso denegado. Requiere el permiso [${permissionToQuery}].`,
          });
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
