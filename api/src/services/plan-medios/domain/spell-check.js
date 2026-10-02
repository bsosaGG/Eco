// Reglas del corrector ortográfico: términos institucionales protegidos.
//
// Un término aprobado (p. ej. "Alta Verapaz" o "Ciudad de Guatemala") no debe ser
// señalado como error aunque LanguageTool lo marque. Se considera protegida una
// sugerencia cuyo fragmento se solape con cualquier aparición de un término.
const MAX_TERM_LENGTH = 150;

/** Espacios normalizados (incluye el espacio duro). */
function normalizeTerm(term) {
  return String(term ?? "")
    .replace(/ /g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function isSuggestionProtected(fullText, offset, length, terms) {
  if (offset < 0 || length <= 0) return false;
  const suggestionEnd = offset + length;
  for (const term of terms) {
    if (!term) continue;
    for (const match of fullText.matchAll(new RegExp(escapeRegExp(term), "gi"))) {
      const start = match.index;
      const end = start + match[0].length;
      if (offset < end && suggestionEnd > start) return true;
    }
  }
  return false;
}

/** Quita las sugerencias protegidas, renumera y limita a 5 reemplazos por sugerencia. */
function filterProtectedSuggestions(fullText, suggestions, terms) {
  return suggestions
    .filter((suggestion) => !isSuggestionProtected(fullText, suggestion.offset, suggestion.length, terms))
    .map((suggestion, id) => ({ id, ...suggestion, replacements: suggestion.replacements.slice(0, 5) }));
}

module.exports = { MAX_TERM_LENGTH, normalizeTerm, isSuggestionProtected, filterProtectedSuggestions };
