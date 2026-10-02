// Aplica al resumen de un expediente los cambios enviados desde el formulario
// (Etapas 1 a 3). Es una función pura: valida, normaliza y devuelve el nuevo
// resumen sin tocar la base de datos.
const { ValidationError } = require("../errors");
const { isPlainObject } = require("./text-utils");
const { roundHalfEven } = require("./scoring/numeric");
const { SUMMARY_FIELD_IDS, AUDIENCE_FIELD_IDS, MEDIA_FIELD_NAMES } = require("./brief-fields");
const {
  normalizeScoringPosition,
  normalizeSelectionJustification,
  validateSelectionJustifications,
} = require("./selection-justification");
const { buildCampaignPriorities, DEFAULT_WEIGHTS } = require("./campaign-priorities");

const PLANNING_ACTIONS = ["draft", "continue", "generate"];
const MAX_MEDIA_ENTRIES = 50;

const asText = (value) => (value === null || value === undefined ? "" : String(value));

function ignoredKeysOf(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => typeof item === "string");
}

function languageReview(ignoredKeys, now) {
  return { status: "reviewed", ignored_keys: ignoredKeys, reviewed_at: now.toISOString() };
}

/** Entero opcional: acepta números y textos numéricos; cualquier otra cosa -> null. */
function optionalInt(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.trunc(raw) : null;
  const text = String(raw).trim();
  return /^[+-]?\d+$/.test(text) ? parseInt(text, 10) : null;
}

/** Decimal opcional redondeado a 2 posiciones; cualquier valor no numérico -> null. */
function optionalFloat(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const parsed = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(parsed) || String(raw).trim() === "") return null;
  return roundHalfEven(parsed, 2);
}

// ---------------------------------------------------------------------------
// Etapa 1: campos del Brief
// ---------------------------------------------------------------------------

function applyBriefFields(summary, submittedFields, now) {
  summary.fields = isPlainObject(summary.fields) ? summary.fields : {};

  for (const fieldId of SUMMARY_FIELD_IDS) {
    const submitted = submittedFields[fieldId];
    if (!isPlainObject(submitted)) continue; // el campo no vino en la petición: queda igual

    const field = (summary.fields[fieldId] ||= { name: "", value: "", status: "not_found", source: "user" });
    const value = asText(submitted.value).trim();
    const originalValue = asText(field.value).trim();

    field.value = value;
    field.status = value ? "completed" : "not_found";
    field.source = value !== originalValue ? "user_review" : field.source || "structured_brief";
    field.language_review = languageReview(ignoredKeysOf(submitted.ignored_keys), now);

    if (AUDIENCE_FIELD_IDS.includes(fieldId) && "territory" in submitted) {
      const territory = asText(submitted.territory).trim();
      const originalTerritory = asText(field.territory).trim();
      field.territory = territory;
      if (territory !== originalTerritory) field.source = "user_review";
      field.status = field.value || territory ? "completed" : "not_found";
    }
  }
}

// ---------------------------------------------------------------------------
// Etapa 3: medios seleccionados
// ---------------------------------------------------------------------------

function normalizeMediaFields(rawFields, previousFields, now) {
  const result = {};
  for (const [fieldId, fieldName] of Object.entries(MEDIA_FIELD_NAMES)) {
    const raw = isPlainObject(rawFields[fieldId]) ? rawFields[fieldId] : {};
    const previous = isPlainObject(previousFields[fieldId]) ? previousFields[fieldId] : {};
    const value = asText(raw.value).trim();
    const previousValue = asText(previous.value).trim();
    result[fieldId] = {
      name: fieldName,
      value,
      status: value ? "completed" : "not_found",
      source: value !== previousValue ? "user_review" : previous.source || "user",
      language_review: languageReview(ignoredKeysOf(raw.ignored_keys), now),
    };
  }
  return result;
}

function normalizeMediaEntries(submitted, existing, now) {
  if (!Array.isArray(submitted)) throw new ValidationError("La información de medios debe ser una lista.");
  if (submitted.length > MAX_MEDIA_ENTRIES) {
    throw new ValidationError(`El formulario admite un máximo de ${MAX_MEDIA_ENTRIES} medios por expediente.`);
  }

  const normalized = [];
  submitted.forEach((raw, index) => {
    if (!isPlainObject(raw)) return;

    const medium = asText(raw.medium).trim();
    const previousEntry = isPlainObject(existing[index]) ? existing[index] : {};
    const previousFields = isPlainObject(previousEntry.fields) ? previousEntry.fields : {};
    const fields = normalizeMediaFields(isPlainObject(raw.fields) ? raw.fields : {}, previousFields, now);

    const hasContent = Boolean(medium) || Object.values(fields).some((field) => field.value);
    if (!hasContent) return;

    normalized.push({
      medium,
      selection_justification: normalizeSelectionJustification(raw.selection_justification),
      profile: asText(raw.profile).trim(),
      category: asText(raw.category).trim(),
      selection_source: asText(raw.selection_source ?? "manual").trim() || "manual",
      catalog_media_id: optionalInt(raw.catalog_media_id),
      catalog_media_name: asText(raw.catalog_media_name).trim(),
      scoring_method: asText(raw.scoring_method).trim(),
      scoring_score: optionalFloat(raw.scoring_score),
      scoring_confidence: optionalFloat(raw.scoring_confidence),
      scoring_compatibility: asText(raw.scoring_compatibility).trim(),
      scoring_position: normalizeScoringPosition(raw.scoring_position),
      fields,
    });
  });
  return normalized;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * @param {object} args
 * @param {object} args.summary  resumen vigente (no se modifica)
 * @param {object} args.input    { fields, media_entries?, planning_action, priorities? }
 * @param {Date}   [args.now]
 * @returns {{ summary: object, planningAction: string }}
 */
function applySummaryUpdate({ summary, input, now = new Date() }) {
  if (!isPlainObject(input)) throw new ValidationError("La petición no contiene datos válidos.");

  const planningAction = input.planning_action ?? "draft";
  if (!PLANNING_ACTIONS.includes(planningAction)) throw new ValidationError("Acción de planificación inválida");

  const next = structuredClone(summary);
  applyBriefFields(next, isPlainObject(input.fields) ? input.fields : {}, now);

  if (input.media_entries !== undefined) {
    next.media_entries = normalizeMediaEntries(input.media_entries, summary.media_entries || [], now);
  } else if (!Array.isArray(next.media_entries)) {
    next.media_entries = [];
  }

  // Guardar como borrador permite medios sin justificar; continuar o generar no.
  if (planningAction !== "draft") validateSelectionJustifications(next.media_entries);

  const priorities = isPlainObject(input.priorities)
    ? input.priorities
    : { preset: next.campaign_priorities?.preset, weights: next.campaign_priorities?.weights || DEFAULT_WEIGHTS };
  next.campaign_priorities = buildCampaignPriorities(priorities, now);

  const fields = Object.values(next.fields);
  const completed = fields.filter((field) => field.status === "completed").length;
  next.completed_count = completed;
  next.missing_count = fields.length - completed;
  next.updated_at = now.toISOString();

  return { summary: next, planningAction };
}

module.exports = { applySummaryUpdate, PLANNING_ACTIONS, MAX_MEDIA_ENTRIES };
