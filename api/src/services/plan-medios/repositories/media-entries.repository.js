// Tabla `expediente_media_entries`: una fila por medio seleccionado en la Etapa 3.
const { isPlainObject } = require("../domain/text-utils");

/** Reemplaza todos los medios de un expediente por los del resumen. */
async function replaceForExpediente(db, expedienteId, summary) {
  await db.query("DELETE FROM expediente_media_entries WHERE expediente_id = $1", [expedienteId]);

  const entries = Array.isArray(summary.media_entries) ? summary.media_entries : [];
  for (const [position, payload] of entries.entries()) {
    // La posición sigue el índice de la lista (también si hubiera elementos inválidos).
    if (!isPlainObject(payload)) continue;
    await db.query(
      `INSERT INTO expediente_media_entries (expediente_id, position, profile, category, catalog_media_id, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        expedienteId,
        position,
        payload.profile ?? null,
        payload.category ?? null,
        Number.isInteger(payload.catalog_media_id) ? payload.catalog_media_id : null,
        JSON.stringify(payload),
      ]
    );
  }
}

module.exports = { replaceForExpediente };
