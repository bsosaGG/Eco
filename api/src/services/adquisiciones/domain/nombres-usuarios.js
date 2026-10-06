/** Nombre a mostrar de un usuario; si ya no existe en db_global_users, "Usuario #<id>". */
const nombreOFallback = (nombrePorId, idUsuario) => nombrePorId[idUsuario] || `Usuario #${idUsuario}`;

module.exports = { nombreOFallback };
