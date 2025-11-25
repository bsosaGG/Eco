const express = require("express");
const router = express.Router();
const controller = require("../controllers/agendas.controller");
const authMiddleware = require("../middleware/auth.middleware");
const uploadMonthlyReport = require("../middleware/uploadMonthlyReport");

router.get(
    "/matrix",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    controller.getMatrix
);

router.get(
    "/weekly-entry",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:read"),
    controller.getWeeklyEntry
);

router.post(
    "/weekly-entry",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:create"),
    controller.saveWeeklyAgenda
);

// Endpoint para que el frontend sepa qué ministerio le toca al usuario
router.get(
    "/my-assignment",
    authMiddleware.verifyToken,
    controller.getMyAssignment
);

// Cierre Mensual
router.get(
    "/monthly-overview",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    controller.getMonthlyOverview
);

router.post(
    "/close-month",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    uploadMonthlyReport.single("file"),
    controller.closeMonth
);

// Catálogos
router.get(
    "/weeks",
    authMiddleware.verifyToken,
    controller.getWeeks
);

router.get(
    "/item-types",
    authMiddleware.verifyToken,
    controller.getItemTypes
);

// --- Admin Routes ---

// Institutions
router.get(
    "/admin/institutions",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    controller.getInstitutions
);

router.post(
    "/admin/institutions",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    uploadMonthlyReport.single("logo"), // Reusing upload middleware for logo
    controller.createInstitution
);

router.put(
    "/admin/institutions/:id",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    uploadMonthlyReport.single("logo"),
    controller.updateInstitution
);

router.delete(
    "/admin/institutions/:id",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    controller.deleteInstitution
);

// Assignments
router.get(
    "/admin/assignments",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    controller.getAssignments
);

router.post(
    "/admin/assignments",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    controller.createAssignment
);

router.delete(
    "/admin/assignments",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    controller.deleteAssignment
);

// User Search
router.get(
    "/admin/users/search",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    controller.searchUsers
);

// Item Types
router.put(
    "/admin/item-types/:key",
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("agendas:view-all"),
    controller.updateItemType
);

module.exports = router;
