// Subida de documentos de soporte (CU-06) del módulo Adquisiciones: un archivo (campo "archivo",
// máx. 15 MB) que se guarda en disco bajo uploads/adquisiciones/documentos-soporte con un nombre
// único. La ruta relativa a uploads/ es la que se guarda como `archivo_url`.
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("../config/adquisiciones.config");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = config.storage.documentosSoporteDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadDocumentoSoporte = multer({
  storage,
  limits: { fileSize: config.documentosSoporte.maxFileSizeBytes },
});

module.exports = uploadDocumentoSoporte.single("archivo");
