// Consultas a la BD global de usuarios (db_global_users). El módulo no guarda nombres: solo
// `id_usuario`; aquí se resuelven los nombres y se valida la pertenencia al módulo.
const usersDb = require("../../../config/db-users");

// Un usuario "es del módulo" si está activo y es admin o tiene al menos uno de los perfiles del módulo ($2).
const ES_DEL_MODULO = `
  u.activo = TRUE
  AND (
    u.rol = 'admin'
    OR EXISTS (
      SELECT 1 FROM usuario_perfiles up
      JOIN perfiles p ON p.id_perfil = up.id_perfil
      WHERE up.id_usuario = u.id_usuario AND p.nombre_perfil = ANY($2)
    )
  )`;

/** Usuarios activos del módulo con sus perfiles (fuente del selector "Asignar a"). */
async function listDelModulo(perfilesModulo) {
  const { rows } = await usersDb.query(
    `SELECT u.id_usuario, u.email, u.nombre_completo, u.rol,
            COALESCE(
              array_agg(p.nombre_perfil) FILTER (WHERE p.nombre_perfil IS NOT NULL),
              ARRAY[]::text[]
            ) AS perfiles
     FROM usuarios u
     LEFT JOIN usuario_perfiles up ON up.id_usuario = u.id_usuario
     LEFT JOIN perfiles p ON p.id_perfil = up.id_perfil AND p.nombre_perfil = ANY($1)
     WHERE u.activo = TRUE
       AND (
         u.rol = 'admin'
         OR EXISTS (
           SELECT 1 FROM usuario_perfiles up2
           JOIN perfiles p2 ON p2.id_perfil = up2.id_perfil
           WHERE up2.id_usuario = u.id_usuario AND p2.nombre_perfil = ANY($1)
         )
       )
     GROUP BY u.id_usuario, u.email, u.nombre_completo, u.rol
     ORDER BY u.nombre_completo`,
    [perfilesModulo]
  );
  return rows;
}

/** Usuarios activos con el perfil indicado (más antiguos primero). */
async function listPorPerfil(nombrePerfil) {
  const { rows } = await usersDb.query(
    `SELECT DISTINCT u.id_usuario, u.nombre_completo, u.email
     FROM usuarios u
     JOIN usuario_perfiles up ON up.id_usuario = u.id_usuario
     JOIN perfiles p ON p.id_perfil = up.id_perfil
     WHERE u.activo = TRUE AND p.nombre_perfil = $1
     ORDER BY u.id_usuario`,
    [nombrePerfil]
  );
  return rows;
}

/** El usuario (id, nombre, email) si existe, está activo y pertenece al módulo; si no, undefined. */
async function findDelModulo(idUsuario, perfilesModulo) {
  const { rows } = await usersDb.query(
    `SELECT u.id_usuario, u.nombre_completo, u.email
     FROM usuarios u
     WHERE u.id_usuario = $1
       AND ${ES_DEL_MODULO}`,
    [idUsuario, perfilesModulo]
  );
  return rows[0];
}

/** { id_usuario: nombre_completo } de los ids dados (los inexistentes no aparecen). */
async function findNombresPorId(idsUsuario) {
  const { rows } = await usersDb.query(
    "SELECT id_usuario, nombre_completo FROM usuarios WHERE id_usuario = ANY($1::int[])",
    [idsUsuario]
  );
  return rows.reduce((mapa, usuario) => {
    mapa[usuario.id_usuario] = usuario.nombre_completo;
    return mapa;
  }, {});
}

/** Datos de contacto (id, email, nombre) de los ids dados; opcionalmente solo los activos. */
async function findContactoPorIds(idsUsuario, { soloActivos = false } = {}) {
  const { rows } = await usersDb.query(
    `SELECT id_usuario, email, nombre_completo FROM usuarios WHERE id_usuario = ANY($1::int[])${
      soloActivos ? " AND activo = TRUE" : ""
    }`,
    [idsUsuario]
  );
  return rows;
}

module.exports = { listDelModulo, listPorPerfil, findDelModulo, findNombresPorId, findContactoPorIds };
