// Construcción de la Solicitud de Compra a partir del expediente (sin I/O).
//
// Principios (heredados del sistema original):
//  - El medio/proveedor elegido se usa solo como referencia interna.
//  - La salida describe el servicio, nunca identifica al proveedor.
//  - No se usan datos de scoring en el documento.
//  - La justificación base es determinista; el analista puede reemplazarla (o usar
//    el borrador generado con IA local) antes de generar el Excel.
const { ValidationError } = require("../errors");
const { collapseWhitespace, isPlainObject } = require("./text-utils");
const { timezone } = require("../../../config/plan-medios.config");

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const FORBIDDEN_PUBLIC_TERMS = [
  "scoring",
  "puntaje orientativo",
  "confianza de datos",
  "compatibilidad muy alta",
  "compatibilidad alta",
  "compatibilidad media",
  "medio seleccionado",
  "proveedor seleccionado",
];

const TERRITORIAL_MARKERS = [
  "área rural", "áreas rurales", "cabecera departamental", "cabeceras departamentales",
  "ciudad intermedia", "ciudades intermedias", "zona fronteriza", "zonas fronterizas",
  "municipio", "municipios", "departamento", "departamentos", "región", "regiones",
  "comunidad", "comunidades", "territorio", "territorios", "área metropolitana", "áreas metropolitanas",
];

const NON_TERRITORIAL_MARKERS = [
  "rating", "grp", "índice", "indices", "audiencia", "alcance reportado", "medición", "catálogo",
  "preseleccion", "personas por", "millones", "por ciento", "%",
];

// ---------------------------------------------------------------------------
// Fecha en Guatemala
// ---------------------------------------------------------------------------

function guatemalaParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/** "30 de septiembre de 2026" en hora de Guatemala. */
function todayInSpanish(now = new Date()) {
  const { day, month, year } = guatemalaParts(now);
  return `${parseInt(day, 10)} de ${MONTHS[parseInt(month, 10) - 1]} de ${year}`;
}

