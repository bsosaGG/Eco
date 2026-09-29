const db = require("../config/db-core-humanis");

/**
 * Registra una acción en la pista de auditoría inmutable en PostgreSQL (auditoria_logs)
 */
async function registrarAuditoria({
  usuarioId = null,
  usuarioUsername = "sistema",
  accion,
  tablaAfectada,
  registroId = null,
  valoresAnteriores = null,
  valoresNuevos = null,
  ipAddress = "127.0.0.1",
  userAgent = "Mozilla/5.0",
  detalles = "",
}) {
  const isUuid = (val) => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const safeRegistroId = isUuid(registroId) ? registroId : null;
  const safeUsuarioId = isUuid(usuarioId) ? usuarioId : null;

  const fullDetalles = `[Usuario: ${usuarioUsername}] ${detalles}`;

  try {
    const queryText = `
      INSERT INTO auditoria_logs 
      (usuario_id, accion, tabla_afectada, registro_id, valores_anteriores, valores_nuevos, ip_address, user_agent, detalles)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [
      safeUsuarioId,
      accion,
      tablaAfectada,
      safeRegistroId,
      valoresAnteriores ? JSON.stringify(valoresAnteriores) : null,
      valoresNuevos ? JSON.stringify(valoresNuevos) : null,
      ipAddress,
      userAgent,
      fullDetalles,
    ];

    const res = await db.query(queryText, params);
    return res.rows[0];
  } catch (err) {
    console.error("Error al registrar auditoría en PostgreSQL:", err.message);
    return null;
  }
}

module.exports = {
  registrarAuditoria,
};
