// Guardado transaccional de un expediente: una sola operación que actualiza el
// expediente (con bloqueo optimista), reescribe sus medios y registra los eventos
// de auditoría, todo dentro de la misma transacción para que el historial nunca
// quede desincronizado del estado guardado.
const expedientes = require("./repositories/expedientes.repository");
const mediaEntries = require("./repositories/media-entries.repository");
const audit = require("./repositories/audit.repository");
const catalog = require("./repositories/catalog.repository");
const { diffMediaEntries, matchedTopRecommendation, campaignName } = require("./domain/selection-audit");
const { validateSelectionJustifications } = require("./domain/selection-justification");
const { isPlainObject } = require("./domain/text-utils");
const { ValidationError } = require("./errors");

const PLAN_GENERATED_STATUS = "plan_medios_generado";

/** Convierte los cambios detectados en filas de auditoría (resolviendo el nombre legal del proveedor). */
async function buildAuditEvents(db, { expedienteId, status, previousSummary, newSummary, actor }) {
  const changes = diffMediaEntries(previousSummary.media_entries, newSummary.media_entries);
  if (!changes.length) return [];

  const campaign = campaignName(newSummary) || campaignName(previousSummary);
  const priorities = isPlainObject(newSummary.campaign_priorities) ? newSummary.campaign_priorities : {};
  const legalNames = await catalog.legalNamesByIds(
    db,
    changes.map((change) => change.entry.catalog_media_id).filter(Number.isInteger)
  );

  return changes.map(({ event_type: eventType, entry, previous_entry: previous }) => {
    const catalogId = Number.isInteger(entry.catalog_media_id) ? entry.catalog_media_id : null;
    return {
      event_type: eventType,
      expediente_id: expedienteId,
      campaign,
      analyst_user_id: actor?.userId ?? null,
      analyst_email: actor?.email ?? null,
      analyst_name: actor?.name ?? null,
      medium_name: String(entry.medium || ""),
      catalog_media_id: catalogId,
      catalog_media_name: String(entry.catalog_media_name || ""),
      provider_legal_name: catalogId ? legalNames.get(catalogId) || "" : "",
      matched_top_recommendation: matchedTopRecommendation(entry),
      payload: {
        profile: entry.profile || "",
        category: entry.category || "",
        selection_source: entry.selection_source || "",
        scoring_method: entry.scoring_method || "",
        scoring_score: entry.scoring_score ?? null,
        scoring_confidence: entry.scoring_confidence ?? null,
        scoring_compatibility: entry.scoring_compatibility || "",
        scoring_position: entry.scoring_position ?? null,
        selection_justification: entry.selection_justification || "",
        priority_preset: priorities.preset ?? null,
        priority_weights: priorities.weights ?? null,
        plan_status: status,
        previous: previous
          ? {
              catalog_media_id: previous.catalog_media_id ?? null,
              catalog_media_name: previous.catalog_media_name ?? null,
              medium: previous.medium ?? null,
              selection_justification: previous.selection_justification ?? null,
              scoring_score: previous.scoring_score ?? null,
              scoring_position: previous.scoring_position ?? null,
            }
          : null,
      },
    };
  });
}

/**
 * @param {object} db  transacción abierta (tx)
 * @param {object} args
 * @param {object} args.current          fila actual del expediente
 * @param {object} args.summary          nuevo resumen
 * @param {string} args.status           nuevo estado
 * @param {string} args.extractionStatus nuevo estado de extracción
 * @param {number} args.expectedVersion  versión que el cliente leyó
 * @param {object} args.actor            usuario autenticado (para la auditoría)
 * @returns {Promise<number>} nueva versión
 */
async function saveExpediente(db, { current, summary, status, extractionStatus, expectedVersion, actor }) {
  // Tercera capa de la regla de justificación: nunca se marca "Plan de Medios
  // generado" si falta una justificación obligatoria.
  if (status === PLAN_GENERATED_STATUS) validateSelectionJustifications(summary.media_entries);

  // Un medio de catálogo inexistente se rechaza con un mensaje claro (en vez de un error de llave foránea).
  const referenced = (Array.isArray(summary.media_entries) ? summary.media_entries : [])
    .map((entry) => entry && entry.catalog_media_id)
    .filter(Number.isInteger);
  const known = await catalog.existingIds(db, referenced);
  const unknown = referenced.filter((id) => !known.has(id));
  if (unknown.length) throw new ValidationError(`El medio de catálogo seleccionado no existe: ${[...new Set(unknown)].join(", ")}.`);

  const previousSummary = isPlainObject(current.summary_payload) ? current.summary_payload : {};
  const version = await expedientes.updateWithVersion(db, current.id, expectedVersion ?? current.version, {
    status,
    original_filename: current.original_filename,
    stored_path: current.stored_path,
    original_size_bytes: current.original_size_bytes,
    extraction_status: extractionStatus,
    summary_payload: summary,
  });

  await mediaEntries.replaceForExpediente(db, current.id, summary);

  const events = await buildAuditEvents(db, {
    expedienteId: current.id,
    status,
    previousSummary,
    newSummary: summary,
    actor,
  });
  await audit.insertEvents(db, events);
  return version;
}

module.exports = { saveExpediente, buildAuditEvents, PLAN_GENERATED_STATUS };
