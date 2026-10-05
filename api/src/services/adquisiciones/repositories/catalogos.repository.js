// Catálogos de solo lectura: unidades activas (combo), renglones, partidas y estados del expediente.
async function listUnidadesActivas(db) {
  const { rows } = await db.query(
    "SELECT id_unidad AS value, nombre AS text, codigo_unidad FROM unidades_solicitantes WHERE activo = TRUE ORDER BY nombre"
  );
  return rows;
}

async function listRenglones(db) {
  const { rows } = await db.query(
    "SELECT id_renglon AS value, nombre AS text, numero_renglon FROM renglones_presupuestarios WHERE activo = TRUE ORDER BY numero_renglon"
  );
  return rows;
}

async function listPartidas(db) {
  const { rows } = await db.query(
    `SELECT p.id_partida AS value,
            p.programa || '-' || p.actividad || ' / ' || r.nombre || ' (' || p.fuente_financiamiento || ')' AS text,
            p.monto_disponible
     FROM partidas_presupuestarias p
     JOIN renglones_presupuestarios r ON p.id_renglon = r.id_renglon
     ORDER BY p.ejercicio_fiscal DESC, p.programa, p.actividad`
  );
  return rows;
}

async function listEstados(db) {
  const { rows } = await db.query(
    "SELECT id_estado AS value, nombre AS text, etapa, color, es_final FROM estados_expediente ORDER BY id_estado"
  );
  return rows;
}

/** Id del estado por su nombre, o undefined si el catálogo no lo tiene. */
async function findEstadoIdPorNombre(db, nombre) {
  const { rows } = await db.query("SELECT id_estado FROM estados_expediente WHERE nombre = $1", [nombre]);
  return rows[0]?.id_estado;
}

/** Nombre del estado por su id, o undefined si no existe. */
async function findEstadoNombrePorId(db, idEstado) {
  const { rows } = await db.query("SELECT nombre FROM estados_expediente WHERE id_estado = $1", [idEstado]);
  return rows[0]?.nombre;
}

module.exports = {
  listUnidadesActivas,
  listRenglones,
  listPartidas,
  listEstados,
  findEstadoIdPorNombre,
  findEstadoNombrePorId,
};
