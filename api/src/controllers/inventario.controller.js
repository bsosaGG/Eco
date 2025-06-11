// api/src/controllers/inventario.controller.js
const inventarioService = require("../services/inventario.service");
const { validationResult } = require("express-validator");

class InventarioController {
  async getAllItems(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const items = await inventarioService.getAllItems(
        parseInt(limit) || 100,
        parseInt(offset) || 0
      );
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  async getItemByCodigo(req, res, next) {
    try {
      const { codigo } = req.params;
      const item = await inventarioService.getItemByCodigo(codigo);
      if (!item) {
        return res
          .status(404)
          .json({ message: "Item de inventario no encontrado." });
      }
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  async getItemsByLibroFolio(req, res, next) {
    try {
      const { libro, folio } = req.params;
      const { limit, offset } = req.query;
      const items = await inventarioService.getItemsByLibroFolio(
        parseInt(libro),
        parseInt(folio),
        parseInt(limit) || 100,
        parseInt(offset) || 0
      );
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  async createItem(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const newItem = await inventarioService.createItem(req.body);
      res.status(201).json(newItem);
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { codigo } = req.params;
      const updatedItem = await inventarioService.updateItem(codigo, req.body);
      if (!updatedItem) {
        return res
          .status(404)
          .json({
            message: "Item de inventario no encontrado para actualizar.",
          });
      }
      res.json(updatedItem);
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req, res, next) {
    try {
      const { codigo } = req.params;
      const deletedItem = await inventarioService.deleteItem(codigo);
      if (!deletedItem) {
        return res
          .status(404)
          .json({ message: "Item de inventario no encontrado para eliminar." });
      }
      res.json({ message: "Item de inventario eliminado exitosamente." });
    } catch (error) {
      next(error);
    }
  }

  async uploadExcel(req, res, next) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "No se proporcionó ningún archivo." });
      }

      const filePath = req.file.path;
      const results = await inventarioService.uploadExcel(filePath);

      res.json({
        message: "Proceso de carga de Excel completado.",
        ...results,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventarioController();
