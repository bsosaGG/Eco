// Qué avisos genera cada cambio del expediente y cómo se redactan. Lógica pura, sin I/O.
//
// Reglas:
//  - Los avisos son para el solicitante (quien emitió la solicitud) y para quien tiene el expediente.
//  - Se avisa aunque sea la misma persona quien hizo la acción (el correo dice quién fue): así el
//    solicitante siempre tiene constancia de lo que pasa con su solicitud.
//  - Cada persona recibe un solo aviso por evento.

const TIPO_NOTIFICACION = {
  CAMBIO_ETAPA: "cambio_etapa",
  ASIGNACION: "asignacion",
  DEVOLUCION: "devolucion",
};

// Lo que ocurrió (decide el texto del correo).
const EVENTO = {
  CAMBIO_ESTADO: "cambio_estado",
  ASIGNACION: "asignacion",
  DEVOLUCION: "devolucion",
};

const TITULO_MAX = 250;
const recortar = (texto) => (texto.length > TITULO_MAX ? `${texto.slice(0, TITULO_MAX - 1)}…` : texto);

/** Acumula avisos sin repetir a la misma persona. */
function acumulador() {
  const avisos = [];
  const yaAvisados = new Set();
  const avisar = (idUsuario, tipo, evento, titulo, mensaje) => {
    if (idUsuario == null || yaAvisados.has(Number(idUsuario))) return;
    yaAvisados.add(Number(idUsuario));
    avisos.push({ idUsuario: Number(idUsuario), tipo, evento, titulo: recortar(titulo), mensaje });
  };
  return { avisos, avisar };
}

/**
 * Avisos de una devolución con observaciones: al solicitante y a quien tenía el expediente.
 * `expediente`: { codigo_expediente, objeto_compra, solicitanteId, responsableId }. `motivo`: texto.
 * @returns {Array<{idUsuario, tipo, evento, titulo, mensaje}>}
 */
function planificarDevolucion({ expediente, motivo }) {
  const { codigo_expediente: codigo, objeto_compra: objeto, solicitanteId, responsableId } = expediente;
  const { avisos, avisar } = acumulador();
  const titulo = `${codigo} fue devuelto con observaciones`;
  const mensaje = `${objeto}. Motivo: ${motivo}.`;
  avisar(solicitanteId, TIPO_NOTIFICACION.DEVOLUCION, EVENTO.DEVOLUCION, titulo, mensaje);
  avisar(responsableId, TIPO_NOTIFICACION.DEVOLUCION, EVENTO.DEVOLUCION, titulo, mensaje);
  return avisos;
}

/**
 * Avisos de un movimiento del trámite: a quien le toca el paso (si cambió) y al solicitante (si el
 * estado cambió).
 * @param {object} datos
 *   expediente        { codigo_expediente, objeto_compra, solicitanteId }
 *   estado            estado actual
 *   estadoAnterior    estado del que viene, si el estado cambió en este movimiento
 *   paso              siguiente paso { tipo, titulo, perfil } (domain/siguiente-paso.js)
 *   nuevoResponsable  { id, nombre } si el expediente pasó a otra persona (null si no cambió)
 * @returns {Array<{idUsuario, tipo, evento, titulo, mensaje}>}
 */
function planificarMovimiento({ expediente, estado, estadoAnterior, paso, nuevoResponsable }) {
  const { codigo_expediente: codigo, objeto_compra: objeto, solicitanteId } = expediente;
  const { avisos, avisar } = acumulador();

  // Primero quien recibe el expediente (si es el mismo solicitante, recibe también este aviso).
  if (nuevoResponsable?.id != null && paso?.titulo) {
    avisar(
      nuevoResponsable.id,
      TIPO_NOTIFICACION.ASIGNACION,
      EVENTO.ASIGNACION,
      `Pendiente de su atención: ${paso.titulo} (${codigo})`,
      `${objeto}. Estado actual: ${estado}.`
    );
  }

  if (estadoAnterior) {
    const siguiente = nuevoResponsable?.nombre ? ` Responsable del siguiente paso: ${nuevoResponsable.nombre}.` : "";
    avisar(
      solicitanteId,
      TIPO_NOTIFICACION.CAMBIO_ETAPA,
      EVENTO.CAMBIO_ESTADO,
      `${codigo} avanzó a «${estado}»`,
      `${objeto}. Pasó de «${estadoAnterior}» a «${estado}».${siguiente}`
    );
  }
  return avisos;
}

module.exports = { TIPO_NOTIFICACION, EVENTO, planificarDevolucion, planificarMovimiento };
