// Avance del expediente entre estados del flujo. Cada paso del trámite (adjudicar, aprobar la OC,
// trasladar a Contabilidad...) termina moviendo el expediente al siguiente estado por su nombre.
const catalogos = require("./repositories/catalogos.repository");
const expedientes = require("./repositories/expedientes.repository");
const notificaciones = require("./notificaciones.service");
const { EVENTO } = require("./domain/notificaciones");

/**
 * Mueve el expediente al estado `nombreEstado` dentro de la transacción `tx` y, si el estado
 * cambió, avisa al solicitante y a la persona asignada (salvo a quien hizo la acción, `actorId`).
 * Si el estado no existe en el catálogo conserva el actual en vez de fallar.
 */
async function avanzarEstado(tx, idExpediente, nombreEstado, actorId) {
  const idEstado = await catalogos.findEstadoIdPorNombre(tx, nombreEstado);
  const idEstadoAnterior = await expedientes.findIdEstadoActual(tx, idExpediente);
  await expedientes.setEstado(tx, idExpediente, idEstado);

  if (idEstado !== undefined && idEstado !== idEstadoAnterior) {
    await notificaciones.registrar(tx, {
      evento: EVENTO.CAMBIO_ESTADO,
      idExpediente,
      actorId,
      estado: nombreEstado,
    });
  }
}

module.exports = { avanzarEstado };
