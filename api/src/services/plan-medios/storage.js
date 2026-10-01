// Archivos de cada expediente (brief original y documentos generados).
//
//   <storage.root>/expedientes/<id>/brief.docx|pdf
//   <storage.root>/expedientes/<id>/plan_medios_generado.docx
//   <storage.root>/expedientes/<id>/documentos/solicitud_compra_<n>.xlsx
//
// Los metadatos viven en PostgreSQL; aquí solo hay archivos binarios.
const fs = require("fs/promises");
const path = require("path");
const config = require("../../config/plan-medios.config");
const { ValidationError, NotFoundError } = require("./errors");

const EXPEDIENTE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const PLAN_FILENAME = "plan_medios_generado.docx";

/** Rechaza identificadores que podrían salir del directorio de expedientes. */
function assertValidExpedienteId(id) {
  if (typeof id !== "string" || !EXPEDIENTE_ID_PATTERN.test(id)) {
    throw new ValidationError("Identificador de expediente inválido");
  }
  return id;
}

function expedienteDir(id) {
  return path.join(config.storage.expedientesDir, assertValidExpedienteId(id));
}

const planMediosPath = (id) => path.join(expedienteDir(id), PLAN_FILENAME);
const purchaseRequestFilename = (index) => `solicitud_compra_${index + 1}.xlsx`;
const purchaseRequestPath = (id, index) => path.join(expedienteDir(id), "documentos", purchaseRequestFilename(index));

async function fileExists(filePath) {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch (error) {
    return false;
  }
}

/** Crea la carpeta del expediente (falla si ya existe) y guarda el brief original. */
async function saveBrief(id, extension, buffer) {
  const dir = expedienteDir(id);
  await fs.mkdir(dir, { recursive: true });
  const storedName = `brief${extension}`;
  await fs.writeFile(path.join(dir, storedName), buffer);
  return { stored_name: storedName, size_bytes: buffer.length };
}

async function removeExpedienteDir(id) {
  await fs.rm(expedienteDir(id), { recursive: true, force: true });
}

/**
 * Escribe un archivo de forma atómica: primero a un temporal y luego lo renombra,
 * para no dejar documentos a medias si algo falla.
 */
async function writeAtomically(filePath, buffer) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await fs.writeFile(temporary, buffer);
  return { commit: () => fs.rename(temporary, filePath), discard: () => fs.rm(temporary, { force: true }) };
}

async function readExistingFile(filePath, missingMessage) {
  if (!(await fileExists(filePath))) throw new NotFoundError(missingMessage);
  return fs.readFile(filePath);
}

module.exports = {
  assertValidExpedienteId,
  expedienteDir,
  planMediosPath,
  purchaseRequestPath,
  purchaseRequestFilename,
  fileExists,
  saveBrief,
  removeExpedienteDir,
  writeAtomically,
  readExistingFile,
  PLAN_FILENAME,
};
