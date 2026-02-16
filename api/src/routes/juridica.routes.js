const express = require("express");
const router = express.Router();
const controller = require("../controllers/juridica.controller");
const { verifyToken, checkPermission } = require("../middleware/auth.middleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- MULTER CONFIG ---
// Storage para Historial
const storageHistorial = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "uploads/juridica";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});
const uploadHistorial = multer({ storage: storageHistorial });

// Storage para Plantillas
const storagePlantillas = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "uploads/juridica/plantillas";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, "Plantilla_" + Date.now() + path.extname(file.originalname));
    },
});
const uploadPlantillas = multer({ storage: storagePlantillas });


// --- ROUTES ---

// Juicios CRUD
router.get("/", verifyToken, checkPermission("juridica:read"), controller.getJuicios);
router.get("/stats", verifyToken, checkPermission("juridica:read"), controller.getDashboardStats);
router.get("/suggestions", verifyToken, checkPermission("juridica:read"), controller.getSuggestions);
router.get("/:id", verifyToken, checkPermission("juridica:read"), controller.getJuicioById);
router.post("/", verifyToken, checkPermission("juridica:create"), controller.createJuicio);
router.put("/:id", verifyToken, checkPermission("juridica:update-case"), controller.updateJuicio);
// Note: Financial permissions checked inside controller or we can create specific route

// Historial & Adjuntos
router.post("/:id/historial", verifyToken, checkPermission("juridica:update-case"), uploadHistorial.single("archivo"), controller.addHistorial);
router.put("/historial/:id", verifyToken, checkPermission("juridica:update-case"), uploadHistorial.single("archivo"), controller.updateHistorial);
router.delete("/historial/:id", verifyToken, checkPermission("juridica:update-case"), controller.deleteHistorial);
router.get("/historial/:id/adjunto", verifyToken, checkPermission("juridica:read"), controller.downloadHistorialAttachment);

// Storage para Borradores
const storageBorradores = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "uploads/juridica/borradores";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "draft-" + uniqueSuffix + path.extname(file.originalname));
    },
});
const uploadBorradores = multer({ storage: storageBorradores });

// Borradores
router.post("/:id/draft", verifyToken, checkPermission("juridica:update-case"), uploadBorradores.single("archivo"), controller.saveDraft);
router.delete("/:id/draft", verifyToken, checkPermission("juridica:update-case"), controller.deleteDraft);

// Document Generation
router.get("/:id/export-docx", verifyToken, checkPermission("juridica:read"), controller.exportDocx);

// Audit Logs (CU-06)
router.get("/:id/audit-logs", verifyToken, checkPermission("juridica:audit"), controller.getAuditLogs);

// Actores
router.get("/actores/search", verifyToken, checkPermission("juridica:read"), controller.searchActores);
router.get("/actores/:id", verifyToken, checkPermission("juridica:read"), controller.getActorById);
router.post("/actores", verifyToken, checkPermission("juridica:create"), controller.createActor);

// Config / Plantillas
router.get("/config/templates", verifyToken, checkPermission("juridica:config"), controller.getTemplates);
router.post("/config/templates", verifyToken, checkPermission("juridica:config"), uploadPlantillas.single("archivo"), controller.uploadTemplate);

module.exports = router;
