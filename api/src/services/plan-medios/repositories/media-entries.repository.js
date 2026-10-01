// Tabla `expediente_media_entries`: una fila por medio seleccionado en la Etapa 3.
const { v4: uuidv4 } = require("uuid");
const { isPlainObject } = require("../domain/text-utils");

/**
 * Reemplaza todos los medios de un expediente por los del resumen.
 * @param {Map<number,string>} aliasToUuid equivalencia alias numérico -> UUID del catálogo
 */
async function replaceForExpediente(db, expedienteId, summary, aliasToUuid) {
  await db.query("DELETE FROM expediente_media_entries WHERE expediente_id = $1", [expedienteId]);

  const entries = Array.isArray(summary.media_entries) ? summary.media_entries : [];
  let position = 0;
  for (const payload of entries) {
    // La posición sigue el índice original de la lista (también si hay elementos inválidos).
    const currentPosition = position++;
    if (!isPlainObject(payload)) continue;
    const alias = payload.catalog_media_id;
    await db.query(
      `INSERT INTO expediente_media_entries
         (id, expediente_id, position, profile, category, catalog_media_id, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        uuidv4(),
        expedienteId,
        currentPosition,
        payload.profile ?? null,
        payload.category ?? null,
        Number.isInteger(alias) ? aliasToUuid.get(alias) || null : null,
        JSON.stringify(payload),
      ]
    );
  }
}

async function findByPosition(db, expedienteId, position) {
  const { rows } = await db.query(
    "SELECT id FROM expediente_media_entries WHERE expediente_id = $1 AND position = $2",
    [expedienteId, position]
  );
  return rows[0] || null;
}

module.exports = { replaceForExpediente, findByPosition };
