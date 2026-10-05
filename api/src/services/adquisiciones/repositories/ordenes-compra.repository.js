// Tabla `ordenes_compra` (CU-04).

async function existsPorExpediente(db, idExpediente) {
  const { rows } = await db.query("SELECT id_orden_compra FROM ordenes_compra WHERE id_expediente = $1", [idExpediente]);
  return rows.length > 0;
}

/** La Orden de Compra; con `lock` toma el bloqueo de fila porque se va a modificar. undefined si no existe. */
async function findPorId(db, idOrdenCompra, { lock = false } = {}) {
  const { rows } = await db.query(
    `SELECT id_orden_compra, id_expediente, estado, numero_oc FROM ordenes_compra WHERE id_orden_compra = $1${
      lock ? " FOR UPDATE" : ""
    }`,
    [idOrdenCompra]
  );
  return rows[0];
}

async function insertBorrador(db, { idExpediente, idCdp, idProveedorAdjudicado, numeroOc, montoTotal, plazoEntrega, lugarEntrega, usuarioId, estado }) {
  await db.query(
    `INSERT INTO ordenes_compra
       (id_expediente, id_cdp, id_proveedor_adjudicado, numero_oc, monto_total,
        plazo_entrega, lugar_entrega, estado, elaborado_por_usuario_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [idExpediente, idCdp, idProveedorAdjudicado, numeroOc, montoTotal, plazoEntrega || null, lugarEntrega || null, estado, usuarioId]
  );
}

async function marcarAprobadaJefatura(db, { idOrdenCompra, usuarioId, firmaHash, estado }) {
  await db.query(
    `UPDATE ordenes_compra SET
       estado = $3,
       aprobado_jefe_usuario_id = $1,
       fecha_aprobacion_jefe = CURRENT_TIMESTAMP,
       firma_hash_jefe = $2
     WHERE id_orden_compra = $4`,
    [usuarioId, firmaHash, estado, idOrdenCompra]
  );
}

/** Autorización de la Directora General: emite la OC y deja constancia de la notificación al proveedor. */
async function marcarEmitida(db, { idOrdenCompra, usuarioId, firmaHash, estado }) {
  await db.query(
    `UPDATE ordenes_compra SET
       estado = $3,
       autorizado_directora_usuario_id = $1,
       fecha_autorizacion_directora = CURRENT_TIMESTAMP,
       firma_hash_directora = $2,
       fecha_notificacion_proveedor = CURRENT_TIMESTAMP
     WHERE id_orden_compra = $4`,
    [usuarioId, firmaHash, estado, idOrdenCompra]
  );
}

module.exports = { existsPorExpediente, findPorId, insertBorrador, marcarAprobadaJefatura, marcarEmitida };
