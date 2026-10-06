// Tabla `partidas_presupuestarias`: techo y saldo disponible de cada partida.

/** Saldo disponible con bloqueo de fila (se valida y luego se descuenta); undefined si no existe. */
async function findMontoDisponibleBloqueado(db, idPartida) {
  const { rows } = await db.query("SELECT monto_disponible FROM partidas_presupuestarias WHERE id_partida = $1 FOR UPDATE", [
    idPartida,
  ]);
  return rows[0]?.monto_disponible;
}

/** Descuenta en firme el monto reservado por un CDP aprobado. */
async function descontar(db, idPartida, monto) {
  await db.query(
    `UPDATE partidas_presupuestarias
     SET monto_disponible = monto_disponible - $1
     WHERE id_partida = $2`,
    [monto, idPartida]
  );
}

module.exports = { findMontoDisponibleBloqueado, descontar };
