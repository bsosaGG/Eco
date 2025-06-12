const proveedoresService = require("../services/proveedores.service");
const { validationResult, body, param } = require("express-validator");

class ProveedoresController {
  async getAllProveedores(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const proveedores = await proveedoresService.getAllProveedores(
        parseInt(limit) || 100,
        parseInt(offset) || 0
      );
      res.json(proveedores);
    } catch (error) {
      next(error);
    }
  }

  async getProveedorById(req, res, next) {
    try {
      const { id } = req.params;
      const proveedor = await proveedoresService.getProveedorById(parseInt(id));
      if (!proveedor) {
        return res.status(404).json({ message: "Proveedor no encontrado." });
      }
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  async createProveedor(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { nombre, nit } = req.body;
      const newProveedor = await proveedoresService.createProveedor(
        nombre,
        nit
      );
      res.status(201).json(newProveedor);
    } catch (error) {
      next(error);
    }
  }

  async updateProveedor(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id } = req.params;
      const { nombre, nit } = req.body;
      const updatedProveedor = await proveedoresService.updateProveedor(
        parseInt(id),
        nombre,
        nit
      );
      if (!updatedProveedor) {
        return res
          .status(404)
          .json({ message: "Proveedor no encontrado para actualizar." });
      }
      res.json(updatedProveedor);
    } catch (error) {
      next(error);
    }
  }

  async deleteProveedor(req, res, next) {
    try {
      const { id } = req.params;
      const deletedProveedor = await proveedoresService.deleteProveedor(
        parseInt(id)
      );
      if (!deletedProveedor) {
        return res
          .status(404)
          .json({ message: "Proveedor no encontrado para eliminar." });
      }
      res.json({ message: "Proveedor eliminado exitosamente." });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProveedoresController();
