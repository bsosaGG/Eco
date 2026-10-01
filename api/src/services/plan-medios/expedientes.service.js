// Casos de uso sobre expedientes: crear (subir Brief), listar, consultar y guardar
// el formulario (Etapas 1 a 3). Orquesta repositorios, dominio y archivos; no
// conoce HTTP.
const crypto = require("crypto");
const path = require("path");
const config = require("../../config/plan-medios.config");
const { planMediosDb } = require("../../config/db-plan-medios");
const expedientes = require("./repositories/expedientes.repository");
const mediaEntries = require("./repositories/media-entries.repository");
const catalog = require("./repositories/catalog.repository");
const purchaseRequests = require("./repositories/purchase-requests.repository");
const storage = require("./storage");
const { saveExpediente } = require("./expediente-persistence");
const { extractSummaryFields, buildEmptySummary } = require("./documents/brief-extractor");
const { applySummaryUpdate } = require("./domain/summary-update");
const { normalizeSummaryJustifications } = require("./domain/selection-justification");
const { ValidationError, NotFoundError } = require("./errors");
const { isPlainObject } = require("./domain/text-utils");

const MAX_LIST_LIMIT = 500;

const safeLimit = (limit) => Math.max(1, Math.min(parseInt(limit, 10) || 100, MAX_LIST_LIMIT));

/** Identificador legible: AAAAMMDD-xxxxxxxx (fecha UTC + 8 hex aleatorios). */
function newExpedienteId(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `${date}-${crypto.randomBytes(4).toString("hex")}`;
}

function validateBriefFile(file) {
  if (!file || !file.originalname) throw new ValidationError("Brief: El archivo no tiene nombre.");
  const extension = path.extname(file.originalname).toLowerCase();
  if (!config.brief.allowedExtensions.includes(extension)) {
    throw new ValidationError(
      `Brief: Formato no permitido. Use: ${[...config.brief.allowedExtensions].sort().join(", ")}`
    );
  }
  if (file.size > config.brief.maxFileSizeBytes) {
    throw new ValidationError("Brief: El archivo supera el límite de 25 MB.");
  }
  return extension;
}

/** Carga un expediente con resumen o falla con 404. */
async function loadExpediente(db, id) {
  storage.assertValidExpedienteId(id);
  const row = await expedientes.findById(db, id);
  if (!row) throw new NotFoundError(`No existe el expediente: ${id}`);
  if (!isPlainObject(row.summary_payload)) throw new NotFoundError("El expediente no contiene campos de resumen.");
  return row;
}

/** Vista del expediente para el formulario. */
async function toDetail(db, row) {
  const summary = normalizeSummaryJustifications(structuredClone(row.summary_payload));
  return {
    expediente_id: row.id,
    status: row.status,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
    original_filename: row.original_filename,
    summary_fields: summary.fields || {},
    media_entries: summary.media_entries || [],
    media_recommendations: summary.media_recommendations || [],
    media_strategy: summary.media_strategy || {},
    campaign_pieces: summary.campaign_pieces || [],
    campaign_priorities: summary.campaign_priorities || {},
    word_generated: await storage.fileExists(storage.planMediosPath(row.id)),
    purchase_requests: await purchaseRequests.listByExpediente(db, row.id),
  };
}

/**
 * Crea un expediente a partir del Brief subido. Si es un DOCX estructurado extrae
 * los campos automáticamente; en otro caso (PDF) deja el formulario en blanco para
 * llenado manual.
 */
async function crearExpediente({ file }) {
  const extension = validateBriefFile(file);
  const expedienteId = newExpedienteId();

  let summary;
  let extractionStatus;
  let status;
  if (extension === ".docx") {
    summary = await extractSummaryFields(file.buffer, file.originalname);
    summary.media_entries = [];
    extractionStatus = "completed";
    status = "resumen_extraido";
  } else {
    summary = buildEmptySummary(file.originalname);
    extractionStatus = "pending_ai_extraction";
    status = "documentos_cargados";
  }

  const stored = await storage.saveBrief(expedienteId, extension, file.buffer);
  try {
    await planMediosDb.transaction(async (tx) => {
      await expedientes.insert(tx, {
        id: expedienteId,
        status,
        original_filename: file.originalname,
        stored_path: `expedientes/${expedienteId}/${stored.stored_name}`,
        original_size_bytes: stored.size_bytes,
        extraction_status: extractionStatus,
        summary_payload: summary,
      });
      const { aliasToUuid } = await catalog.aliasMaps(tx);
      await mediaEntries.replaceForExpediente(tx, expedienteId, summary, aliasToUuid);
    });
  } catch (error) {
    await storage.removeExpedienteDir(expedienteId);
    throw error;
  }

  return { expediente_id: expedienteId, status, extraction_status: extractionStatus };
}

async function listarExpedientes({ query, limit }) {
  return expedientes.list(planMediosDb, { limit: safeLimit(limit || 200), query });
}

async function obtenerExpediente(id) {
  const row = await loadExpediente(planMediosDb, id);
  return toDetail(planMediosDb, row);
}

/**
 * Guarda los cambios del formulario. `input.version` es la versión que el cliente
 * leyó: si otra persona guardó mientras tanto, se rechaza con 409.
 */
async function guardarResumen({ id, input, actor }) {
  const expectedVersion = input?.version === undefined ? undefined : parseInt(input.version, 10);
  if (input?.version !== undefined && !Number.isInteger(expectedVersion)) {
    throw new ValidationError("La versión del expediente debe ser un número entero.");
  }

  return planMediosDb.transaction(async (tx) => {
    const current = await loadExpediente(tx, id);
    const { summary, planningAction } = applySummaryUpdate({ summary: current.summary_payload, input });

    const status = planningAction === "draft" ? "borrador" : "resumen_revisado";
    const version = await saveExpediente(tx, {
      current,
      summary,
      status,
      extractionStatus: "reviewed",
      expectedVersion,
      actor,
    });

    const saved = await expedientes.findById(tx, id);
    return { ...(await toDetail(tx, saved)), version };
  });
}

module.exports = {
  crearExpediente,
  listarExpedientes,
  obtenerExpediente,
  guardarResumen,
  loadExpediente,
  newExpedienteId,
  safeLimit,
};
