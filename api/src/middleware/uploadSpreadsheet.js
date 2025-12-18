const multer = require('multer');

// Usamos 'memoryStorage' porque procesaremos el archivo en memoria, sin guardarlo en disco.
const storage = multer.memoryStorage();

// Filtro para asegurar que solo se suban los formatos de hoja de cálculo permitidos.
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.oasis.opendocument.spreadsheet' // .ods
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo inválido. Solo se permiten hojas de cálculo .xlsx o .ods.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 50 // Límite de 50MB por hoja de cálculo
    }
});

// Exportamos el middleware listo para procesar un solo archivo del campo 'spreadsheet'.
module.exports = upload.single('spreadsheet');