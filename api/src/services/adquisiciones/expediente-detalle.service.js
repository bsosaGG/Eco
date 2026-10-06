// Detalle completo de un expediente (trámite embebido + nombres de las personas). Lo devuelven
// casi todos los casos de uso al terminar, para que el frontend repinte la pantalla con un solo
// objeto. Vive aparte para que cualquier caso de uso lo use sin dependencias circulares.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const expedientes = require("./repositories/expedientes.repository");
const usuarios = require("./repositories/usuarios.repository");
const { idsDeActores, anexarNombresDeActores } = require("./domain/expediente-actores");
const { conSalidas } = require("./domain/historial-estados");

/**
 * El expediente por id numérico o código, con el nombre de cada persona que intervino (los ids se
 * resuelven en una sola consulta a db_global_users). undefined si no existe.
 */
async function getExpedienteDetalle(idOCodigo) {
  const expediente = await expedientes.findDetalle(adquisicionesDb, idOCodigo);
  if (!expediente) return undefined;

  const nombrePorId = await usuarios.findNombresPorId(idsDeActores(expediente));
  expediente.historial_estados = conSalidas(expediente.historial_estados);
  return anexarNombresDeActores(expediente, nombrePorId);
}

module.exports = { getExpedienteDetalle };
