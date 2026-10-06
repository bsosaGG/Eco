// Tabla `cotizaciones` (CU-02): ofertas de los proveedores para un expediente.
async function insert(db, { idExpediente, idProveedor, montoOfertado, plazoEntregaDias, garantiaMeses, cumpleEspecificaciones, archivoPdfUrl, usuarioId }) {
  await db.query(
    `INSERT INTO cotizaciones
       (id_expediente, id_proveedor, monto_ofertado, plazo_entrega_dias, garantia_meses,
        cumple_especificaciones, archivo_pdf_url, registrado_por_usuario_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      idExpediente,
      idProveedor,
      montoOfertado,
      plazoEntregaDias || null,
      garantiaMeses || null,
      cumpleEspecificaciones ?? null,
      archivoPdfUrl || null,
      usuarioId,
    ]
  );
}

/** La cotización con la razón social de su proveedor, si pertenece a ese expediente. */
async function findDeExpediente(db, idCotizacion, idExpediente) {
  const { rows } = await db.query(
    `SELECT c.id_cotizacion, c.monto_ofertado, p.razon_social
     FROM cotizaciones c
     JOIN proveedores p ON c.id_proveedor = p.id_proveedor
     WHERE c.id_cotizacion = $1 AND c.id_expediente = $2`,
    [idCotizacion, idExpediente]
  );
  return rows[0];
}

/** Solo una cotización puede quedar adjudicada por expediente: se limpian y se marca la elegida. */
async function adjudicar(db, idExpediente, idCotizacion) {
  await db.query("UPDATE cotizaciones SET es_adjudicada = FALSE WHERE id_expediente = $1", [idExpediente]);
  await db.query("UPDATE cotizaciones SET es_adjudicada = TRUE WHERE id_cotizacion = $1", [idCotizacion]);
}

/** Id del proveedor de la cotización adjudicada, o undefined si todavía no hay adjudicación. */
async function findProveedorAdjudicado(db, idExpediente) {
  const { rows } = await db.query(
    "SELECT id_proveedor FROM cotizaciones WHERE id_expediente = $1 AND es_adjudicada = TRUE",
    [idExpediente]
  );
  return rows[0]?.id_proveedor;
}

module.exports = { insert, findDeExpediente, adjudicar, findProveedorAdjudicado };
