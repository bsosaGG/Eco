const express = require("express");
const router = express.Router();
const monitoringController = require("../controllers/monitoring.controller");
const { body, param } = require("express-validator");
const { verifyToken } = require("../middleware/auth.middleware");

// --- Rutas de Servidores ---
router.get("/servers", verifyToken, monitoringController.getServers);
router.post(
  "/servers",
  [
    verifyToken,
    body("nombre").notEmpty().withMessage("El nombre es obligatorio.").trim(),
    body("direccion_ip")
      .isIP()
      .withMessage("Debe ser una dirección IP válida."),
    body("puerto_ssh")
      .isInt({ min: 1, max: 65535 })
      .withMessage("El puerto SSH debe ser un número válido."),
    body("usuario_ssh")
      .notEmpty()
      .withMessage("El usuario SSH es obligatorio.")
      .trim(),
    body("descripcion").optional().trim(),
  ],
  monitoringController.createServer
);
router.get(
  "/servers/:id/status",
  [
    verifyToken,
    param("id")
      .isInt()
      .withMessage("El ID del servidor debe ser un número entero."),
  ],
  monitoringController.getServerStatus
);

// --- NUEVAS Rutas de Sitios Web ---
router.get("/sites", verifyToken, monitoringController.getSites);
// (Añadiremos POST, PUT, DELETE para sitios web en el siguiente paso para mantener esto enfocado)

// --- NUEVAS Rutas de Configuración ---
router.get("/config", verifyToken, monitoringController.getConfig);
router.put(
  "/config",
  [
    verifyToken,
    body("key").notEmpty().withMessage("La clave es obligatoria."),
    body("value").isString().withMessage("El valor es obligatorio."),
  ],
  monitoringController.updateConfig
);

module.exports = router;
