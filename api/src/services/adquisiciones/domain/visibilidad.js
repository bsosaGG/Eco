// Quién ve todos los expedientes y quién solo los suyos. Lógica pura, sin I/O.
//
// Quien únicamente emite solicitudes (permisos `read` y `create`) ve solo las que emitió y la etapa
// en que está cada una. Cualquier persona con una función de gestión del trámite (asignar, cotizar,
// CDP, OC, recepción, fase financiera, auditoría, devolver o administrar catálogos) y el rol admin
// ven todos.

const PERMISOS_DE_GESTION = [
  "adquisiciones:assign",
  "adquisiciones:config",
  "adquisiciones:audit",
  "adquisiciones:devolver",
  "adquisiciones:manage-cotizaciones",
  "adquisiciones:elaborar-cdp",
  "adquisiciones:aprobar-cdp",
  "adquisiciones:vobo-financiero",
  "adquisiciones:elaborar-oc",
  "adquisiciones:aprobar-oc",
  "adquisiciones:autorizar-oc",
  "adquisiciones:confirmar-recepcion",
  "adquisiciones:conformar-pago",
  "adquisiciones:registrar-compromiso",
  "adquisiciones:registrar-devengado",
  "adquisiciones:solicitar-pago",
  "adquisiciones:autorizar-pago",
];

/** `usuario` es el contenido del token: { role, permissions }. */
function puedeVerTodos(usuario) {
  if (!usuario) return false;
  if (usuario.role === "admin") return true;
  const permisos = Array.isArray(usuario.permissions) ? usuario.permissions : [];
  return PERMISOS_DE_GESTION.some((permiso) => permisos.includes(permiso));
}

module.exports = { PERMISOS_DE_GESTION, puedeVerTodos };
