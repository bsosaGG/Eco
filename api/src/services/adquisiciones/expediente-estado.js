// Avance del expediente entre estados del flujo. Cada paso del trámite (adjudicar, aprobar la OC,
// trasladar a Contabilidad...) termina moviendo el expediente al siguiente estado por su nombre. A quién
// le toca el paso siguiente (y los avisos) lo resuelve ruta.service.enrutar al final del caso de uso.
const catalogos = require("./repositories/catalogos.repository");
const expedientes = require("./repositories/expedientes.repository");

/**
 * Mueve el expediente al estado `nombreEstado` dentro de la transacción `tx`. Si el estado no existe en
 * el catálogo conserva el actual en vez de fallar.
 */
async function avanzarEstado(tx, idExpediente, nombreEstado) {
  const idEstado = await catalogos.findEstadoIdPorNombre(tx, nombreEstado);
  await expedientes.setEstado(tx, idExpediente, idEstado);
}

module.exports = { avanzarEstado };
