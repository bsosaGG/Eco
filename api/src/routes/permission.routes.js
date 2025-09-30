// api\src/routes/permission.routes.js

const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permission.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Proteger todas las rutas de permisos (igual que perfiles)
router.use(verifyToken, isAdmin);

router.get("/", permissionController.getAllPermissions);
router.post("/", permissionController.createPermission);
router.put("/:id", permissionController.updatePermission);
router.delete("/:id", permissionController.deletePermission);

module.exports = router;
