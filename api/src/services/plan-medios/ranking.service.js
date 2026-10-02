// Caso de uso: ranking explicable de medios del catálogo para cada recomendación
// del Brief de un expediente.
const { planMediosDb } = require("../../config/db-plan-medios");
const catalog = require("./repositories/catalog.repository");
const { loadExpediente } = require("./expedientes.service");
const { rankAll, METHOD } = require("./domain/scoring/engine");

const MAX_LIMIT_PER_PROFILE = 10;

async function rankearExpediente({ id, limit = 3 }) {
  const row = await loadExpediente(planMediosDb, id);
  const catalogMedia = await catalog.listAllWithProducts(planMediosDb);
  const limitPerProfile = Math.max(1, Math.min(parseInt(limit, 10) || 3, MAX_LIMIT_PER_PROFILE));
  const rankings = rankAll({ summary: row.summary_payload, catalog: catalogMedia, limitPerProfile });
  return { status: "completed", method: METHOD, ranking_count: rankings.length, rankings };
}

module.exports = { rankearExpediente };
