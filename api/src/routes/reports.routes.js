// api/src/routes/reports.routes.js
const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get(
  "/dashboard",
  authMiddleware.verifyToken,
  authMiddleware.checkPermission("pac-reports:read"),
  reportsController.getDashboardReports
);

module.exports = router;
