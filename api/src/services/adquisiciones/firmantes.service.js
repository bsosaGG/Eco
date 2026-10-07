// Firmantes por unidad solicitante: la firma 1 de la Solicitud de Compra es siempre quien solicita;
// la firma 2 varía según quién esté a cargo de esa unidad. Se apoya en `usuarios_unidad_solicitante`
// (tabla propia del módulo) y la tabla se puebla desde la pantalla "Firmantes por Unidad".
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const asignaciones = require("./repositories/asignaciones-unidad.repository");
const usuarios = require("./repositories/usuarios.repository");
const { exigirUsuarioDelModulo } = require("./usuarios-modulo.service");
const { nombreOFallback } = require("./domain/nombres-usuarios");
const { NotFoundError } = require("./errors");

/**
 * Usuarios activos asignados a la unidad (dropdown de la firma 2), con su cargo. Devuelve solo los
 * que ya estén asignados; la tabla se puebla según se confirmen las asignaciones reales.
 */
async function getUsuariosPorUnidad(idUnidadSolicitante) {
  const activas = await asignaciones.listActivas(adquisicionesDb, idUnidadSolicitante);
  if (activas.length === 0) return [];

  const cargoPorUsuario = activas.reduce((mapa, asignacion) => {
    mapa[asignacion.id_usuario] = asignacion.cargo;
    return mapa;
  }, {});

  const contactos = await usuarios.findContactoPorIds(
    activas.map((asignacion) => asignacion.id_usuario),
    { soloActivos: true }
  );
  return contactos.map((usuario) => ({ ...usuario, cargo: cargoPorUsuario[usuario.id_usuario] || null }));
}

/**
 * Pantalla "Firmantes por Unidad": TODAS las asignaciones de la unidad (activas e inactivas, para
 * poder reactivar), con el nombre y el email reales de db_global_users.
 */
async function getAsignacionesUnidad(idUnidadSolicitante) {
  const todas = await asignaciones.listTodas(adquisicionesDb, idUnidadSolicitante);
  if (todas.length === 0) return [];

  const contactos = await usuarios.findContactoPorIds([...new Set(todas.map((asignacion) => asignacion.id_usuario))]);
  const emailPorId = {};
  const nombrePorId = {};
  for (const usuario of contactos) {
    emailPorId[usuario.id_usuario] = usuario.email;
    nombrePorId[usuario.id_usuario] = usuario.nombre_completo;
  }

  return todas.map((asignacion) => ({
    ...asignacion,
    email: emailPorId[asignacion.id_usuario] || null,
    nombre_completo: nombreOFallback(nombrePorId, asignacion.id_usuario),
  }));
}

/** Asigna (o reactiva) a un usuario real del módulo como firmante de la unidad. */
async function asignarUsuarioUnidad(idUnidadSolicitante, idUsuario, cargo) {
  const usuario = await exigirUsuarioDelModulo(
    idUsuario,
    "El usuario seleccionado no existe o no pertenece al módulo de Adquisiciones."
  );
  const asignacion = await asignaciones.upsert(adquisicionesDb, {
    idUsuario,
    idUnidad: idUnidadSolicitante,
    cargo,
  });
  return { ...asignacion, ...usuario };
}

/** Quita a un usuario como firmante de la unidad (desactiva, no borra la fila). */
async function quitarAsignacionUnidad(idUnidadSolicitante, idUsuario) {
  const existia = await asignaciones.desactivar(adquisicionesDb, idUnidadSolicitante, idUsuario);
  if (!existia) throw new NotFoundError("Esa asignación no existe.");
  return { ok: true };
}

module.exports = { getUsuariosPorUnidad, getAsignacionesUnidad, asignarUsuarioUnidad, quitarAsignacionUnidad };
