// Tabla `purchase_requests`: solicitudes de compra generadas (una por medio).
const { v4: uuidv4 } = require("uuid");

function parseDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : String(value);
}

function parseInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  return /^[+-]?\d+$/.test(String(value).trim()) ? parseInt(String(value).trim(), 10) : null;
}

async function listByExpediente(db, expedienteId) {
  const { rows } = await db.query(
    "SELECT payload, generated_filename FROM purchase_requests WHERE expediente_id = $1 ORDER BY created_at",
    [expedienteId]
  );
  return rows.map((row) => ({ ...row.payload, generated_filename: row.generated_filename }));
}

/**
 * Crea o actualiza la solicitud del medio en `position`.
 *
 * Los medios de un expediente se reescriben en cada guardado, lo que deja en NULL el
 * enlace `media_entry_id` de solicitudes anteriores; por eso la solicitud previa se
 * busca también por el índice de medio guardado en su payload y se vuelve a enlazar.
 */
async function upsertForMedia(db, { expedienteId, position, mediaEntryId, request, generatedFilename }) {
  const { rows } = await db.query(
    `SELECT id FROM purchase_requests
      WHERE expediente_id = $1
        AND (media_entry_id = $2 OR (media_entry_id IS NULL AND (payload->>'media_entry_index') = $3))
      ORDER BY created_at
      LIMIT 1`,
    [expedienteId, mediaEntryId, String(position)]
  );

  const values = [
    mediaEntryId,
    request.request_number ?? null,
    parseDate(request.request_date),
    request.budget_line ?? null,
    request.supply_code ?? null,
    parseInteger(request.quantity),
    request.unit ?? null,
    request.description ?? null,
    request.justification ?? null,
    request.technical_specifications ?? null,
    "generated",
    generatedFilename,
    JSON.stringify(request),
  ];

  if (rows[0]) {
    await db.query(
      `UPDATE purchase_requests
          SET media_entry_id = $2, request_number = $3, request_date = $4, budget_item = $5, code = $6,
              quantity = $7, unit = $8, description = $9, justification = $10, specifications = $11,
              status = $12, generated_filename = $13, payload = $14::jsonb, updated_at = now()
        WHERE id = $1`,
      [rows[0].id, ...values]
    );
  } else {
    await db.query(
      `INSERT INTO purchase_requests
         (id, expediente_id, media_entry_id, request_number, request_date, budget_item, code, quantity, unit,
          description, justification, specifications, status, generated_filename, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)`,
      [uuidv4(), expedienteId, ...values]
    );
  }
}

module.exports = { listByExpediente, upsertForMedia, parseDate, parseInteger };
