// api/src/controllers/pac.controller.js
const pacService = require("../services/pac.service");
const { validationResult } = require("express-validator");

class PacController {
  async crearSolicitud(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // El ID del usuario que crea la solicitud viene del token JWT,
      // que el middleware de autenticación ya debió haber verificado.
      const responsableUsuarioId = req.user.userId;

      const nuevaSolicitud = await pacService.crearSolicitud(
        req.body,
        responsableUsuarioId
      );
      res.status(201).json(nuevaSolicitud);
    } catch (error) {
      next(error);
    }
  }

  // ... Aquí agregaremos los controladores para GET, PUT, DELETE
}

module.exports = new PacController();
