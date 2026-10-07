// Quién ve qué. Lógica pura, sin I/O.
//
// EXPEDIENTES. Cada persona ve los expedientes que le TOCAN (es el responsable actual) y los que ella
// emitió (para seguirlos). Cuando un expediente pasa a otra persona deja de aparecerle: así lo que hay
// en su bandeja es lo que tiene pendiente. Solo ven todos el rol admin y quien supervisa: auditoría
// (`audit`) y administración (`config`).
//
// REPORTES. Los ven el rol admin y cualquiera con una función de gestión del trámite (asignar, cotizar,
// CDP, OC, recepción, fase financiera, auditoría, devolver o administrar catálogos).

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

// Quienes supervisan el módulo y por eso ven todos los expedientes, no solo los que les tocan.
const PERMISOS_DE_SUPERVISION = ["adquisiciones:audit", "adquisiciones:config"];

const permisosDe = (usuario) => (Array.isArray(usuario.permissions) ? usuario.permissions : []);

/** `usuario` es el contenido del token: { role, permissions }. */
function puedeVerReportes(usuario) {
  if (!usuario) return false;
  if (usuario.role === "admin") return true;
  return PERMISOS_DE_GESTION.some((permiso) => permisosDe(usuario).includes(permiso));
}

/** ¿Ve todos los expedientes (supervisión) o solo los que le tocan y los que emitió? */
function veTodosLosExpedientes(usuario) {
  if (!usuario) return false;
  if (usuario.role === "admin") return true;
  return PERMISOS_DE_SUPERVISION.some((permiso) => permisosDe(usuario).includes(permiso));
}

/**
 * ¿Puede esta persona ver este expediente? `actor` es { userId, verTodo }; `expediente` trae
 * usuario_solicitante_id y funcionario_responsable_id.
 */
function puedeVerExpediente(actor, expediente) {
  if (actor.verTodo) return true;
  return expediente.usuario_solicitante_id === actor.userId || expediente.funcionario_responsable_id === actor.userId;
}

module.exports = { PERMISOS_DE_GESTION, PERMISOS_DE_SUPERVISION, puedeVerReportes, veTodosLosExpedientes, puedeVerExpediente };
