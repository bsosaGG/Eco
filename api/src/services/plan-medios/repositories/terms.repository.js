// Tabla `institutional_terms`: términos que el corrector ortográfico no debe marcar.
const { v4: uuidv4 } = require("uuid");

async function listTerms(db) {
  const { rows } = await db.query("SELECT term FROM institutional_terms ORDER BY normalized_term");
  return rows.map((row) => row.term);
}

/** Agrega el término si no existe (la comparación ignora mayúsculas). */
async function addTerm(db, { term, normalizedTerm, createdBy }) {
  await db.query(
    `INSERT INTO institutional_terms (id, term, normalized_term, created_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (normalized_term) DO NOTHING`,
    [uuidv4(), term, normalizedTerm, createdBy ?? null]
  );
}

module.exports = { listTerms, addTerm };
