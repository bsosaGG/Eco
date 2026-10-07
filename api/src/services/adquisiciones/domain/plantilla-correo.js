// Plantilla del correo de aviso del trámite (HTML con estilos en línea, apto para clientes de correo,
// más su versión en texto plano). Lógica pura, sin I/O: recibe todos los datos ya resueltos.
//
// El correo responde, de un vistazo: qué pasó, de qué estado a cuál, quién lo hizo, cuándo, a qué
// expediente se refiere (objeto, unidad, solicitante, persona asignada, monto) y cómo abrirlo.

const ZONA_HORARIA = "America/Guatemala";

// Colores de la app (tailwind.config.js de adquisiciones-app).
const AZUL_MARINO = "#0b1f45";
const AZUL_INSTITUCIONAL = "#1e88e5";

// Color de cada tipo de aviso (la etiqueta de arriba del título).
const TIPOS = {
  asignacion: { etiqueta: "Expediente asignado", color: AZUL_INSTITUCIONAL },
  cambio_etapa: { etiqueta: "Cambio de etapa", color: "#0b7a4b" },
  devolucion: { etiqueta: "Devuelto con observaciones", color: "#c62828" },
};

// Color semántico de cada estado (columna `color` de estados_expediente) -> fondo y texto.
const COLORES_ESTADO = {
  secondary: { fondo: "#eceff1", texto: "#455a64" },
  primary: { fondo: "#dbeafe", texto: "#1d4ed8" },
  warning: { fondo: "#fef3c7", texto: "#b45309" },
  info: { fondo: "#e0f2fe", texto: "#0369a1" },
  success: { fondo: "#dcfce7", texto: "#15803d" },
  danger: { fondo: "#fee2e2", texto: "#b91c1c" },
  dark: { fondo: "#e2e8f0", texto: "#334155" },
};

const ETAPAS = {
  Solicitud: "Solicitud",
  Cotizacion: "Cotizaciones",
  CDP: "CDP",
  OrdenCompra: "Orden de compra",
  Recepcion: "Recepción",
  Financiero: "Fase financiera",
  Cierre: "Cierre",
  Devolucion: "Devuelto",
};

