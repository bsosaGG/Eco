// Formato de los números correlativos oficiales del trámite. Son funciones puras: el conteo
// de lo ya emitido vive en repositories/numeracion.repository.js.

/** Documentos que se numeran por año (p. ej. "CDP-2026-0001"). */
const DOCUMENTO = {
  CDP: "CDP",
  ORDEN_COMPRA: "ORDEN_COMPRA",
  COMPROMISO: "COMPROMISO",
  DEVENGADO: "DEVENGADO",
};

// Prefijo oficial de cada documento en su número.
const PREFIJO = {
  [DOCUMENTO.CDP]: "CDP",
  [DOCUMENTO.ORDEN_COMPRA]: "OC",
  [DOCUMENTO.COMPROMISO]: "COMP",
  [DOCUMENTO.DEVENGADO]: "DEV",
};

/** Prefijo con el que se cuentan los documentos ya emitidos del año: "CDP-2026-". */
const prefijoAnual = (documento, anio) => `${PREFIJO[documento]}-${anio}-`;

/** Número del documento: "CDP-2026-0001" (correlativo con cuatro dígitos). */
const numeroAnual = (documento, anio, correlativo) =>
  `${prefijoAnual(documento, anio)}${String(correlativo).padStart(4, "0")}`;

/**
 * Código del expediente: ABREVIATURA-CORRELATIVO-AÑO (p. ej. "UA-1-2026"). El correlativo es
 * independiente por unidad y por año, no lleva cero relleno y arranca en 1 cada año.
 */
const codigoExpediente = (codigoUnidad, correlativo, anio) => `${codigoUnidad}-${correlativo}-${anio}`;

/** Patrón LIKE para contar los expedientes de la unidad en el año: "UA-%-2026". */
const patronExpedientesDelAnio = (codigoUnidad, anio) => `${codigoUnidad}-%-${anio}`;

module.exports = { DOCUMENTO, prefijoAnual, numeroAnual, codigoExpediente, patronExpedientesDelAnio };
