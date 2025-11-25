const express = require('express');
const router = express.Router();
const uploadsController = require('../controllers/uploads.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// CORRECCIÓN DEFINITIVA PARA EXPRESS 5:
// En Express 5.x, no se pueden usar strings con regex (ej: '/(.*)').
// Se debe usar una Expresión Regular Literal (sin comillas) para que funcione.
// Esto captura toda la ruta y la pone en req.params[0], tal como espera tu controlador.
router.get(/(.*)/, verifyToken, uploadsController.getFile);

module.exports = router;