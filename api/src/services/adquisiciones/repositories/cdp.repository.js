// Tabla `cdp` (CU-03): Certificado de Disponibilidad Presupuestaria de un expediente.

async function existsPorExpediente(db, idExpediente) {
  const { rows } = await db.query("SELECT id_cdp FROM cdp WHERE id_expediente = $1", [idExpediente]);
  return rows.length > 0;
}

/** Estado y monto reservado del CDP del expediente; undefined si todavía no tiene. */
async function findPorExpediente(db, idExpediente) {
  const { rows } = await db.query("SELECT id_cdp, estado, monto_reservado FROM cdp WHERE id_expediente = $1", [
    idExpediente,
  ]);
  return rows[0];
}

/** Monto reservado del CDP del expediente; undefined si todavía no tiene. */
async function findMontoReservadoPorExpediente(db, idExpediente) {
  const { rows } = await db.query("SELECT monto_reservado FROM cdp WHERE id_expediente = $1", [idExpediente]);
  return rows[0]?.monto_reservado;
}

/** El CDP con bloqueo de fila (se va a modificar en esta transacción); undefined si no existe. */
async function findPorIdBloqueado(db, idCdp) {
  const { rows } = await db.query(
    "SELECT id_expediente, id_partida, monto_reservado, estado, numero_cdp FROM cdp WHERE id_cdp = $1 FOR UPDATE",
    [idCdp]
  );
  return rows[0];
}

async function insertBorrador(db, { idExpediente, idPartida, numeroCdp, montoReservado, usuarioId, estado }) {
  await db.query(
    `INSERT INTO cdp
       (id_expediente, id_partida, numero_cdp, monto_reservado, estado,
        elaborado_por_usuario_id, fecha_elaboracion)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
    [idExpediente, idPartida, numeroCdp, montoReservado, estado, usuarioId]
  );
}

async function marcarAprobadoTecnicamente(db, { idCdp, usuarioId, firmaHash, estado }) {
  await db.query(
    `UPDATE cdp SET
       estado = $3,
       aprobado_presupuesto_usuario_id = $1,
       fecha_aprobacion_presupuesto = CURRENT_TIMESTAMP,
       firma_hash_presupuesto = $2
     WHERE id_cdp = $4`,
    [usuarioId, firmaHash, estado, idCdp]
  );
}

async function marcarAprobado(db, { idCdp, usuarioId, firmaHash, estado }) {
  await db.query(
    `UPDATE cdp SET
       estado = $3,
       vobo_udaf_usuario_id = $1,
       fecha_vobo_udaf = CURRENT_TIMESTAMP,
       firma_hash_udaf = $2
     WHERE id_cdp = $4`,
    [usuarioId, firmaHash, estado, idCdp]
  );
}

module.exports = {
  existsPorExpediente,
  findPorExpediente,
  findMontoReservadoPorExpediente,
  findPorIdBloqueado,
  insertBorrador,
  marcarAprobadoTecnicamente,
  marcarAprobado,
};
