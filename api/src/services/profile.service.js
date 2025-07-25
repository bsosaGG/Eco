const db = require("../config/db-users");

/**
 * Obtiene todos los perfiles junto con sus permisos asociados.
 */
const findAll = async () => {
  // Esta consulta obtiene cada perfil y agrega una lista de sus permisos.
  const query = `
        SELECT 
            p.id_perfil, p.nombre_perfil, p.descripcion,
            COALESCE(
                (SELECT json_agg(json_build_object('id_permiso', perm.id_permiso, 'clave_permiso', perm.clave_permiso))
                 FROM perfil_permisos pp
                 JOIN permisos perm ON pp.id_permiso = perm.id_permiso
                 WHERE pp.id_perfil = p.id_perfil),
                '[]'::json
            ) as permisos
        FROM perfiles p
        ORDER BY p.nombre_perfil;
    `;
  const { rows } = await db.query(query);
  return rows;
};

/**
 * Obtiene todos los permisos disponibles en el sistema.
 */
const findAllPermissions = async () => {
  const query =
    "SELECT id_permiso, clave_permiso, descripcion FROM permisos ORDER BY clave_permiso";
  const { rows } = await db.query(query);
  return rows;
};

/**
 * Crea un nuevo perfil y le asigna permisos usando una transacción.
 */
const create = async (profileData) => {
  const { nombre_perfil, descripcion, permissionIds = [] } = profileData;
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    // 1. Insertar el nuevo perfil
    const profileQuery =
      "INSERT INTO perfiles (nombre_perfil, descripcion) VALUES ($1, $2) RETURNING id_perfil";
    const profileResult = await client.query(profileQuery, [
      nombre_perfil,
      descripcion,
    ]);
    const newProfileId = profileResult.rows[0].id_perfil;

    // 2. Asignar los permisos
    if (permissionIds.length > 0) {
      const permissionInserts = permissionIds
        .map((id, index) => `($1, $${index + 2})`)
        .join(",");
      const permissionQuery = `INSERT INTO perfil_permisos (id_perfil, id_permiso) VALUES ${permissionInserts}`;
      await client.query(permissionQuery, [newProfileId, ...permissionIds]);
    }

    await client.query("COMMIT");
    return { id_perfil: newProfileId, nombre_perfil, descripcion };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

/**
 * Actualiza un perfil y sus permisos usando una transacción.
 */
const update = async (profileId, profileData) => {
  const { nombre_perfil, descripcion, permissionIds = [] } = profileData;
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    // 1. Actualizar datos del perfil
    const profileQuery =
      "UPDATE perfiles SET nombre_perfil = $1, descripcion = $2 WHERE id_perfil = $3";
    await client.query(profileQuery, [nombre_perfil, descripcion, profileId]);

    // 2. Borrar los permisos antiguos
    await client.query("DELETE FROM perfil_permisos WHERE id_perfil = $1", [
      profileId,
    ]);

    // 3. Asignar los nuevos permisos
    if (permissionIds.length > 0) {
      const permissionInserts = permissionIds
        .map((id, i) => `($1, $${i + 2})`)
        .join(",");
      const permissionQuery = `INSERT INTO perfil_permisos (id_perfil, id_permiso) VALUES ${permissionInserts}`;
      await client.query(permissionQuery, [profileId, ...permissionIds]);
    }

    await client.query("COMMIT");
    return { id_perfil: profileId, nombre_perfil, descripcion };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

/**
 * Elimina un perfil. El ON DELETE CASCADE se encargará de las relaciones.
 */
const remove = async (profileId) => {
  const { rowCount } = await db.query(
    "DELETE FROM perfiles WHERE id_perfil = $1",
    [profileId]
  );
  return rowCount > 0;
};

module.exports = {
  findAll,
  findAllPermissions,
  create,
  update,
  remove,
};
