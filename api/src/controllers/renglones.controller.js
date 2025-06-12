const renglonesService = require("../services/renglones.service");
const { validationResult, body, param } = require("express-validator");

class RenglonesController {
  async getAllRenglones(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const renglones = await renglonesService.getAllRenglones(
        parseInt(limit) || 100,
        parseInt(offset) || 0
      );
      res.json(renglones);
    } catch (error) {
      next(error);
    }
  }

  async getRenglonById(req, res, next) {
    try {
      const { id } = req.params;
      const renglon = await renglonesService.getRenglonById(parseInt(id));
      if (!renglon) {
        return res.status(404).json({ message: "Renglón no encontrado." });
      }
      res.json(renglon);
    } catch (error) {
      next(error);
    }
  }

  async createRenglon(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { nombre } = req.body;
      const newRenglon = await renglonesService.createRenglon(nombre);
      res.status(201).json(newRenglon);
    } catch (error) {
      next(error);
    }
  }

  async updateRenglon(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const updatedRenglon = await renglonesService.updateRenglon(
        parseInt(id),
        nombre
      );
      if (!updatedRenglon) {
        return res
          .status(404)
          .json({ message: "Renglón no encontrado para actualizar." });
      }
      res.json(updatedRenglon);
    } catch (error) {
      next(error);
    }
  }

  async deleteRenglon(req, res, next) {
    try {
      const { id } = req.params;
      const deletedRenglon = await renglonesService.deleteRenglon(parseInt(id));
      if (!deletedRenglon) {
        return res
          .status(404)
          .json({ message: "Renglón no encontrado para eliminar." });
      }
      res.json({ message: "Renglón eliminado exitosamente." });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RenglonesController();
