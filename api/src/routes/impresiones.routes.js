const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken, checkPermission } = require("../middleware/auth.middleware");
const impresionesController = require("../controllers/impresiones.controller");

// Directorio para guardar plantillas
const UPLOAD_DIR = path.join(__dirname, "../../uploads/impresiones/plantillas");

// Asegurarse de que el directorio existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `plantilla-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
        ext === ".xlsx" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
        cb(null, true);
    } else {
        cb(new Error("Solo se permiten archivos Excel (.xlsx)"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10 MB
});

// Rutas protegidas

// Subir una nueva plantilla
router.post(
    "/plantilla",
    verifyToken,
    checkPermission("CONTEXT:config"),
    upload.single("archivo"),
    impresionesController.uploadTemplate
);

// Eliminar una plantilla de forma lógica
router.delete(
    "/plantilla/:id",
    verifyToken,
    checkPermission("CONTEXT:config"),
    impresionesController.deleteTemplate
);

// Obtener la lista de plantillas disponibles
router.get(
    "/plantillas",
    verifyToken,
    checkPermission("CONTEXT:read"),
    impresionesController.getTemplates
);

// Obtener KPIs del dashboard
router.get(
    "/kpis",
    verifyToken,
    checkPermission("CONTEXT:read"),
    impresionesController.getDashboardKPIs
);

// Obtener los documentos recientes
router.get(
    "/recientes",
    verifyToken,
    checkPermission("CONTEXT:read"),
    impresionesController.getRecentDocuments
);

// Exportar excel
router.get(
    "/exportar",
    verifyToken,
    checkPermission("CONTEXT:read"),
    impresionesController.exportExcel
);

// Marcar un oficio como recibido
router.patch(
    "/recibido",
    verifyToken,
    checkPermission("CONTEXT:create"),
    impresionesController.markAsReceived
);

// Generar excel usando una plantilla y datos del formulario
router.post(
    "/generar",
    verifyToken,
    checkPermission("CONTEXT:create"),
    impresionesController.generateExcel
);

module.exports = router;
