const db = require("../config/db-users");
const fs = require("fs").promises;
const path = require("path");
const bcrypt = require("bcryptjs");

const UPLOAD_PROFILE_PICS_DIR_RELATIVE = "uploads/profile_pics";

const getUserProfile = async (userId) => {
  const query =
    "SELECT id_usuario, email, nombre_completo, foto_perfil_url, rol FROM usuarios WHERE id_usuario = $1";
  const { rows } = await db.query(query, [userId]);
  if (rows.length === 0) {
    throw new Error("Usuario no encontrado.");
  }
  if (rows[0].foto_perfil_url && !rows[0].foto_perfil_url.startsWith("http")) {
    const API_BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.API_BASE_URL_PROD
        : process.env.API_BASE_URL_DEV;
    rows[0].foto_perfil_url_publica = `${API_BASE_URL}/${rows[0].foto_perfil_url}`;
  } else {
    rows[0].foto_perfil_url_publica = rows[0].foto_perfil_url;
  }
  return rows[0];
};

const updateUserName = async (userId, nombreCompleto) => {
  const query =
    "UPDATE usuarios SET nombre_completo = $1 WHERE id_usuario = $2 RETURNING id_usuario, email, nombre_completo, foto_perfil_url, rol";
  const { rows } = await db.query(query, [nombreCompleto, userId]);
  if (rows.length === 0) {
    throw new Error("Usuario no encontrado al actualizar nombre.");
  }
  if (rows[0].foto_perfil_url && !rows[0].foto_perfil_url.startsWith("http")) {
    const API_BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.API_BASE_URL_PROD
        : process.env.API_BASE_URL_DEV;
    rows[0].foto_perfil_url_publica = `${API_BASE_URL}/${rows[0].foto_perfil_url}`;
  } else {
    rows[0].foto_perfil_url_publica = rows[0].foto_perfil_url;
  }
  return rows[0];
};

const updateUserProfilePicture = async (userId, file) => {
  if (!file) {
    throw new Error("No se proporcionó archivo de imagen.");
  }
  const oldPicQuery =
    "SELECT foto_perfil_url FROM usuarios WHERE id_usuario = $1";
  const oldPicResult = await db.query(oldPicQuery, [userId]);
  const oldPicPathRelative =
    oldPicResult.rows.length > 0 ? oldPicResult.rows[0].foto_perfil_url : null;
  const newPicPathRelative = path.join(
    UPLOAD_PROFILE_PICS_DIR_RELATIVE,
    file.filename
  );
  const query =
    "UPDATE usuarios SET foto_perfil_url = $1 WHERE id_usuario = $2 RETURNING id_usuario, email, nombre_completo, foto_perfil_url, rol";
  const { rows } = await db.query(query, [newPicPathRelative, userId]);
  if (rows.length === 0) {
    try {
      await fs.unlink(file.path);
    } catch (e) {
      console.error("Error eliminando nuevo archivo tras fallo de DB:", e);
    }
    throw new Error("Usuario no encontrado al actualizar foto.");
  }
  if (
    oldPicPathRelative &&
    oldPicPathRelative !== newPicPathRelative &&
    !oldPicPathRelative.startsWith("http")
  ) {
    try {
      const oldPicAbsolutePath = path.resolve(
        process.cwd(),
        oldPicPathRelative
      );
      await fs.unlink(oldPicAbsolutePath);
      console.log(`Foto de perfil anterior eliminada: ${oldPicAbsolutePath}`);
    } catch (e) {
      console.error("Error eliminando foto de perfil anterior:", e);
    }
  }
  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? process.env.API_BASE_URL_PROD
      : process.env.API_BASE_URL_DEV;
  rows[0].foto_perfil_url_publica = `${API_BASE_URL}/${newPicPathRelative}`;
  return rows[0];
};

const findAll = async () => {
  const query =
    "SELECT id_usuario, email, nombre_completo, rol, activo, correo_validado, fecha_creacion, ultimo_login FROM usuarios ORDER BY nombre_completo ASC";
  const { rows } = await db.query(query);
  return rows;
};

const findById = async (userId) => {
  // Añadimos comillas dobles a los alias para forzar el formato camelCase
  // en la respuesta JSON y que coincida con el frontend.
  const query = `
        SELECT 
            u.id_usuario, u.email, u.nombre_completo, u.rol, u.activo, u.correo_validado,
            COALESCE(
                (SELECT json_agg(up.id_perfil) FROM usuario_perfiles up WHERE up.id_usuario = u.id_usuario), 
                '[]'::json
            ) as "profileIds",
            COALESCE(
                (SELECT json_agg(up.id_permiso) FROM usuario_permisos up WHERE up.id_usuario = u.id_usuario), 
                '[]'::json
            ) as "directPermissionIds"
        FROM usuarios u
        WHERE u.id_usuario = $1;
    `;
  const { rows } = await db.query(query, [userId]);
  return rows.length > 0 ? rows[0] : null;
};

const create = async (userData) => {
  const { email, nombre_completo, password, rol } = userData;
  const passwordHash = await bcrypt.hash(password, 10);

  const query = `
        INSERT INTO usuarios (email, nombre_completo, password_hash, rol, activo, correo_validado)
        VALUES ($1, $2, $3, $4, TRUE, TRUE)
        RETURNING id_usuario, email, nombre_completo, rol, activo, fecha_creacion
    `;
  const { rows } = await db.query(query, [
    email,
    nombre_completo,
    passwordHash,
    rol,
  ]);
  return rows[0];
};

const update = async (userId, userData) => {
  const { email, nombre_completo, rol, activo } = userData;
  const query = `
        UPDATE usuarios 
        SET email = $1, nombre_completo = $2, rol = $3, activo = $4
        WHERE id_usuario = $5
        RETURNING id_usuario, email, nombre_completo, rol, activo
    `;
  const { rows } = await db.query(query, [
    email,
    nombre_completo,
    rol,
    activo,
    userId,
  ]);
  return rows.length > 0 ? rows[0] : null;
};

const softDelete = async (userId) => {
  const query =
    "UPDATE usuarios SET activo = false WHERE id_usuario = $1 RETURNING id_usuario";
  const { rows } = await db.query(query, [userId]);
  return rows.length > 0;
};

const updateUserAccess = async (userId, accessData) => {
  const { profileIds = [], directPermissionIds = [] } = accessData;
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM usuario_perfiles WHERE id_usuario = $1", [
      userId,
    ]);
    await client.query("DELETE FROM usuario_permisos WHERE id_usuario = $1", [
      userId,
    ]);

    if (profileIds.length > 0) {
      const profileInserts = profileIds
        .map((id, i) => `($1, $${i + 2})`)
        .join(",");
      await client.query(
        `INSERT INTO usuario_perfiles (id_usuario, id_perfil) VALUES ${profileInserts}`,
        [userId, ...profileIds]
      );
    }

    if (directPermissionIds.length > 0) {
      const permissionInserts = directPermissionIds
        .map((id, i) => `($1, $${i + 2})`)
        .join(",");
      await client.query(
        `INSERT INTO usuario_permisos (id_usuario, id_permiso) VALUES ${permissionInserts}`,
        [userId, ...directPermissionIds]
      );
    }

    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

const resetPasswordByAdmin = async (userId, newPassword) => {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { rowCount } = await db.query(
    "UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2",
    [passwordHash, userId]
  );
  return rowCount > 0;
};

module.exports = {
  getUserProfile,
  updateUserName,
  updateUserProfilePicture,
  findAll,
  findById,
  create,
  update,
  softDelete,
  updateUserAccess,
  resetPasswordByAdmin,
};
