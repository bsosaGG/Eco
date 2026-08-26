const dbUsers = require('../config/db-users');

/**
 * Obtiene los correos de los usuarios que tienen el permiso de transporte:admin
 */
const getTransporteAdminsEmails = async () => {
    const query = `
    SELECT DISTINCT u.email 
    FROM usuarios u
    LEFT JOIN usuario_permisos up ON u.id_usuario = up.id_usuario
    LEFT JOIN permisos p ON up.id_permiso = p.id_permiso
    LEFT JOIN usuario_perfiles uperf ON u.id_usuario = uperf.id_usuario
    LEFT JOIN perfil_permisos pp ON uperf.id_perfil = pp.id_perfil
    LEFT JOIN permisos p2 ON pp.id_permiso = p2.id_permiso
    WHERE (p.clave_permiso = 'transportes:admin' OR p2.clave_permiso = 'transportes:admin' OR u.rol = 'admin')
      AND u.activo = TRUE;
  `;

    const res = await dbUsers.query(query);
    return res.rows.map(row => row.email);
};

/**
 * Obtiene el correo electrónico de un usuario por su ID
 * @param {number} userId - El ID del usuario solicitante
 * @returns {Promise<string|null>} El correo electrónico o null si no se encuentra
 */
const getUserEmailById = async (userId) => {
    if (!userId) return null;
    const query = 'SELECT email FROM usuarios WHERE id_usuario = $1 AND activo = TRUE;';
    const res = await dbUsers.query(query, [userId]);
    return res.rows.length > 0 ? res.rows[0].email : null;
};


module.exports = {
    getTransporteAdminsEmails,
    getUserEmailById
};
