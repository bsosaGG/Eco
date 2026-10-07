// Bitácora de trazabilidad de un expediente (log inmutable; las escrituras las hacen los casos de
// uso con bitacora.repository.insert dentro de su propia transacción).
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const bitacora = require("./repositories/bitacora.repository");
const usuarios = require("./repositories/usuarios.repository");
const { nombreOFallback } = require("./domain/nombres-usuarios");

/** Eventos del expediente, el más reciente primero, con el nombre de quien actuó. */
async function getBitacora(idExpediente) {
  const eventos = await bitacora.listByExpediente(adquisicionesDb, idExpediente);
  if (eventos.length === 0) return eventos;

  // Enriquecer usuario_id -> nombre_completo consultando db_global_users
  // (mismo mecanismo cross-DB que usa pac.service.js:getSolicitudPorCodigo)
  const nombrePorId = await usuarios.findNombresPorId([...new Set(eventos.map((evento) => evento.usuario_id))]);

  return eventos.map((evento) => ({
    ...evento,
    usuario_nombre: nombreOFallback(nombrePorId, evento.usuario_id),
  }));
}

module.exports = { getBitacora };
