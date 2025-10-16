const multer = require("multer");

// Usamos 'memoryStorage' porque necesitamos el buffer del archivo para guardarlo
// en la base de datos (BYTEA) y para procesarlo con 'easy-template-x',
// en lugar de guardarlo en el disco del servidor.
const storage = multer.memoryStorage();

// Filtro para asegurar que solo se suban archivos .docx
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword", // Mimetype más antiguo para compatibilidad
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Rechaza el archivo y pasa un error
    cb(
      new Error(
        "Formato de archivo inválido. Solo se permiten plantillas .docx."
      ),
      false
    );
  }
};

// Configuramos multer con el almacenamiento en memoria y el filtro de archivos.
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // Límite de 5MB por plantilla
  },
});

// Exportamos el middleware ya configurado para procesar un solo archivo
// que viene en el campo del formulario llamado 'plantilla'.
module.exports = upload.single("plantilla");
