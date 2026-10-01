// Caso de uso: historial inmutable de selecciones de un expediente.
const { planMediosDb } = require("../../config/db-plan-medios");
const audit = require("./repositories/audit.repository");
const expedientes = require("./repositories/expedientes.repository");
const storage = require("./storage");
const { NotFoundError } = require("./errors");
const { safeLimit } = require("./expedientes.service");

async function listarAuditoria({ id, limit = 200 }) {
  storage.assertValidExpedienteId(id);
  if (!(await expedientes.exists(planMediosDb, id))) throw new NotFoundError(`No existe el expediente: ${id}`);
  const events = await audit.listByExpediente(planMediosDb, id, safeLimit(limit));
  const campaign = (events.find((event) => event.campaign) || {}).campaign || "";
  return { expediente_id: id, campaign, count: events.length, events };
}

module.exports = { listarAuditoria };
