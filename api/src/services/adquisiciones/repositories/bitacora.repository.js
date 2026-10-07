// Tabla `bitacora_trazabilidad`: log inmutable de cada acción sobre un expediente.
// NUNCA exponer UPDATE/DELETE sobre esta tabla; solo se insertan filas.

/**
 * Inserta una fila en la bitácora. Pensada para llamarse con la misma transacción (`tx`) que el
 * cambio que registra.
 */
async function insert(db, { idExpediente, usuarioId, accion, entidadRelacionada, observacion, ipOrigen }) {
  await db.query(
    `INSERT INTO bitacora_trazabilidad
       (id_expediente, usuario_id, accion, entidad_relacionada, observacion, ip_origen)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [idExpediente, usuarioId, accion, entidadRelacionada || null, observacion || null, ipOrigen || null]
  );
}

/** Eventos del expediente, el más reciente primero (sin el nombre de la persona). */
async function listByExpediente(db, idExpediente) {
  const { rows } = await db.query(
    `SELECT id_bitacora, usuario_id, accion, entidad_relacionada, observacion, fecha_hora
     FROM bitacora_trazabilidad
     WHERE id_expediente = $1
     ORDER BY fecha_hora DESC`,
    [idExpediente]
  );
  return rows;
}

module.exports = { insert, listByExpediente };