const escaparHtml = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** "5 de octubre de 2026, 3:45 p. m." en hora de Guatemala; "" si la fecha no es válida. */
function formatearFechaHora(valor) {
  const fecha = new Date(valor);
  if (!valor || Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleString("es-GT", {
    timeZone: ZONA_HORARIA,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "menos de 1 min", "35 min", "5 h 20 min", "3 d 4 h"; "" si no hay dato. */
function formatearDuracion(ms) {
  if (ms == null || Number.isNaN(ms)) return "";
  const MIN = 60 * 1000;
  const HORA = 60 * MIN;
  const DIA = 24 * HORA;
  if (ms < MIN) return "menos de 1 min";
  if (ms < HORA) return `${Math.floor(ms / MIN)} min`;
  if (ms < DIA) {
    const horas = Math.floor(ms / HORA);
    const minutos = Math.floor((ms % HORA) / MIN);
    return minutos ? `${horas} h ${minutos} min` : `${horas} h`;
  }
  const dias = Math.floor(ms / DIA);
  const horas = Math.floor((ms % DIA) / HORA);
  return horas ? `${dias} d ${horas} h` : `${dias} d`;
}

const formatearMonto = (monto) =>
  monto == null || monto === "" ? "" : `Q ${Number(monto).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;

/** Frase principal según qué pasó y a quién se le avisa (`rol`: "solicitante" o "asignado"). */
function frasePrincipal({ evento, rol, expediente, detalle }) {
  const sujeto = rol === "solicitante" ? "Su solicitud" : "El expediente a su cargo";
  if (evento === "asignacion") {
    if (rol === "asignado") {
      return detalle.pasoTitulo ? `Pendiente de su atención: ${detalle.pasoTitulo}.` : "Se le asignó este expediente para su gestión.";
    }
    return `Su solicitud fue asignada a ${expediente.asignadoA} y se encuentra en «${expediente.estado}».`;
  }
  if (evento === "devolucion") return `${sujeto} fue devuelto con observaciones y necesita corrección.`;
  const siguiente = detalle.responsableNombre ? ` Responsable del siguiente paso: ${detalle.responsableNombre}.` : "";
  return (
    (detalle.estadoAnterior
      ? `${sujeto} avanzó de «${detalle.estadoAnterior}» a «${expediente.estado}».`
      : `${sujeto} avanzó a «${expediente.estado}».`) + siguiente
  );
}

/** Las filas de datos del expediente y de lo ocurrido, ya sin las vacías: [[etiqueta, valor], ...]. */
function filasDelCorreo({ evento, expediente, detalle }) {
  const asignadoA = evento === "asignacion" ? detalle.asignadoA || expediente.asignadoA : expediente.asignadoA;
  const tiempoAnterior = detalle.tiempoEnEstadoAnteriorMs != null ? formatearDuracion(detalle.tiempoEnEstadoAnteriorMs) : "";
  return [
    ["Expediente", expediente.codigo],
    ["Objeto de la compra", expediente.objeto],
    ["Unidad solicitante", expediente.unidad],
    ["Solicitante", expediente.solicitante],
    ["Responsable actual", asignadoA],
    ["Etapa", ETAPAS[expediente.etapa] || ""],
    ["Tipo de compra", expediente.tipoCompra],
    ["Monto estimado", formatearMonto(expediente.montoEstimado)],
    ["Realizado por", detalle.realizadoPor],
    ["Fecha y hora", formatearFechaHora(detalle.ocurrioEn)],
    [detalle.estadoAnterior ? `Tiempo en «${detalle.estadoAnterior}»` : "", tiempoAnterior],
  ].filter(([etiqueta, valor]) => etiqueta && valor);
}

const insignia = (nombre, color) => {
  const { fondo, texto } = COLORES_ESTADO[color] || COLORES_ESTADO.secondary;
  return `<span style="display:inline-block;padding:4px 12px;border-radius:14px;background:${fondo};color:${texto};font-size:13px;font-weight:bold;">${escaparHtml(nombre)}</span>`;
};

/**
 * Arma el correo de un aviso.
 * @param {object} datos
 *   tipo        'asignacion' | 'cambio_etapa' | 'devolucion' (el aviso)
 *   evento      'asignacion' | 'cambio_estado' | 'devolucion' (lo que ocurrió)
 *   rol         'solicitante' | 'asignado' (a quién se le avisa)
 *   titulo      título del aviso (también es el asunto)
 *   expediente  { codigo, objeto, unidad, solicitante, asignadoA, estado, etapa, color, tipoCompra, montoEstimado }
 *   detalle     { estadoAnterior, colorAnterior, tiempoEnEstadoAnteriorMs, realizadoPor, ocurrioEn, motivo, asignadoA }
 *   urlExpediente  opcional: enlace público al expediente
 * @returns {{asunto: string, html: string, texto: string}}
 */
function redactarCorreo({ tipo, evento, rol, titulo, expediente, detalle = {}, urlExpediente }) {
  const tipoAviso = TIPOS[tipo] || TIPOS.cambio_etapa;
  const frase = frasePrincipal({ evento, rol, expediente, detalle });
  const filas = filasDelCorreo({ evento, expediente, detalle });
  const motivo = evento === "devolucion" ? detalle.motivo : "";

  // --- texto plano ---
  const texto = [
    titulo,
    "",
    frase,
    "",
    ...filas.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`),
    motivo ? `\nMotivo de la devolución: ${motivo}` : "",
    urlExpediente ? `\nVer el expediente: ${urlExpediente}` : "\nIngrese a SICOMPRAS · Adquisiciones para consultar el expediente.",
    "\n—\nAviso automático de SICOMPRAS · Adquisiciones. Por favor no responda a este correo.",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // --- HTML ---
  const estados = detalle.estadoAnterior
    ? `${insignia(detalle.estadoAnterior, detalle.colorAnterior)} <span style="color:#90a4ae;font-size:18px;">&rarr;</span> ${insignia(expediente.estado, expediente.color)}`
    : insignia(expediente.estado, expediente.color);
  const etiquetaEstado = detalle.estadoAnterior ? "Cambio de estado" : "Estado actual";

  const filasHtml = filas
    .map(
      ([etiqueta, valor], i) =>
        `<tr style="background:${i % 2 ? "#ffffff" : "#f7f9fc"};">` +
        `<td style="padding:9px 14px;color:#607d8b;font-size:13px;width:38%;vertical-align:top;">${escaparHtml(etiqueta)}</td>` +
        `<td style="padding:9px 14px;color:#1c2b3a;font-size:14px;vertical-align:top;">${escaparHtml(valor)}</td>` +
        `</tr>`
    )
    .join("");

  const cajaMotivo = motivo
    ? `<div style="margin:0 0 20px;padding:14px 16px;background:#fff4f4;border-left:4px solid #c62828;border-radius:4px;">` +
      `<div style="font-size:12px;color:#c62828;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Motivo de la devolución</div>` +
      `<div style="font-size:14px;color:#1c2b3a;">${escaparHtml(motivo)}</div></div>`
    : "";

  const boton = urlExpediente
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:6px 0 4px;"><tr><td style="background:${AZUL_INSTITUCIONAL};border-radius:6px;">` +
      `<a href="${escaparHtml(urlExpediente)}" style="display:inline-block;padding:12px 26px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Ver el expediente ${escaparHtml(expediente.codigo)}</a>` +
      `</td></tr></table>`
    : `<p style="margin:6px 0 0;font-size:13px;color:#607d8b;">Ingrese a SICOMPRAS · Adquisiciones para consultar el expediente.</p>`;

  const html =
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
    `<body style="margin:0;padding:0;background:#eef2f7;font-family:Segoe UI,Helvetica,Arial,sans-serif;">` +
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f7;"><tr><td align="center" style="padding:24px 12px;">` +
    `<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.12);">` +
    // encabezado
    `<tr><td style="background:${AZUL_MARINO};padding:18px 28px;color:#ffffff;">` +
    `<div style="font-size:19px;font-weight:bold;letter-spacing:.3px;">SICOMPRAS</div>` +
    `<div style="font-size:12px;color:#9fb3d1;margin-top:2px;">Adquisiciones &middot; SCSPR</div></td></tr>` +
    // cuerpo
    `<tr><td style="padding:28px 28px 8px;">` +
    `<span style="display:inline-block;padding:4px 10px;border-radius:4px;background:${tipoAviso.color};color:#ffffff;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.6px;">${escaparHtml(tipoAviso.etiqueta)}</span>` +
    `<h1 style="margin:12px 0 8px;font-size:22px;line-height:1.3;color:#0b1f45;">${escaparHtml(titulo)}</h1>` +
    `<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#33475b;">${escaparHtml(frase)}</p>` +
    `<div style="margin:0 0 20px;padding:14px 16px;background:#f7f9fc;border:1px solid #e1e8f0;border-radius:6px;">` +
    `<div style="font-size:11px;color:#607d8b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">${etiquetaEstado}</div>${estados}</div>` +
    cajaMotivo +
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e1e8f0;border-radius:6px;border-collapse:separate;margin-bottom:22px;">${filasHtml}</table>` +
    boton +
    `</td></tr>` +
    // pie
    `<tr><td style="padding:18px 28px 24px;"><div style="border-top:1px solid #e1e8f0;padding-top:14px;font-size:12px;color:#90a4ae;line-height:1.5;">` +
    `Aviso automático de SICOMPRAS &middot; Adquisiciones. Por favor no responda a este correo.</div></td></tr>` +
    `</table></td></tr></table></body></html>`;

  return { asunto: `[SICOMPRAS] ${titulo}`, texto, html };
}

/**
 * Marca un correo como de prueba: cuando todos los avisos se desvían a una sola bandeja (ver
 * ADQUISICIONES_CORREO_REDIRIGIR_A), el asunto y un aviso al inicio dicen para quién era en realidad.
 * @param {{asunto: string, html: string, texto: string}} correo
 * @param {{para: string}} origen `para`: a quién le habría llegado (nombre o correo).
 */
function marcarComoPrueba(correo, { para }) {
  const nota = `MODO PRUEBA: este aviso era para ${para}.`;
  const banner =
    `<div style="background:#fff8e1;border-bottom:2px solid #ffb300;padding:10px 16px;font:bold 13px Segoe UI,Helvetica,Arial,sans-serif;color:#7a5a00;text-align:center;">` +
    `${escaparHtml(nota)}</div>`;
  return {
    asunto: `[PRUEBA · para ${para}] ${correo.asunto}`,
    texto: `${nota}

${correo.texto}`,
    html: correo.html.replace(/(<body[^>]*>)/i, `$1${banner}`),
  };
}

module.exports = { redactarCorreo, marcarComoPrueba, formatearFechaHora, formatearDuracion, formatearMonto };
