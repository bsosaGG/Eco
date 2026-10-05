// Tabla `usuarios_unidad_solicitante`: firmantes de cada unidad solicitante. Es una tabla propia
// del módulo (ver scripts/adquisiciones/20260928_create_usuarios_unidad_solicitante.sql) y no el
// catálogo de unidades de core-humanis, porque ese catálogo tiene otra organización (8 unidades
// de RRHH que no corresponden a las 16 unidades oficiales de Adquisiciones).

/** Asignaciones activas de la unidad (para el dropdown de la segunda firma). */
async function listActivas(db, idUnidad) {
  const { rows } = await db.query(
    `SELECT id_usuario, cargo
     FROM usuarios_unidad_solicitante
     WHERE id_unidad_solicitante = $1 AND activo = TRUE`,
    [idUnidad]
  );
  return rows;
}

/** Todas las asignaciones de la unidad, activas e inactivas (para poder reactivarlas). */
async function listTodas(db, idUnidad) {
  const { rows } = await db.query(
    `SELECT id_asignacion, id_usuario, cargo, activo
     FROM usuarios_unidad_solicitante
     WHERE id_unidad_solicitante = $1
     ORDER BY id_asignacion`,
    [idUnidad]
  );
  return rows;
}

/** Cargo con que el usuario está asignado y activo como firmante de la unidad; undefined si no lo está. */
async function findCargoActivo(db, idUnidad, idUsuario) {
  const { rows } = await db.query(
    `SELECT cargo
     FROM usuarios_unidad_solicitante
     WHERE id_unidad_solicitante = $1 AND id_usuario = $2 AND activo = TRUE`,
    [idUnidad, idUsuario]
  );
  return rows[0]?.cargo;
}

/** Crea la asignación o, si ya existía, actualiza el cargo y la reactiva. */
async function upsert(db, { idUsuario, idUnidad, cargo }) {
  const { rows } = await db.query(
    `INSERT INTO usuarios_unidad_solicitante (id_usuario, id_unidad_solicitante, cargo, activo)
     VALUES ($1, $2, $3, TRUE)
     ON CONFLICT (id_usuario, id_unidad_solicitante)
     DO UPDATE SET cargo = EXCLUDED.cargo, activo = TRUE
     RETURNING id_asignacion, id_usuario, cargo, activo`,
    [idUsuario, idUnidad, cargo || null]
  );
  return rows[0];
}

/** Desactiva (no borra) la asignación. Devuelve false si no existía. */
async function desactivar(db, idUnidad, idUsuario) {
  const { rows } = await db.query(
    `UPDATE usuarios_unidad_solicitante
     SET activo = FALSE
     WHERE id_unidad_solicitante = $1 AND id_usuario = $2
     RETURNING id_asignacion`,
    [idUnidad, idUsuario]
  );
  return rows.length > 0;
}

module.exports = { listActivas, listTodas, findCargoActivo, upsert, desactivar };
