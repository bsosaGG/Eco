// Subida del Brief (PDF o DOCX, máx. 25 MB) del módulo Plan de Medios.
// El archivo se recibe en memoria: el servicio lo valida, extrae sus campos y recién
// entonces lo guarda en la carpeta del expediente (así no quedan archivos huérfanos).
const multer = require("multer");
const config = require("../config/plan-medios.config");
const { ValidationError } = require("../services/plan-medios/errors");

const uploadBrief = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.brief.maxFileSizeBytes, files: 1 },
}).single("brief");

module.exports = (req, res, next) => {
  uploadBrief(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return next(new ValidationError("Brief: El archivo supera el límite de 25 MB."));
    }
    return next(error);
  });
};
