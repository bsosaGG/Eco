const db = require("../config/db-users");
const fs = require("fs").promises;
const path = require("path");

const UPLOAD_PROFILE_PICS_DIR_RELATIVE = "uploads/profile_pics"; // Relativo a la raíz del proyecto API

const getUserProfile = async (userId) => {
  const query =
    "SELECT id_usuario, email, nombre_completo, foto_perfil_url, rol FROM usuarios WHERE id_usuario = $1";
  const { rows } = await db.query(query, [userId]);
  if (rows.length === 0) {
    throw new Error("Usuario no encontrado.");
  }
  // Si foto_perfil_url es una ruta relativa del servidor, construir la URL completa para el cliente
  // Asumiendo que tienes una forma de servir estos archivos (ver Paso 5.5.1.4)
  if (rows[0].foto_perfil_url && !rows[0].foto_perfil_url.startsWith("http")) {
    // Esta lógica de prefijar con API_BASE_URL es si el frontend va a cargar la imagen directamente
    // desde una URL que la API sirve.
    const API_BASE_URL =
      process.env.NODE_ENV === "production"
        ? process.env.API_BASE_URL_PROD
        : process.env.API_BASE_URL_DEV;
    // El path debe coincidir con cómo se sirven los archivos estáticos de perfil
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
  // Similar al getUserProfile, construir la URL pública si es necesario
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

  // Obtener la foto de perfil anterior para eliminarla si existe
  const oldPicQuery =
    "SELECT foto_perfil_url FROM usuarios WHERE id_usuario = $1";
  const oldPicResult = await db.query(oldPicQuery, [userId]);
  const oldPicPathRelative =
    oldPicResult.rows.length > 0 ? oldPicResult.rows[0].foto_perfil_url : null;

  // `file.filename` es el nombre generado por Multer (único)
  // `file.path` es la ruta completa donde Multer lo guardó temporalmente o permanentemente
  // Asumiremos que Multer ya guarda en la carpeta final `uploads/profile_pics/`
  const newPicPathRelative = path.join(
    UPLOAD_PROFILE_PICS_DIR_RELATIVE,
    file.filename
  );

  const query =
    "UPDATE usuarios SET foto_perfil_url = $1 WHERE id_usuario = $2 RETURNING id_usuario, email, nombre_completo, foto_perfil_url, rol";
  const { rows } = await db.query(query, [newPicPathRelative, userId]);

  if (rows.length === 0) {
    // Si el update falla, eliminar el archivo recién subido
    try {
      await fs.unlink(file.path);
    } catch (e) {
      console.error("Error eliminando nuevo archivo tras fallo de DB:", e);
    }
    throw new Error("Usuario no encontrado al actualizar foto.");
  }

  // Si había una foto anterior y es diferente a la nueva (y es una ruta local), eliminarla
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
      // No es un error crítico si no se puede borrar la vieja
    }
  }

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? process.env.API_BASE_URL_PROD
      : process.env.API_BASE_URL_DEV;
  rows[0].foto_perfil_url_publica = `${API_BASE_URL}/${newPicPathRelative}`; // Construir URL completa para la respuesta

  return rows[0];
};

module.exports = {
  getUserProfile,
  updateUserName,
  updateUserProfilePicture,
};
