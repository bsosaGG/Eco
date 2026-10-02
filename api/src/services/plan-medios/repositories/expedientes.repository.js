// Acceso a la tabla `expedientes` (esquema existente de la BD planmedios).
// Todas las funciones reciben `db` (planMediosDb o la transacción `tx`) con `.query`.
const { ConflictError } = require("../errors");

const COLUMNS =
  "id, status, original_filename, stored_path, original_size_bytes, extraction_status, " +
  "summary_payload, version, created_by_user_id, created_by_email, created_by_name, created_at, updated_at";

/** Escapa los comodines de LIKE para que el texto buscado se tome literal. */
const escapeLike = (value) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

function toRecord(row) {
  if (!row) return null;
  return {
    ...row,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

async function findById(db, id) {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM expedientes WHERE id = $1`, [id]);
  return toRecord(rows[0]);
}

async function exists(db, id) {
  const { rows } = await db.query("SELECT 1 FROM expedientes WHERE id = $1", [id]);
  return rows.length > 0;
}

async function insert(db, values) {
  await db.query(
    `INSERT INTO expedientes
       (id, status, original_filename, stored_path, original_size_bytes, extraction_status, summary_payload, version,
        created_by_user_id, created_by_email, created_by_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 1, $8, $9, $10)`,
    [
      values.id,
      values.status,
      values.original_filename ?? null,
      values.stored_path ?? null,
      values.original_size_bytes ?? null,
      values.extraction_status ?? null,
      values.summary_payload === null || values.summary_payload === undefined ? null : JSON.stringify(values.summary_payload),
      values.created_by_user_id ?? null,
      values.created_by_email ?? null,
      values.created_by_name ?? null,
    ]
  );
  return 1;
}

/**
 * Actualiza el expediente solo si su versión sigue siendo `expectedVersion`
 * (bloqueo optimista: evita que dos personas se pisen al guardar).
 * @returns {Promise<number>} la nueva versión
 */
async function updateWithVersion(db, id, expectedVersion, values) {
  const result = await db.query(
    `UPDATE expedientes
        SET status = $3,
            original_filename = $4,
            stored_path = $5,
            original_size_bytes = $6,
            extraction_status = $7,
            summary_payload = $8::jsonb,
            version = version + 1,
            updated_at = now()
      WHERE id = $1 AND version = $2
      RETURNING version`,
    [
      id,
      expectedVersion,
      values.status,
      values.original_filename ?? null,
      values.stored_path ?? null,
      values.original_size_bytes ?? null,
      values.extraction_status ?? null,
      values.summary_payload === null || values.summary_payload === undefined ? null : JSON.stringify(values.summary_payload),
    ]
  );
  if (result.rowCount !== 1) {
    throw new ConflictError(
      `El expediente ${id} fue modificado por otra persona. Recargue la página para ver los cambios más recientes.`
    );
  }
  return result.rows[0].version;
}

/** Listado resumido (sin cargar el resumen completo) con búsqueda opcional. */
async function list(db, { limit, query }) {
  const needle = (query || "").trim();
  const like = `%${escapeLike(needle)}%`;
  const { rows } = await db.query(
    `SELECT id, status, created_at, original_filename, created_by_name, created_by_email,
            COALESCE(summary_payload->'fields'->'1.1'->>'value', '') AS campaign,
            CASE WHEN jsonb_typeof(summary_payload->'media_entries') = 'array'
                 THEN jsonb_array_length(summary_payload->'media_entries') ELSE 0 END AS media_count
       FROM expedientes
      WHERE ($1 = '' OR id ILIKE $2 OR original_filename ILIKE $2 OR status ILIKE $2
             OR (summary_payload->'fields'->'1.1'->>'value') ILIKE $2)
      ORDER BY created_at DESC
      LIMIT $3`,
    [needle, like, limit]
  );
  return rows.map((row) => ({
    expediente_id: row.id,
    status: row.status,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    campaign: row.campaign,
    original_filename: row.original_filename,
    created_by: row.created_by_name || row.created_by_email || null,
    media_count: Number(row.media_count),
  }));
}

module.exports = { findById, exists, insert, updateWithVersion, list, escapeLike };
