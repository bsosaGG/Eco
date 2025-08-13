// api/src/middleware/permission.middleware.js
const pacPool = require("../config/db-users");

const checkPermission = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      // Asumo que el middleware de autenticación ya verificó el token y añadió 'userId' al request.
      const userId = req.user.userId;
      if (!userId) {
        return res.status(401).json({ message: "Acceso no autorizado." });
      }

      const query = `
        SELECT 1 -- Seleccionamos un valor constante porque solo nos interesa saber si existe una coincidencia.
        FROM usuarios u
        WHERE u.id_usuario = $1
          AND (
            -- 1. ¿Tiene el permiso asignado directamente?
            EXISTS (
              SELECT 1
              FROM usuario_permisos up
              JOIN permisos p ON up.id_permiso = p.id_permiso
              WHERE up.id_usuario = u.id_usuario AND p.clave_permiso = $2
            )
            OR
            -- 2. ¿Tiene el permiso a través de alguno de sus perfiles?
            EXISTS (
              SELECT 1
              FROM usuario_perfiles upf
              JOIN perfil_permisos pp ON upf.id_perfil = pp.id_perfil
              JOIN permisos p ON pp.id_permiso = p.id_permiso
              WHERE upf.id_usuario = u.id_usuario AND p.clave_permiso = $2
            )
          );
      `;

      const result = await pacPool.query(query, [userId, permisoRequerido]);

      if (result.rows.length === 0) {
        return res.status(403).json({ message: "Permiso denegado." });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkPermission };
