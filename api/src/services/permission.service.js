// api\src/services/permission.service.js

const db = require("../config/db-users");

/**
 * Obtiene todos los permisos.
 */
const findAll = async () => {
  const query = "SELECT * FROM permisos ORDER BY clave_permiso";
  const { rows } = await db.query(query);
  return rows;
};

/**
 * Crea un nuevo permiso.
 */
const create = async (permissionData) => {
  const { clave_permiso, descripcion } = permissionData;
  const query =
    "INSERT INTO permisos (clave_permiso, descripcion) VALUES ($1, $2) RETURNING *";
  const { rows } = await db.query(query, [clave_permiso, descripcion]);
  return rows[0];
};

/**
 * Actualiza un permiso existente.
 */
const update = async (permissionId, permissionData) => {
  const { clave_permiso, descripcion } = permissionData;
  const query =
    "UPDATE permisos SET clave_permiso = $1, descripcion = $2 WHERE id_permiso = $3 RETURNING *";
  const { rows } = await db.query(query, [
    clave_permiso,
    descripcion,
    permissionId,
  ]);
  return rows[0];
};

/**
 * Elimina un permiso.
 */
const remove = async (permissionId) => {
  // Nota: Asegúrate de que no haya perfiles usando este permiso
  // si no tienes ON DELETE RESTRICT en tu BD.
  const { rowCount } = await db.query(
    "DELETE FROM permisos WHERE id_permiso = $1",
    [permissionId]
  );
  return rowCount > 0;
};

module.exports = {
  findAll,
  create,
  update,
  remove,
};
