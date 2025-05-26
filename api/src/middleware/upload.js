const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const UPLOAD_DIR = path.join(__dirname, "../../uploads"); // Directorio de uploads relativo a este archivo

// Asegurarse de que el directorio de uploads existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Validar tipos de archivo (ejemplo: imágenes, pdf, documentos, audio, video)
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "video/mp4",
    "video/webm",
    "video/ogg",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 25, // Límite de 25MB por archivo (ajustar según necesidad)
  },
  fileFilter: fileFilter,
});

// Middleware para manejar múltiples archivos bajo el campo 'archivosAdjuntos'
// Se espera que el cliente envíe los archivos con el nombre de campo 'archivosAdjuntos'
const uploadMiddleware = upload.array("archivosAdjuntos", 10); // Máximo 10 archivos

module.exports = (req, res, next) => {
  uploadMiddleware(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Un error de Multer ocurrió durante la subida.
      return res
        .status(400)
        .json({ message: "Error de Multer: " + err.message });
    } else if (err) {
      // Un error desconocido ocurrió.
      return res.status(400).json({ message: err.message });
    }
    // Todo salió bien, continuar.
    next();
  });
};
