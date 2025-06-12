const unidadesService = require("../services/unidades.service");
const { validationResult, body, param } = require("express-validator");

class UnidadesController {
  async getAllUnidades(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const unidades = await unidadesService.getAllUnidades(
        parseInt(limit) || 100,
        parseInt(offset) || 0
      );
      res.json(unidades);
    } catch (error) {
      next(error);
    }
  }

  async getUnidadById(req, res, next) {
    try {
      const { id } = req.params;
      const unidad = await unidadesService.getUnidadById(parseInt(id));
      if (!unidad) {
        return res
          .status(404)
          .json({ message: "Unidad/Dirección no encontrada." });
      }
      res.json(unidad);
    } catch (error) {
      next(error);
    }
  }

  async createUnidad(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { nombre, descripcion } = req.body;
      const newUnidad = await unidadesService.createUnidad(nombre, descripcion);
      res.status(201).json(newUnidad);
    } catch (error) {
      next(error);
    }
  }

  async updateUnidad(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      const updatedUnidad = await unidadesService.updateUnidad(
        parseInt(id),
        nombre,
        descripcion
      );
      if (!updatedUnidad) {
        return res
          .status(404)
          .json({ message: "Unidad/Dirección no encontrada para actualizar." });
      }
      res.json(updatedUnidad);
    } catch (error) {
      next(error);
    }
  }

  async deleteUnidad(req, res, next) {
    try {
      const { id } = req.params;
      const deletedUnidad = await unidadesService.deleteUnidad(parseInt(id));
      if (!deletedUnidad) {
        return res
          .status(404)
          .json({ message: "Unidad/Dirección no encontrada para eliminar." });
      }
      res.json({ message: "Unidad/Dirección eliminada exitosamente." });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UnidadesController();
