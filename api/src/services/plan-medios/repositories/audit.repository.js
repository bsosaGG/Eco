// Tabla `selection_audit_events`: registro inmutable de cada selección, remoción o
// cambio de un medio. Solo se insertan filas; la base de datos rechaza UPDATE, DELETE
// y TRUNCATE (ver triggers en database/init_plan_medios.sql).
// El orden lo define `id` (crece estrictamente), no la marca de tiempo, porque dos
// eventos de una misma transacción comparten `now()`.

async function insertEvents(db, events) {
  for (const event of events) {
    await db.query(
      `INSERT INTO selection_audit_events
         (event_type, expediente_id, campaign, analyst_user_id, analyst_email, analyst_name,
          medium_name, catalog_media_id, catalog_media_name, provider_legal_name,
          matched_top_recommendation, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)`,
      [
        event.event_type,
        event.expediente_id,
        event.campaign,
        event.analyst_user_id ?? null,
        event.analyst_email ?? null,
        event.analyst_name ?? null,
        event.medium_name,
        event.catalog_media_id ?? null,
        event.catalog_media_name,
        event.provider_legal_name,
        event.matched_top_recommendation,
        JSON.stringify(event.payload),
      ]
    );
  }
}

/** Eventos de un expediente, el más reciente primero. */
async function listByExpediente(db, expedienteId, limit) {
  const { rows } = await db.query(
    `SELECT id, occurred_at, event_type, expediente_id, campaign, analyst_user_id, analyst_email,
            analyst_name, medium_name, catalog_media_id, catalog_media_name, provider_legal_name,
            matched_top_recommendation, payload
       FROM selection_audit_events
      WHERE expediente_id = $1
      ORDER BY id DESC
      LIMIT $2`,
    [expedienteId, limit]
  );
  return rows.map(({ id, payload, occurred_at: occurredAt, ...base }) => ({
    id: Number(id),
    sequence: Number(id), // el id es el orden oficial de los eventos
    ...base,
    occurred_at: occurredAt ? new Date(occurredAt).toISOString() : null,
    ...(payload || {}),
  }));
}

module.exports = { insertEvents, listByExpediente };
