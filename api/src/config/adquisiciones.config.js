// api/src/config/adquisiciones.config.js
// Configuración del módulo Adquisiciones (SICOMPRAS): archivos, límites y servicios externos.
const path = require("path");

const SRC_DIR = path.join(__dirname, "..");

// Los archivos mutables viven bajo uploads/, que docker-compose monta como volumen persistente
// (./uploads_scspr). `archivo_url` se guarda relativo a uploads/ ("adquisiciones/documentos-soporte/<archivo>").
const STORAGE_ROOT = path.resolve(
  process.env.ADQUISICIONES_STORAGE_PATH || path.join(SRC_DIR, "..", "uploads", "adquisiciones")
);

module.exports = {
  storage: {
    root: STORAGE_ROOT,
    documentosSoporteDir: path.join(STORAGE_ROOT, "documentos-soporte"),
    // Prefijo con el que se guarda `archivo_url` en la BD (relativo a uploads/).
    documentosSoporteUrlPrefix: "adquisiciones/documentos-soporte",
  },
  documentosSoporte: {
    maxFileSizeBytes: 15 * 1024 * 1024, // 15 MB
    tipos: ["FACTURA", "HOJA_1H_INGRESO", "EGRESO_ALMACEN", "CERTIFICADO_SATISFACCION", "OTRO"],
  },
  templates: {
    // Plantilla HTML de la Solicitud de Compra (FOR-DG-UA-00-01).
    codigoFormulario: "FOR-DG-UA-00-01",
  },
  chromium: {
    // Binario del paquete "chromium" de Alpine (ver Dockerfile). Se prueba en este orden.
    candidates: [
      process.env.CHROMIUM_PATH,
      process.env.PUPPETEER_EXECUTABLE_PATH,
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/lib/chromium/chromium",
    ].filter(Boolean),
  },
  insumosMaga: {
    url: "https://apps.maga.gob.gt/compras/Insumos",
    timeoutMs: 8000,
    itemsPerPage: 100,
    minQueryLength: 2,
  },
};
