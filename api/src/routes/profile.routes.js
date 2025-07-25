const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Proteger todas las rutas de perfiles
router.use(verifyToken, isAdmin);

router.get("/permissions", profileController.getAllPermissions);
router.get("/", profileController.getAllProfiles);
router.post("/", profileController.createProfile);
router.put("/:id", profileController.updateProfile);
router.delete("/:id", profileController.deleteProfile);

module.exports = router;
