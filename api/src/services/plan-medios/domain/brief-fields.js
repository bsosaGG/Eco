// Catálogo de campos del formulario de Plan de Medios (numeración oficial del Brief).

/** Campos de la Etapa 1, en orden de presentación. */
const FIELD_NAMES = {
  "1.1": "Campaña",
  "1.2": "Justificación de la campaña",
  "1.3": "Ámbito territorial",
  "1.4": "Periodo previsto",
  "1.5": "Cantidad total de materiales por tipo de medio",
  "1.6": "Fecha y hora de esta versión (o actualización)",
  "1.7": "Persona/s que elaboraron y actualizaron este brief",
  "2.1": "Necesidad de publicar o difundir",
  "2.2": "Aspectos especiales o prioritarios a considerar",
  "3.1": "Objetivo general",
  "3.2": "Objetivos específicos",
  "3.3": "Público primario",
  "3.4": "Público secundario",
  "3.5": "Intermediarios",
  "5.1": "Lanzamiento",
  "5.2": "Refuerzo / recordatorio",
  "5.3": "Cierre",
};

const SUMMARY_FIELD_IDS = Object.keys(FIELD_NAMES);

/** Públicos que además llevan un campo "territorio". */
const AUDIENCE_FIELD_IDS = ["3.3", "3.4", "3.5"];

/** Campos 6.x de cada medio seleccionado (Etapa 3). */
const MEDIA_FIELD_NAMES = {
  "6.1": "Finalidad del medio en la campaña",
  "6.2": "Público objetivo al que contribuye",
  "6.3": "Especificaciones técnicas del medio",
  "6.4": "Indicador principal del medio",
  "6.5": "Formato del material",
  "6.6": "Periodo y presión",
  "6.7": "Cantidad de materiales",
};

const MEDIA_FIELD_IDS = Object.keys(MEDIA_FIELD_NAMES);

/** Campos que la plantilla Word exige siempre (1.1–1.7). */
const REQUIRED_FIELD_IDS = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"];

function fieldSortKey(fieldId) {
  const [major, minor] = fieldId.split(".").map(Number);
  return major * 100 + minor;
}

module.exports = {
  FIELD_NAMES,
  SUMMARY_FIELD_IDS,
  AUDIENCE_FIELD_IDS,
  MEDIA_FIELD_NAMES,
  MEDIA_FIELD_IDS,
  REQUIRED_FIELD_IDS,
  fieldSortKey,
};
