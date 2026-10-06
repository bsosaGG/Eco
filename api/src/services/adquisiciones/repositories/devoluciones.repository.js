// Tabla `devoluciones_observaciones` (flujos A1/A2, SCR-10): expediente devuelto con observaciones.

/** Registra la devolución; `plazoSubsanacionDias` (entero o null) define la fecha límite de subsanación. */
async function insert(db, { idExpediente, etapaOrigen, motivo, descripcion, usuarioRevisorId, plazoSubsanacionDias }) {
  await db.query(
    `INSERT INTO devoluciones_observaciones
       (id_expediente, etapa_origen, motivo, descripcion, usuario_revisor_id, plazo_subsanacion_dias, fecha_limite)
     VALUES ($1, $2, $3, $4, $5, $6::int, CURRENT_TIMESTAMP + $6::int * INTERVAL '1 day')`,
    [idExpediente, etapaOrigen, motivo, descripcion || null, usuarioRevisorId, plazoSubsanacionDias]
  );
}

module.exports = { insert };
