// api/src/routes/cloudflare.routes.js

const express = require("express");
const router = express.Router();
const cloudflareController = require("../controllers/cloudflare.controller");
const {
  verifyToken,
  checkPermission,
} = require("../middleware/auth.middleware");

// POST /api/cloudflare/report
// La ruta ahora se llama 'report' para reflejar que genera un reporte.
router.post(
  "/report",
  [verifyToken, checkPermission("cloudflare-requests:read")],
  cloudflareController.generateCloudflareReport
);

module.exports = router;