/** Marca de tiempo ISO con el desfase de Guatemala (UTC-6, sin horario de verano). */
function guatemalaIsoNow(now = new Date()) {
  const p = guatemalaParts(now);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}.${String(now.getMilliseconds()).padStart(3, "0")}-06:00`;
}

// ---------------------------------------------------------------------------
// Lectura de campos
// ---------------------------------------------------------------------------

function fieldValue(summary, fieldId) {
  const fields = summary.fields;
  if (!isPlainObject(fields)) return "";
  const field = fields[fieldId];
  return isPlainObject(field) ? String(field.value ?? "").trim() : "";
}

function mediaFieldValue(entry, fieldId) {
  const fields = entry.fields;
  if (!isPlainObject(fields)) return "";
  const field = fields[fieldId];
  return isPlainObject(field) ? String(field.value ?? "").trim() : "";
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

function limitWords(value, maxWords) {
  const normalized = collapseWhitespace(value);
  if (!normalized) return "";
  if (normalized.split(" ").length <= maxWords) return normalized;

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const selected = [];
  let wordCount = 0;
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const length = sentence.split(/\s+/).length;
    if (wordCount + length > maxWords) break;
    selected.push(sentence);
    wordCount += length;
  }
  if (selected.length) return selected.join(" ").replace(/[ .;:]+$/, "") + ".";
  // Nunca mutilar la primera oración: se conserva completa antes que dejarla incompleta.
  return normalized;
}

function compactFragment(value, maxWords) {
  const normalized = collapseWhitespace(value).replace(/[ .;:]+$/, "");
  return normalized ? limitWords(normalized, maxWords) : "";
}

function servicePhrase(profile) {
  const normalized = collapseWhitespace(profile);
  if (!normalized) return "un servicio de divulgación";
  const lowered = normalized.toLowerCase();
  if (["servicio ", "un servicio ", "una contratación "].some((prefix) => lowered.startsWith(prefix))) {
    return normalized;
  }
  return `un servicio de ${normalized}`;
}

function coverageLabel(profile, text) {
  const lowered = String(profile || "").toLowerCase();
  if (lowered.includes("nacional") || text.includes("cobertura nacional")) return "cobertura nacional";
  if (lowered.includes("regional") && lowered.includes("departamental")) return "cobertura regional y departamental";
  if (lowered.includes("regional")) return "cobertura regional";
  if (lowered.includes("departamental")) return "cobertura departamental";
  if (lowered.includes("territorial") || lowered.includes("comunitar")) return "cobertura territorial";
  if (lowered.includes("municipal") || text.includes("municipios")) return "cobertura municipal y territorial";
  return "cobertura acorde con el perfil del servicio";
}

function territorialDetail({ audience, technical, objective, context }) {
  const sources = [audience, technical, objective, context];
  const emphasis = /con\s+énfasis\s+en\s+(.+?)(?:[.;]|$)/i;

  // Prioridad 1: frases explícitas del tipo "con énfasis en ...".
  for (const source of sources) {
    const value = collapseWhitespace(source);
    if (!value) continue;
    const match = emphasis.exec(value);
    if (!match) continue;
    let candidate = match[1].replace(/^[ ,.;:]+|[ ,.;:]+$/g, "");
    const lowered = candidate.toLowerCase();
    if (
      TERRITORIAL_MARKERS.some((marker) => lowered.includes(marker)) &&
      !NON_TERRITORIAL_MARKERS.some((marker) => lowered.includes(marker))
    ) {
      candidate = candidate.replace(/^(?:familias|población|personas|habitantes)\s+de\s+/i, "");
      return compactFragment(candidate, 24);
    }
  }

  // Prioridad 2: primera oración territorial sin métricas ni información de catálogo/scoring.
  for (const source of sources) {
    const value = collapseWhitespace(source);
    if (!value) continue;
    for (const sentence of value.split(/(?<=[.!?])\s+/)) {
      let candidate = sentence.replace(/^[ ,.;:]+|[ ,.;:]+$/g, "");
      const lowered = candidate.toLowerCase();
      if (!TERRITORIAL_MARKERS.some((marker) => lowered.includes(marker))) continue;
      if (NON_TERRITORIAL_MARKERS.some((marker) => lowered.includes(marker))) continue;
      candidate = candidate.replace(/^(?:hombres y mujeres|personas|habitantes|familias)[^,;]{0,70},\s*/i, "");
      return compactFragment(candidate, 24);
    }
  }
  return "";
}

function coverageScope({ summary, mediaEntry, profile }) {
  const objective = fieldValue(summary, "3.1");
  const context = fieldValue(summary, "2.1");
  const audience = mediaFieldValue(mediaEntry, "6.2");
  const technical = mediaFieldValue(mediaEntry, "6.3");

  const sourceText = [profile, audience, technical, objective, context].filter(Boolean).join(" ");
  const label = coverageLabel(profile, collapseWhitespace(sourceText).toLowerCase());
  const detail = territorialDetail({ audience, technical, objective, context });

  if (detail) {
    return `${label}, con alcance en ${detail}, de acuerdo con la planificación territorial definida para la campaña.`;
  }
  return `${label}, conforme al perfil de contratación y a la planificación territorial definida para la campaña.`;
}

function buildDescription({ summary, profile, category }) {
  const campaign = fieldValue(summary, "1.1");
  const service = profile || category || "servicio de divulgación";
  const parts = ["CONTRATACIÓN DE SERVICIO PARA LA DIVULGACIÓN DE INFORMACIÓN"];
  if (campaign) parts.push(`DE LA CAMPAÑA ${campaign}`);
  parts.push(`A TRAVÉS DE ${service}`);
  return parts.join(", ").toUpperCase().replace(/\s+$/, "") + ".";
}

function buildProvisionalJustification({ summary, mediaEntry, profile }) {
  const campaign = fieldValue(summary, "1.1");
  const objective = fieldValue(summary, "3.1");
  const purpose = mediaFieldValue(mediaEntry, "6.1");
  const audience = mediaFieldValue(mediaEntry, "6.2");

  const clauses = [
    `Se requiere la contratación de ${servicePhrase(profile)} para apoyar la divulgación ` +
      "de información institucional de interés público" +
      (campaign ? ` de la campaña ${campaign}` : "") +
      ".",
  ];
  if (objective) {
    clauses.push(
      "La contratación contribuirá al cumplimiento del objetivo de comunicación establecido: " +
        compactFragment(objective, 34) +
        "."
    );
  } else if (purpose) {
    clauses.push("El servicio permitirá " + compactFragment(purpose, 34) + ".");
  }
  if (audience) {
    clauses.push(
      "Asimismo, contribuirá a alcanzar al público objetivo definido: " + compactFragment(audience, 28) + "."
    );
  }
  clauses.push(
    "Por su naturaleza, permitirá difundir los contenidos de manera clara, " +
      "oportuna y acorde con los objetivos institucionales."
  );
  return clauses.join(" ").trim();
}

function buildTechnicalSpecifications({ summary, mediaEntry, profile }) {
  const lines = [`TIPO DE SERVICIO: ${profile}`];
  const campaign = fieldValue(summary, "1.1");
  if (campaign) lines.push(`CAMPAÑA: ${campaign}`);

  const format = mediaFieldValue(mediaEntry, "6.5");
  const period = mediaFieldValue(mediaEntry, "6.6");
  const quantity = mediaFieldValue(mediaEntry, "6.7");
  if (format) lines.push("FORMATO DEL MATERIAL: " + compactFragment(format, 28));
  if (period) lines.push("PERÍODO Y PAUTA: " + compactFragment(period, 38));
  if (quantity) lines.push("MATERIALES: " + compactFragment(quantity, 28));

  lines.push("COBERTURA / ALCANCE DEL SERVICIO: " + coverageScope({ summary, mediaEntry, profile }));
  lines.push(
    "EVIDENCIA DE PRESTACIÓN: deberá presentarse la documentación o " +
      "evidencia que corresponda al tipo de servicio efectivamente prestado."
  );
  return lines.join("\n").trim();
}

// ---------------------------------------------------------------------------
// Neutralidad
// ---------------------------------------------------------------------------

/** Bloquea la solicitud si menciona al medio/proveedor o información interna de selección. */
function validateNeutrality(request, mediaEntry) {
  const publicText = [request.description, request.justification, request.technical_specifications]
    .map((value) => String(value ?? ""))
    .join("\n")
    .toLowerCase();

  const forbiddenNames = new Set([String(mediaEntry.medium ?? "").trim(), String(mediaEntry.catalog_media_name ?? "").trim()]);
  for (const name of forbiddenNames) {
    const normalized = name.toLowerCase().trim();
    if (normalized.length >= 4 && publicText.includes(normalized)) {
      throw new ValidationError(
        "La Solicitud de Compra contiene el nombre del medio o proveedor seleccionado. " +
          "La generación fue bloqueada para preservar la neutralidad del proceso de adquisición."
      );
    }
  }
  if (FORBIDDEN_PUBLIC_TERMS.some((term) => publicText.includes(term))) {
    throw new ValidationError(
      "La Solicitud de Compra contiene información interna del proceso de selección. La generación fue bloqueada."
    );
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Arma la solicitud de compra de un medio seleccionado y valida su neutralidad.
 * @returns {object} solicitud con `metadata` interna (no se expone al cliente).
 */
function buildPurchaseRequest({
  expedienteId,
  summary,
  mediaEntryIndex,
  requestNumber = "",
  requestDate = "",
  budgetLine = "",
  supplyCode = "N/A",
  quantity = "1",
  unit = "SERVICIO",
  justificationOverride = "",
  now = new Date(),
}) {
  const mediaEntries = summary.media_entries ?? [];
  if (!Array.isArray(mediaEntries)) {
    throw new ValidationError("El expediente no contiene una lista válida de medios seleccionados.");
  }
  if (!Number.isInteger(mediaEntryIndex) || mediaEntryIndex < 0 || mediaEntryIndex >= mediaEntries.length) {
    throw new ValidationError("El índice del medio seleccionado no existe en el expediente.");
  }
  const mediaEntry = mediaEntries[mediaEntryIndex];
  if (!isPlainObject(mediaEntry)) {
    throw new ValidationError("La selección de medio indicada no tiene una estructura válida.");
  }

  const category = String(mediaEntry.category ?? "").trim();
  let profile = String(mediaEntry.profile ?? "").trim();
  if (!profile) profile = category || "servicio de divulgación";

  const trimmed = (value) => String(value ?? "").trim();
  const override = trimmed(justificationOverride);

  const technicalSpecifications = buildTechnicalSpecifications({ summary, mediaEntry, profile });
  const description = buildDescription({ summary, profile, category });
  const justification = override || buildProvisionalJustification({ summary, mediaEntry, profile });

  const request = {
    expediente_id: expedienteId,
    media_entry_index: mediaEntryIndex,
    request_number: trimmed(requestNumber),
    request_date: trimmed(requestDate) || todayInSpanish(now),
    requesting_unit: "UNIDAD DE MEDIOS",
    annex: true,
    purchase_type: "SERVICIOS",
    budget_line: trimmed(budgetLine),
    supply_code: trimmed(supplyCode) || "N/A",
    description,
    quantity: trimmed(quantity) || "1",
    unit: trimmed(unit) || "SERVICIO",
    justification,
    justification_source: override ? "human_reviewed_override" : "deterministic_provisional_sc2c",
    technical_specifications: technicalSpecifications,
    special_conditions: [],
    metadata: {
      profile,
      category,
      selection_source: trimmed(mediaEntry.selection_source),
      catalog_media_id: mediaEntry.catalog_media_id ?? null,
      catalog_media_name: trimmed(mediaEntry.catalog_media_name),
      scoring_method: trimmed(mediaEntry.scoring_method),
      generated_at: guatemalaIsoNow(now),
      neutrality_validated: false,
    },
  };

  validateNeutrality(request, mediaEntry);
  request.metadata.neutrality_validated = true;
  return request;
}

/** Versión pública de la solicitud: sin la metadata interna del proceso de selección. */
function toPublicRequest(request) {
  const { metadata, ...publicRequest } = request;
  return publicRequest;
}

module.exports = {
  buildPurchaseRequest,
  toPublicRequest,
  validateNeutrality,
  todayInSpanish,
  fieldValue,
  mediaFieldValue,
  limitWords,
  compactFragment,
};
