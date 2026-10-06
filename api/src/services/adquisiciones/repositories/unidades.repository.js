// Tabla `unidades_solicitantes` (catálogo administrable; el combo de activas está en catalogos.repository).
async function list(db, searchQuery = "") {
  let query = "SELECT * FROM unidades_solicitantes";
  const params = [];
  if (searchQuery) {
    query += " WHERE nombre ILIKE $1 OR codigo_unidad ILIKE $1";
    params.push(`%${searchQuery}%`);
  }
  query += " ORDER BY nombre ASC";
  const { rows } = await db.query(query, params);
  return rows;
}

async function insert(db, { nombre, codigo_unidad }) {
  const { rows } = await db.query(
    `INSERT INTO unidades_solicitantes (nombre, codigo_unidad)
     VALUES ($1, $2) RETURNING *`,
    [nombre, codigo_unidad]
  );
  return rows[0];
}

/** Actualiza solo los campos recibidos (los demás conservan su valor). */
async function update(db, id, { nombre, codigo_unidad, activo }) {
  const { rows } = await db.query(
    `UPDATE unidades_solicitantes SET
       nombre = COALESCE($1, nombre),
       codigo_unidad = COALESCE($2, codigo_unidad),
       activo = COALESCE($3, activo)
     WHERE id_unidad = $4 RETURNING *`,
    [nombre, codigo_unidad, activo, id]
  );
  return rows[0];
}

/** Abreviatura de la unidad (base del código del expediente), o undefined si no existe. */
async function findCodigoUnidad(db, idUnidad) {
  const { rows } = await db.query("SELECT codigo_unidad FROM unidades_solicitantes WHERE id_unidad = $1", [idUnidad]);
  return rows[0]?.codigo_unidad;
}

module.exports = { list, insert, update, findCodigoUnidad };
