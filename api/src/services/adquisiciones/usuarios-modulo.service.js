// Personas del módulo (las que tienen alguno de los perfiles de Adquisiciones o son admin). Es la
// fuente del selector "Asignar a" y la validación que aplican los casos de uso cuando reciben un
// id de usuario: el frontend ya solo ofrece estas personas, pero el backend no confía únicamente
// en eso.
const usuarios = require("./repositories/usuarios.repository");
const { PERFILES_MODULO } = require("./domain/perfiles-modulo");
const { ValidationError } = require("./errors");

/** Usuarios activos del módulo con sus perfiles. Reemplaza el campo de texto libre por una búsqueda real. */
function getUsuariosModulo() {
  return usuarios.listDelModulo(PERFILES_MODULO);
}

/** El usuario si pertenece al módulo; si no, falla con `mensaje` (400). */
async function exigirUsuarioDelModulo(idUsuario, mensaje) {
  const usuario = await usuarios.findDelModulo(idUsuario, PERFILES_MODULO);
  if (!usuario) throw new ValidationError(mensaje);
  return usuario;
}

module.exports = { getUsuariosModulo, exigirUsuarioDelModulo };
