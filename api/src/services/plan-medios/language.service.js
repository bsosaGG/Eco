// Casos de uso de la revisión ortográfica en línea y del diccionario institucional.
const { planMediosDb } = require("../../config/db-plan-medios");
const terms = require("./repositories/terms.repository");
const { checkText } = require("./integrations/languagetool.client");
const { ExternalServiceError, ValidationError } = require("./errors");
const { MAX_TERM_LENGTH, normalizeTerm, filterProtectedSuggestions } = require("./domain/spell-check");

/**
 * Revisa un texto con LanguageTool. Solo devuelve sugerencias: nunca modifica ni
 * guarda el texto. Si el corrector no está disponible NO es un error del sistema:
 * se responde `status: "unavailable"` y el formulario sigue siendo utilizable.
 */
async function revisarTexto({ text, language = "es" }) {
  let suggestions;
  try {
    suggestions = await checkText(text, language);
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      return { status: "unavailable", message: error.message, suggestion_count: 0, suggestions: [] };
    }
    throw error;
  }

  const protectedTerms = await terms.listTerms(planMediosDb);
  const visible = filterProtectedSuggestions(String(text ?? ""), suggestions, protectedTerms);
  return { status: "completed", suggestion_count: visible.length, suggestions: visible };
}

/** Agrega un término aprobado por una persona al diccionario institucional. */
async function agregarTermino({ term, actor }) {
  const normalized = normalizeTerm(term);
  if (!normalized) throw new ValidationError("El término no puede estar vacío.");
  if (normalized.length > MAX_TERM_LENGTH) throw new ValidationError("El término supera la longitud permitida.");

  await terms.addTerm(planMediosDb, {
    term: normalized,
    normalizedTerm: normalized.toLowerCase(),
    createdBy: actor?.email ?? null,
  });
  return {
    status: "completed",
    message: `El término “${normalized}” fue agregado al diccionario institucional.`,
    term: normalized,
  };
}

module.exports = { revisarTexto, agregarTermino };
