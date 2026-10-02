// Regla de justificación de selección (solicitada por la Secretaría el 2026-09-18).
//
// La justificación humana es obligatoria SALVO cuando el medio elegido es la
// posición 1 del ranking del motor de scoring. Cualquier otra posición, o una
// selección manual fuera del catálogo, exige justificación.
//
// Esta regla se aplica en tres capas independientes: en el navegador, al guardar
// el formulario (use case) y en la capa de persistencia al marcar el expediente
// como "plan_medios_generado". Todas usan este mismo módulo.
const { ValidationError } = require("../errors");
const { isPlainObject } = require("./text-utils");

const FALLBACK_TEXT = "No aplica: medio correspondiente a la primera opcion del ranking de scoring.";

function normalizeSelectionJustification(value) {
  return typeof value === "string" ? value : "";
}

function normalizeScoringPosition(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  return parsed > 0 ? parsed : null;
}

/** true salvo que el medio sea la posición 1 del ranking de catálogo. */
function justificationRequired(entry) {
  if (!isPlainObject(entry)) return true;
  const source = String(entry.selection_source || "manual").trim();
  const position = normalizeScoringPosition(entry.scoring_position);
  return !(source === "catalog_scoring" && position === 1);
}

function normalizeSummaryJustifications(summary) {
  const entries = Array.isArray(summary.media_entries) ? summary.media_entries : [];
  for (const entry of entries) {
    if (isPlainObject(entry)) {
      entry.selection_justification = normalizeSelectionJustification(entry.selection_justification);
    }
  }
  return summary;
}

/** Lanza ValidationError si algún medio exige justificación y no la tiene. */
function validateSelectionJustifications(entries) {
  const missing = [];
  (entries || []).forEach((entry, index) => {
    if (!isPlainObject(entry)) return;
    if (!justificationRequired(entry)) return;
    if (!normalizeSelectionJustification(entry.selection_justification).trim()) {
      missing.push(`Medio ${index + 1}: ${entry.medium || ""}`);
    }
  });
  if (missing.length) {
    throw new ValidationError(
      "Debes justificar la seleccion de este medio antes de continuar: " + missing.join("; ")
    );
  }
}

module.exports = {
  FALLBACK_TEXT,
  normalizeSelectionJustification,
  normalizeScoringPosition,
  justificationRequired,
  normalizeSummaryJustifications,
  validateSelectionJustifications,
};
