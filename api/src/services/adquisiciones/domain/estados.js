// Nombres de los estados del expediente (tabla `estados_expediente`, sembrada en
// database/init_adquisiciones.sql) y de los documentos del trámite. Las reglas del flujo
// consultan los estados por nombre, así que viven aquí en un solo lugar.

/** Estados del expediente. */
const ESTADO_EXPEDIENTE = {
  RECIBIDA: "Recibida por Adquisiciones",
  PENDIENTE_COTIZACION: "Pendiente Cotización",
  EN_FIRMA_CDP: "En firma CDP",
  REVISION_JURIDICA: "Revisión Jurídica",
  APROBACION_JEFATURA: "Aprobación Jefatura",
  PENDIENTE_AUTORIZACION_FINAL: "Pendiente Autorización Final",
  EN_CONFORMACION: "Expediente en Conformación",
  FASE_FINANCIERA: "Fase Financiera / Liquidación",
  DEVUELTO: "Devuelto con Observaciones",
  PAGADO_Y_ARCHIVADO: "Pagado y Archivado",
};

/** Estados del Certificado de Disponibilidad Presupuestaria. */
const ESTADO_CDP = {
  BORRADOR: "Borrador",
  APROBADO_TECNICAMENTE: "Aprobado Técnicamente",
  APROBADO: "Aprobado",
};

/** Estados de la Orden de Compra. */
const ESTADO_ORDEN_COMPRA = {
  BORRADOR: "Borrador",
  APROBADA_JEFATURA: "Aprobada Jefatura",
  EMITIDA: "Emitida",
};

/** Estados de las etapas financieras. */
const ESTADO_FINANCIERO = {
  REGISTRADO: "Registrado",
  PENDIENTE: "Pendiente",
  TRAMITADO: "Tramitado",
};

module.exports = { ESTADO_EXPEDIENTE, ESTADO_CDP, ESTADO_ORDEN_COMPRA, ESTADO_FINANCIERO };
