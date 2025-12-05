const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendar.controller");
const { verifyToken, checkPermission } = require("../middleware/auth.middleware");

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get("/", checkPermission("calendar:read"), calendarController.getEvents);
router.post("/", checkPermission("calendar:create"), calendarController.createEvent);
router.put("/:id", checkPermission("calendar:update"), calendarController.updateEvent);
router.delete("/:id", checkPermission("calendar:delete"), calendarController.deleteEvent);

module.exports = router;
