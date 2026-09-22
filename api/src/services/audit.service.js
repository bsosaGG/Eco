const db = require("../config/db-core-humanis");
const { mockData } = require("../config/mock-store");

/**
 * Registra una acción en la pista de auditoría inmutable
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
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    usuario: usuarioUsername,
    accion,
    tabla_afectada: tablaAfectada,
    registro_id: registroId,
    valores_anteriores: valoresAnteriores,
    valores_nuevos: valoresNuevos,
    ip_address: ipAddress,
    user_agent: userAgent,
    detalles,
    created_at: new Date().toISOString(),
  };

  try {
    const queryText = `
      INSERT INTO auditoria_logs 
      (usuario_id, accion, tabla_afectada, registro_id, valores_anteriores, valores_nuevos, ip_address, user_agent, detalles)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    const params = [
      usuarioId,
      accion,
      tablaAfectada,
      registroId,
      valoresAnteriores ? JSON.stringify(valoresAnteriores) : null,
      valoresNuevos ? JSON.stringify(valoresNuevos) : null,
      ipAddress,
      userAgent,
      detalles,
    ];

    await db.query(queryText, params);
  } catch (err) {
    // Si la DB falla, resguardamos en memoria
    mockData.auditoria.unshift(entry);
  }

  // Siempre mantener copia en mockData para visualización inmediata
  if (!mockData.auditoria.some((a) => a.id === entry.id)) {
    mockData.auditoria.unshift(entry);
  }

  return entry;
}

module.exports = {
  registrarAuditoria,
};
