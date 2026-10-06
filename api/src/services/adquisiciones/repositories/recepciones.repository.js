// Tablas `recepciones` (CU-05) y `documentos_soporte` (CU-06).

async function existsPorOrdenCompra(db, idOrdenCompra) {
  const { rows } = await db.query("SELECT id_recepcion FROM recepciones WHERE id_orden_compra = $1", [idOrdenCompra]);
  return rows.length > 0;
}

async function insert(db, { idOrdenCompra, recibidoConforme, dictamenFisico, tecnicoReceptorUsuarioId, observaciones }) {
  await db.query(
    `INSERT INTO recepciones
       (id_orden_compra, fecha_hora_recepcion, recibido_conforme, dictamen_fisico,
        tecnico_receptor_usuario_id, observaciones)
     VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5)`,
    [idOrdenCompra, recibidoConforme, dictamenFisico || null, tecnicoReceptorUsuarioId, observaciones || null]
  );
}

/** Si la recepción del expediente está conforme; undefined si todavía no se registró. */
async function findConformidadPorExpediente(db, idExpediente) {
  const { rows } = await db.query(
    `SELECT rc.recibido_conforme
     FROM recepciones rc
     JOIN ordenes_compra oc ON rc.id_orden_compra = oc.id_orden_compra
     WHERE oc.id_expediente = $1`,
    [idExpediente]
  );
  return rows[0]?.recibido_conforme;
}

/** Tabla genérica de documentos de soporte (factura, Hoja 1H, egreso de almacén, ...). Devuelve el id. */
async function insertDocumentoSoporte(db, { idExpediente, tipoDocumento, numeroDocumento, archivoUrl, fechaDocumento, usuarioId }) {
  const { rows } = await db.query(
    `INSERT INTO documentos_soporte
       (id_expediente, tipo_documento, numero_documento, archivo_url, fecha_documento, subido_por_usuario_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id_documento`,
    [idExpediente, tipoDocumento, numeroDocumento || null, archivoUrl, fechaDocumento || null, usuarioId]
  );
  return rows[0].id_documento;
}

async function contarDocumentosSoporte(db, idExpediente) {
  const { rows } = await db.query("SELECT COUNT(*)::int AS total FROM documentos_soporte WHERE id_expediente = $1", [
    idExpediente,
  ]);
  return rows[0].total;
}

module.exports = { existsPorOrdenCompra, insert, findConformidadPorExpediente, insertDocumentoSoporte, contarDocumentosSoporte };
