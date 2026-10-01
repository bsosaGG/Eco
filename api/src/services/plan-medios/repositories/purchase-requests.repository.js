// Tabla `purchase_requests`: solicitudes de compra generadas (una por medio, identificada
// por su posición dentro del expediente).

function parseDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  return Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) ? null : String(value);
}

function parseInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  return /^\d+$/.test(text) ? parseInt(text, 10) : null;
}

async function listByExpediente(db, expedienteId) {
  const { rows } = await db.query(
    "SELECT payload, generated_filename FROM purchase_requests WHERE expediente_id = $1 ORDER BY media_position",
    [expedienteId]
  );
  return rows.map((row) => ({ ...row.payload, generated_filename: row.generated_filename }));
}

/** Crea la solicitud del medio en `position` o actualiza la que ya existía. */
async function upsertForMedia(db, { expedienteId, position, request, generatedFilename, actor }) {
  await db.query(
    `INSERT INTO purchase_requests
       (expediente_id, media_position, request_number, request_date, budget_item, code, quantity, unit,
        description, justification, specifications, status, generated_filename, payload,
        created_by_user_id, created_by_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'generated', $12, $13::jsonb, $14, $15)
     ON CONFLICT (expediente_id, media_position) DO UPDATE SET
       request_number = EXCLUDED.request_number, request_date = EXCLUDED.request_date,
       budget_item = EXCLUDED.budget_item, code = EXCLUDED.code, quantity = EXCLUDED.quantity,
       unit = EXCLUDED.unit, description = EXCLUDED.description, justification = EXCLUDED.justification,
       specifications = EXCLUDED.specifications, status = 'generated',
       generated_filename = EXCLUDED.generated_filename, payload = EXCLUDED.payload, updated_at = now()`,
    [
      expedienteId,
      position,
      request.request_number ?? null,
      parseDate(request.request_date),
      request.budget_line ?? null,
      request.supply_code ?? null,
      parseInteger(request.quantity),
      request.unit ?? null,
      request.description ?? null,
      request.justification ?? null,
      request.technical_specifications ?? null,
      generatedFilename,
      JSON.stringify(request),
      actor?.userId ?? null,
      actor?.email ?? null,
    ]
  );
}

module.exports = { listByExpediente, upsertForMedia, parseDate, parseInteger };
