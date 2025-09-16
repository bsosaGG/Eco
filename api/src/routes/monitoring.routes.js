// api/src/routes/monitoring.routes.js (CÓDIGO COMPLETO)
const express = require("express");
const router = express.Router();
const monitoringController = require("../controllers/monitoring.controller");
const { body, param } = require("express-validator");
const authMiddleware = require("../middleware/auth.middleware");

const serverValidationRules = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio.").trim(),
  body("direccion_ip").isIP().withMessage("Debe ser una dirección IP válida."),
  body("puerto_ssh")
    .isInt({ min: 1, max: 65535 })
    .withMessage("El puerto SSH debe ser un número válido."),
  body("usuario_ssh")
    .notEmpty()
    .withMessage("El usuario SSH es obligatorio.")
    .trim(),
  body("intervalo_verificacion_segundos")
    .isInt({ min: 30 })
    .withMessage("El intervalo debe ser de al menos 30 segundos."),
  body("ssh_key_passphrase").optional({ checkFalsy: true }).isString(),
  body("activo")
    .isBoolean()
    .withMessage("El estado activo debe ser un valor booleano."),
];

router.get(
  "/config",
  authMiddleware.verifyToken,
  authMiddleware.checkPermission("monitoring:read"),
  monitoringController.getConfig
);
router.put(
  "/config",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:update"),
    body("key").notEmpty(),
    body("value").isString(),
  ],
  monitoringController.updateConfig
);

router.get(
  "/servers",
  authMiddleware.verifyToken,
  authMiddleware.checkPermission("monitoring:read"),
  monitoringController.getServers
);
router.post(
  "/servers",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:create"),
    ...serverValidationRules,
  ],
  monitoringController.createServer
);
router.get(
  "/servers/:id/status",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:read"),
    param("id").isInt(),
  ],
  monitoringController.getServerStatus
);
router.get(
  "/servers/:id/history",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:read"),
    param("id").isInt(),
  ],
  monitoringController.getServerHistory
);
router.put(
  "/servers/:id",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:update"),
    param("id").isInt(),
    ...serverValidationRules,
  ],
  monitoringController.updateServer
);
router.delete(
  "/servers/:id",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:delete"),
    param("id").isInt(),
  ],
  monitoringController.deleteServer
);

router.get(
  "/sites",
  authMiddleware.verifyToken,
  authMiddleware.checkPermission("monitoring:read"),
  monitoringController.getSites
);
router.post(
  "/sites",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:create"),
    body("nombre").notEmpty(),
    body("url").isURL(),
    body("id_servidor").optional({ checkFalsy: true }).isInt(),
  ],
  monitoringController.createSite
);
router.put(
  "/sites/:id",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:update"),
    param("id").isInt(),
    body("nombre").notEmpty(),
    body("url").isURL(),
    body("activo").isBoolean(),
    body("intervalo_verificacion_segundos").isInt({ min: 10 }),
  ],
  monitoringController.updateSite
);
router.delete(
  "/sites/:id",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:delete"),
    param("id").isInt(),
  ],
  monitoringController.deleteSite
);
router.get(
  "/sites/:id/status",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:read"),
    param("id").isInt(),
  ],
  monitoringController.getSiteStatus
);
router.get(
  "/sites/:id/history",
  [
    authMiddleware.verifyToken,
    authMiddleware.checkPermission("monitoring:read"),
    param("id").isInt(),
  ],
  monitoringController.getSiteHistory
);

module.exports = router;
