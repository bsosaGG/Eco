// Casos de uso del documento Word: generar el Plan de Medios y descargarlo.
const fs = require("fs/promises");
const config = require("../../config/plan-medios.config");
const { planMediosDb } = require("../../config/db-plan-medios");
const storage = require("./storage");
const { loadExpediente } = require("./expedientes.service");
const { saveExpediente, PLAN_GENERATED_STATUS } = require("./expediente-persistence");
const { generatePlanMediosDocx } = require("./documents/plan-medios-docx");
const { DocumentError } = require("./errors");

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function readTemplate(templatePath) {
  try {
    return await fs.readFile(templatePath);
  } catch (error) {
    throw new DocumentError(`No se encontró la plantilla Word: ${templatePath}`);
  }
}

/**
 * Genera el Word y marca el expediente como "plan_medios_generado". El archivo solo
 * queda en su lugar definitivo si el guardado en la base de datos tuvo éxito.
 */
async function generarPlanMedios({ id, actor }) {
  const template = await readTemplate(config.templates.planMediosDocx);

  return planMediosDb.transaction(async (tx) => {
    const current = await loadExpediente(tx, id);
    const buffer = await generatePlanMediosDocx(template, current.summary_payload);

    const file = await storage.writeAtomically(storage.planMediosPath(id), buffer);
    try {
      const version = await saveExpediente(tx, {
        current,
        summary: current.summary_payload,
        status: PLAN_GENERATED_STATUS,
        extractionStatus: current.extraction_status,
        expectedVersion: current.version,
        actor,
      });
      await file.commit();
      return {
        expediente_id: id,
        status: PLAN_GENERATED_STATUS,
        version,
        generated_at: new Date().toISOString(),
        size_bytes: buffer.length,
        source_template: "plantilla_plan_de_medios.docx",
      };
    } catch (error) {
      await file.discard();
      throw error;
    }
  });
}

async function descargarPlanMedios(id) {
  const buffer = await storage.readExistingFile(
    storage.planMediosPath(id),
    "El documento Word todavía no ha sido generado."
  );
  return { buffer, filename: `plan_medios_${id}.docx`, contentType: DOCX_MIME };
}

module.exports = { generarPlanMedios, descargarPlanMedios, DOCX_MIME };
