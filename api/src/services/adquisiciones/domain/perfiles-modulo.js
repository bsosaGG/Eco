/**
 * Perfiles/etapas del módulo de Adquisiciones (matriz de claude/diseno-db-adquisiciones.md).
 * Acotan los selectores de personas ("Asignar a", firmantes) a gente que de verdad pertenece
 * al módulo, en vez de listar a toda la plataforma (eso ya lo hace GET /api/user, pero solo
 * para admins). Además de estos perfiles, el rol `admin` siempre cuenta como del módulo.
 */
const PERFILES_MODULO = [
  "Unidad Solicitante",
  "Unidad de Adquisiciones",
  "Analista de Adquisiciones",
  "Asistente de Presupuesto",
  "Encargado de Presupuesto",
  "Jefe UDAF",
  "Jefe de Adquisiciones",
  "Directora General",
  "Encargado de Contabilidad",
  "Sub Despacho",
  "Administrador de Sistema / TI",
  "Auditoría Interna",
];

module.exports = { PERFILES_MODULO };
