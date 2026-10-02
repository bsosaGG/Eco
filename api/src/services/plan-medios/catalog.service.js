// Casos de uso de consulta del catálogo de medios (solo lectura).
const { planMediosDb } = require("../../config/db-plan-medios");
const catalog = require("./repositories/catalog.repository");
const { NotFoundError, ValidationError } = require("./errors");
const { safeLimit } = require("./expedientes.service");

async function estadoCatalogo() {
  return catalog.status(planMediosDb);
}

async function listarMedios({ tipo, limite }) {
  const items = await catalog.listMedia(planMediosDb, { mediaType: tipo, limit: safeLimit(limite || 100) });
  return { status: "completed", count: items.length, items };
}

async function obtenerMedio(id) {
  if (!/^\d+$/.test(String(id))) throw new ValidationError("El identificador del medio debe ser un número entero.");
  const item = await catalog.getMedia(planMediosDb, parseInt(id, 10));
  if (!item) throw new NotFoundError("No existe el medio solicitado.");
  return { status: "completed", item };
}

module.exports = { estadoCatalogo, listarMedios, obtenerMedio };
