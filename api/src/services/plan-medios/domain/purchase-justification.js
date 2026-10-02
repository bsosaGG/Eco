// Reglas para el borrador de justificación de la Solicitud de Compra redactado con IA local.
//
// - Se envía al modelo el mínimo de contexto: objetivo, finalidad, público y campaña.
// - Nunca se envían nombres comerciales, proveedor, catálogo ni datos de scoring.
// - El resultado se valida (longitud, neutralidad, cifras) y siempre es un borrador
//   sujeto a revisión humana; nunca se aplica automáticamente.
const { ExternalServiceError, ValidationError } = require("../errors");
const { fieldValue, mediaFieldValue } = require("./purchase-request");

const MIN_WORDS = 45;
const MAX_WORDS = 150;
const MAX_OBJECTIVE_CHARS = 620;
const MAX_PURPOSE_CHARS = 520;
const MAX_AUDIENCE_CHARS = 420;
const MAX_CONTEXT_CHARS = 420;

const SYSTEM_PROMPT =
  "Redacta una justificación administrativa institucional en español. " +
  "Usa únicamente los datos proporcionados. " +
  "No inventes cifras, fechas, lugares, públicos, resultados, beneficios, " +
  "coberturas, objetivos ni condiciones. " +
  "No menciones proveedores, empresas, medios comerciales, scoring, ranking, " +
  "catálogo, sistemas internos, IA ni Brief. " +
  "Explica por qué el servicio es pertinente para el objetivo de comunicación " +
  "y el público indicado. " +
  "Devuelve un solo párrafo sobrio de aproximadamente 80 a 120 palabras, " +
  "sin título, viñetas ni Markdown.";

const FORBIDDEN_TERMS = [
  "scoring", "puntaje", "ranking", "confianza de datos", "catálogo",
  "medio seleccionado", "proveedor seleccionado", "inteligencia artificial", "brief",
];

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

/** Recorta en un límite de caracteres, preferentemente al final de una oración o cláusula. */
function compactText(value, maxChars) {
  const normalized = normalizeText(value);
  if (normalized.length <= maxChars) return normalized;

  let candidate = normalized.slice(0, maxChars).trimEnd();
  const floor = Math.floor(maxChars * 0.65);
  const cut = Math.max(candidate.lastIndexOf("."), candidate.lastIndexOf(";"), candidate.lastIndexOf(","));
  if (cut >= floor) {
    candidate = candidate.slice(0, cut + 1).trimEnd();
  } else {
    const lastSpace = candidate.lastIndexOf(" ");
    if (lastSpace > 0) candidate = candidate.slice(0, lastSpace).trimEnd();
  }
  return candidate;
}

/** Datos que se permite enviar al modelo (solo lo necesario, sin información interna). */
function buildAuthorizedSource({ summary, mediaEntry }) {
  const profile = String(mediaEntry.profile ?? "").trim();
  const category = String(mediaEntry.category ?? "").trim();
  const objective = compactText(fieldValue(summary, "3.1"), MAX_OBJECTIVE_CHARS);
  const purpose = compactText(mediaFieldValue(mediaEntry, "6.1"), MAX_PURPOSE_CHARS);
  const audience = compactText(mediaFieldValue(mediaEntry, "6.2"), MAX_AUDIENCE_CHARS);
  const context = compactText(fieldValue(summary, "2.1"), MAX_CONTEXT_CHARS);

  const source = {
    campaign: compactText(fieldValue(summary, "1.1"), 120),
    service_profile: profile || category || "servicio de comunicación",
    communication_objective: objective,
    service_purpose: purpose,
    target_audience: audience,
  };
  if (context && !(objective && purpose)) source.campaign_context = context;

  return Object.fromEntries(Object.entries(source).filter(([, value]) => value));
}

function validateSourceSufficiency(source) {
  if (!(source.service_profile || "").trim()) {
    throw new ValidationError("No existe un perfil público del servicio para redactar la justificación.");
  }
  const substantive = [source.communication_objective, source.service_purpose, source.campaign_context];
  if (!substantive.some((value) => (value || "").trim())) {
    throw new ValidationError(
      "La información disponible es insuficiente para generar un texto sin inventar contenido."
    );
  }
}

/** Rechaza borradores fuera de rango, con información interna o con cifras inventadas. */
function validateGeneratedText({ text, source, mediaEntry }) {
  if (!text) throw new ExternalServiceError("Ollama devolvió un texto vacío.");

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORDS || wordCount > MAX_WORDS) {
    throw new ExternalServiceError(
      `El borrador generado quedó fuera del rango de longitud permitido (${MIN_WORDS}-${MAX_WORDS} palabras).`
    );
  }

  const lowered = text.toLowerCase();
  for (const value of [String(mediaEntry.medium ?? ""), String(mediaEntry.catalog_media_name ?? "")]) {
    const normalized = value.toLowerCase().trim();
    if (normalized.length >= 4 && lowered.includes(normalized)) {
      throw new ExternalServiceError("El borrador contiene el nombre del medio o proveedor interno y fue bloqueado.");
    }
  }
  if (FORBIDDEN_TERMS.some((term) => lowered.includes(term))) {
    throw new ExternalServiceError("El borrador contiene información interna no permitida.");
  }

  const numbersIn = (value) => new Set(value.match(/\d+(?:[.,]\d+)?/g) || []);
  const allowed = numbersIn(Object.values(source).join(" "));
  const unexpected = [...numbersIn(text)].filter((number) => !allowed.has(number)).sort();
  if (unexpected.length) {
    throw new ExternalServiceError(
      "El borrador introdujo cifras que no existen en las fuentes autorizadas: " + unexpected.join(", ")
    );
  }
}

module.exports = {
  SYSTEM_PROMPT,
  MIN_WORDS,
  MAX_WORDS,
  compactText,
  buildAuthorizedSource,
  validateSourceSufficiency,
  validateGeneratedText,
};
