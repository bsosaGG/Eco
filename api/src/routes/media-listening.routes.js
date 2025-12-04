const express = require("express");
const router = express.Router();
const mediaController = require("../controllers/media-listening.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Rutas Públicas
router.get("/public/catalog", mediaController.getPublicCatalog);
router.get("/public/config", mediaController.getConfig);
router.post("/public/submit", mediaController.submitResponse);

// Rutas Privadas (Requieren autenticación y permisos)
router.get(
    "/submissions",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("media-listening:read"),
    mediaController.getSubmissions
);

// Gestión del Catálogo
router.get(
    "/catalog",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("media-listening:manage-settings"),
    mediaController.getCatalog
);

router.post(
    "/catalog",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("media-listening:manage-settings"),
    mediaController.createMedia
);

router.put(
    "/catalog/:id",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("media-listening:manage-settings"),
    mediaController.updateMedia
);

router.delete(
    "/catalog/:id",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("media-listening:manage-settings"),
    mediaController.deleteMedia
);

router.put(
    "/config",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("media-listening:manage-settings"),
    mediaController.updateConfig
);

module.exports = router;
