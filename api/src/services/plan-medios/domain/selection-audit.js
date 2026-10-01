// Diff puro para el historial de auditoría de selecciones.
//
// Compara dos listas de media_entries (guardado anterior vs nuevo) y devuelve qué
// eventos corresponde registrar (selected / removed / updated). No toca la BD:
// el repositorio de auditoría convierte el resultado en filas dentro de la misma
// transacción que guarda el expediente.
const { isPlainObject } = require("./text-utils");

// Si cambia alguno de estos campos del MISMO medio entre dos guardados, se
// registra un evento "updated".
const TRACKED_FIELDS = [
  "catalog_media_id",
  "medium",
  "selection_justification",
  "scoring_score",
  "scoring_position",
  "scoring_compatibility",
];

/**
 * Identidad estable de un medio entre dos guardados: id de catálogo (si viene del
 * scoring), si no el perfil del Brief, y en el peor caso posición + nombre manual.
 */
function entryIdentity(index, entry) {
  const mediaId = entry.catalog_media_id;
  if (Number.isInteger(mediaId)) return `catalog:${mediaId}`;
  const profile = String(entry.profile || "").trim();
  if (profile) return `profile:${profile}`;
  return `manual:${index}:${String(entry.medium || "")}`;
}

function indexEntries(entries) {
  const indexed = new Map();
  (Array.isArray(entries) ? entries : []).forEach((entry, index) => {
    if (isPlainObject(entry)) indexed.set(entryIdentity(index, entry), entry);
  });
  return indexed;
}

function sameValue(a, b) {
  return (a === undefined ? null : a) === (b === undefined ? null : b);
}

/**
 * @returns {{event_type: "selected"|"removed"|"updated", entry: object, previous_entry: object|null}[]}
 */
function diffMediaEntries(previousEntries, newEntries) {
  const previousById = indexEntries(previousEntries);
  const newById = indexEntries(newEntries);
  const events = [];

  for (const [identity, entry] of previousById) {
    if (!newById.has(identity)) events.push({ event_type: "removed", entry, previous_entry: null });
  }
  for (const [identity, entry] of newById) {
    if (!previousById.has(identity)) events.push({ event_type: "selected", entry, previous_entry: null });
  }
  for (const [identity, entry] of newById) {
    const previous = previousById.get(identity);
    if (!previous) continue;
    if (TRACKED_FIELDS.some((field) => !sameValue(previous[field], entry[field]))) {
      events.push({ event_type: "updated", entry, previous_entry: previous });
    }
  }
  return events;
}

/** true si el medio corresponde a la posición 1 del ranking de scoring. */
function matchedTopRecommendation(entry) {
  return entry.selection_source === "catalog_scoring" && entry.scoring_position === 1;
}

/** Nombre de campaña (campo 1.1 del Brief), o "" si no hay. */
function campaignName(summary) {
  if (!isPlainObject(summary) || !isPlainObject(summary.fields)) return "";
  const field = summary.fields["1.1"];
  return isPlainObject(field) ? String(field.value || "") : "";
}

module.exports = { TRACKED_FIELDS, entryIdentity, diffMediaEntries, matchedTopRecommendation, campaignName };
