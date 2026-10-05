// Qué avisos genera cada cambio del expediente y cómo se redactan. Lógica pura, sin I/O.
//
// Reglas:
//  - Los avisos son para el solicitante (quien emitió la solicitud) y para la persona asignada.
//  - Quien hizo la acción no se avisa a sí mismo.
//  - Cada persona recibe un solo aviso por evento.

const TIPO_NOTIFICACION = {
  CAMBIO_ETAPA: "cambio_etapa",
  ASIGNACION: "asignacion",
  DEVOLUCION: "devolucion",
};

const EVENTO = {
  CAMBIO_ESTADO: "cambio_estado",
  ASIGNACION: "asignacion",
  DEVOLUCION: "devolucion",
};

const TITULO_MAX = 250;
const recortar = (texto) => (texto.length > TITULO_MAX ? `${texto.slice(0, TITULO_MAX - 1)}…` : texto);

/**
 * Avisos a generar para un evento. `expediente`: { codigo_expediente, objeto_compra, solicitanteId,
 * responsableId }. Devuelve [{ idUsuario, tipo, titulo, mensaje }].
 *
 * Datos del evento: CAMBIO_ESTADO { estado } · ASIGNACION { estado, idAsignado, nombreAsignado } ·
 * DEVOLUCION { motivo }.
 */
function planificarNotificaciones({ evento, expediente, actorId, ...datos }) {
  const { codigo_expediente: codigo, objeto_compra: objeto, solicitanteId, responsableId } = expediente;
  const avisos = [];
  const yaAvisados = new Set(actorId == null ? [] : [Number(actorId)]);

  const avisar = (idUsuario, tipo, titulo, mensaje) => {
    if (idUsuario == null || yaAvisados.has(Number(idUsuario))) return;
    yaAvisados.add(Number(idUsuario));
    avisos.push({ idUsuario: Number(idUsuario), tipo, titulo: recortar(titulo), mensaje });
  };

  if (evento === EVENTO.ASIGNACION) {
    // Primero la persona asignada (si el solicitante es la misma persona, recibe el aviso de asignación).
    avisar(datos.idAsignado, TIPO_NOTIFICACION.ASIGNACION, `Se te asignó el expediente ${codigo}`, `${objeto}.`);
    avisar(
      solicitanteId,
      TIPO_NOTIFICACION.CAMBIO_ETAPA,
      `${codigo} fue asignado a ${datos.nombreAsignado}`,
      `${objeto}. Estado actual: ${datos.estado}.`
    );
    return avisos;
  }

  if (evento === EVENTO.DEVOLUCION) {
    const titulo = `${codigo} fue devuelto con observaciones`;
    const mensaje = `${objeto}. Motivo: ${datos.motivo}.`;
    avisar(solicitanteId, TIPO_NOTIFICACION.DEVOLUCION, titulo, mensaje);
    avisar(responsableId, TIPO_NOTIFICACION.DEVOLUCION, titulo, mensaje);
    return avisos;
  }

  // CAMBIO_ESTADO
  const titulo = `${codigo} avanzó a «${datos.estado}»`;
  const mensaje = `${objeto}. Estado actual: ${datos.estado}.`;
  avisar(solicitanteId, TIPO_NOTIFICACION.CAMBIO_ETAPA, titulo, mensaje);
  avisar(responsableId, TIPO_NOTIFICACION.CAMBIO_ETAPA, titulo, mensaje);
  return avisos;
}

const escaparHtml = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Correo del aviso. `urlExpediente` es opcional (solo si el servidor conoce la dirección pública). */
function redactarCorreo({ titulo, mensaje, codigoExpediente, urlExpediente }) {
  const asunto = `[SICOMPRAS] ${titulo}`;
  const texto = [titulo, "", mensaje, urlExpediente ? `\nVer el expediente: ${urlExpediente}` : ""].join("\n").trim();
  const enlace = urlExpediente
    ? `<p><a href="${escaparHtml(urlExpediente)}">Ver el expediente ${escaparHtml(codigoExpediente)}</a></p>`
    : "";
  const html =
    `<h2>${escaparHtml(titulo)}</h2>` +
    `<p>${escaparHtml(mensaje)}</p>` +
    enlace +
    `<p style="color:#888;font-size:12px">Aviso automático de SICOMPRAS · Adquisiciones. No responda a este correo.</p>`;
  return { asunto, texto, html };
}

module.exports = { TIPO_NOTIFICACION, EVENTO, planificarNotificaciones, redactarCorreo };
