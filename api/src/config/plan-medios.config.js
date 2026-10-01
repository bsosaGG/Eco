// api/src/config/plan-medios.config.js
// Configuración del módulo Plan de Medios (rutas de archivos, límites, servicios externos).
const path = require("path");

const SRC_DIR = path.join(__dirname, "..");

// Los archivos mutables (briefs y documentos generados) viven bajo uploads/, que
// docker-compose monta como volumen persistente (./uploads_scspr).
const STORAGE_ROOT = path.resolve(
  process.env.PLAN_MEDIOS_STORAGE_PATH || path.join(SRC_DIR, "..", "uploads", "plan-medios")
);

module.exports = {
  storage: {
    root: STORAGE_ROOT,
    expedientesDir: path.join(STORAGE_ROOT, "expedientes"),
  },
  templates: {
    planMediosDocx: path.join(SRC_DIR, "templates", "plan-medios", "plantilla_plan_de_medios.docx"),
    purchaseRequestXlsx: path.join(SRC_DIR, "templates", "plan-medios", "plantilla_solicitud_compra.xlsx"),
  },
  brief: {
    allowedExtensions: [".pdf", ".docx"],
    maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB por archivo
    maxMediaEntries: 50,
  },
  languageTool: {
    baseUrl: (process.env.PLAN_MEDIOS_LANGUAGE_TOOL_URL || "http://languagetool:8010").replace(/\/+$/, ""),
    timeoutMs: 15000,
  },
  ollama: {
    apiUrl: (process.env.OLLAMA_API_URL || "http://127.0.0.1:11434/api/generate").trim(),
    model: (process.env.OLLAMA_JUSTIFICATION_MODEL || "gemma3:1b").trim(),
    timeoutSeconds: Math.max(30, parseInt(process.env.OLLAMA_JUSTIFICATION_TIMEOUT_SECONDS, 10) || 240),
  },
  timezone: "America/Guatemala",
};
