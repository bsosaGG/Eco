// Casos de uso de la Etapa 4: preparar y generar Solicitudes de Compra (Excel) y
// redactar un borrador de justificación con IA local.
const fs = require("fs/promises");
const config = require("../../config/plan-medios.config");
const { planMediosDb } = require("../../config/db-plan-medios");
const mediaEntries = require("./repositories/media-entries.repository");
const purchaseRequests = require("./repositories/purchase-requests.repository");
const storage = require("./storage");
const { loadExpediente } = require("./expedientes.service");
const { buildPurchaseRequest, toPublicRequest } = require("./domain/purchase-request");
const { generatePurchaseRequestXlsx } = require("./documents/purchase-xlsx");
const { generateJustificationDraft } = require("./integrations/ollama.client");
const { ValidationError, DocumentError } = require("./errors");
const { isPlainObject } = require("./domain/text-utils");

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** El índice de medio llega como texto en la URL; debe ser un entero >= 0. */
function parseMediaIndex(raw) {
  const text = String(raw).trim();
  if (!/^\d+$/.test(text)) throw new ValidationError("El índice del medio seleccionado no es válido.");
  return parseInt(text, 10);
}

const formToRequestOptions = (form = {}) => ({
  requestNumber: form.request_number,
  requestDate: form.request_date,
  budgetLine: form.budget_line,
  supplyCode: form.supply_code ?? "N/A",
  quantity: form.quantity ?? "1",
  unit: form.unit ?? "SERVICIO",
  justificationOverride: form.justification,
});

/** Prepara la solicitud sin generar el Excel (vista previa de descripción y características). */
async function prepararSolicitud({ id, index, form }) {
  const mediaEntryIndex = parseMediaIndex(index);
  const row = await loadExpediente(planMediosDb, id);
  const request = buildPurchaseRequest({
    expedienteId: id,
    summary: row.summary_payload,
    mediaEntryIndex,
    ...formToRequestOptions(form),
  });
  return toPublicRequest(request);
}

/** Genera el Excel de la solicitud y la registra en la base de datos. */
async function generarSolicitud({ id, index, form }) {
  const mediaEntryIndex = parseMediaIndex(index);
  const row = await loadExpediente(planMediosDb, id);
  const request = buildPurchaseRequest({
    expedienteId: id,
    summary: row.summary_payload,
    mediaEntryIndex,
    ...formToRequestOptions(form),
  });

  let template;
  try {
    template = await fs.readFile(config.templates.purchaseRequestXlsx);
  } catch (error) {
    throw new DocumentError("No existe la plantilla de Solicitud de Compra.");
  }
  const buffer = await generatePurchaseRequestXlsx(template, request);

  const filename = storage.purchaseRequestFilename(mediaEntryIndex);
  const file = await storage.writeAtomically(storage.purchaseRequestPath(id, mediaEntryIndex), buffer);
  try {
    await planMediosDb.transaction(async (tx) => {
      const entry = await mediaEntries.findByPosition(tx, id, mediaEntryIndex);
      await purchaseRequests.upsertForMedia(tx, {
        expedienteId: id,
        position: mediaEntryIndex,
        mediaEntryId: entry ? entry.id : null,
        request: toPublicRequest(request),
        generatedFilename: filename,
      });
    });
    await file.commit();
  } catch (error) {
    await file.discard();
    throw error;
  }

  return { buffer, filename: `solicitud_compra_${id}_${mediaEntryIndex + 1}.xlsx`, contentType: XLSX_MIME };
}

async function descargarSolicitud({ id, index }) {
  const mediaEntryIndex = parseMediaIndex(index);
  await loadExpediente(planMediosDb, id);
  const buffer = await storage.readExistingFile(
    storage.purchaseRequestPath(id, mediaEntryIndex),
    "La Solicitud de Compra todavía no ha sido generada."
  );
  return { buffer, filename: `solicitud_compra_${id}_${mediaEntryIndex + 1}.xlsx`, contentType: XLSX_MIME };
}

/** Borrador de justificación con IA local. Nunca se aplica automáticamente. */
async function generarJustificacionIA({ id, index }) {
  const mediaEntryIndex = parseMediaIndex(index);
  const row = await loadExpediente(planMediosDb, id);
  const entries = row.summary_payload.media_entries;
  if (!Array.isArray(entries)) throw new ValidationError("El expediente no contiene una lista válida de medios.");
  if (mediaEntryIndex >= entries.length) {
    throw new ValidationError("El índice del medio seleccionado no existe en el expediente.");
  }
  if (!isPlainObject(entries[mediaEntryIndex])) {
    throw new ValidationError("La selección indicada no tiene una estructura válida.");
  }
  const draft = await generateJustificationDraft({ summary: row.summary_payload, mediaEntry: entries[mediaEntryIndex] });
  return {
    status: "completed",
    message: "Ollama generó un borrador. Revíselo antes de utilizarlo.",
    justification: draft.justification,
    model: draft.model,
    performance: draft.performance,
    validation: draft.validation,
    review_required: true,
  };
}

module.exports = { prepararSolicitud, generarSolicitud, descargarSolicitud, generarJustificacionIA, parseMediaIndex };
