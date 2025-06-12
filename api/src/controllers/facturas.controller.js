const facturasService = require("../services/facturas.service");
const { validationResult, body, param } = require("express-validator");

class FacturasController {
  async getAllFacturas(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const facturas = await facturasService.getAllFacturas(
        parseInt(limit) || 100,
        parseInt(offset) || 0
      );
      res.json(facturas);
    } catch (error) {
      next(error);
    }
  }

  async getFacturaById(req, res, next) {
    try {
      const { id } = req.params;
      const factura = await facturasService.getFacturaById(parseInt(id));
      if (!factura) {
        return res.status(404).json({ message: "Factura no encontrada." });
      }
      res.json(factura);
    } catch (error) {
      next(error);
    }
  }

  async createFactura(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { numero_factura, serie_factura, fecha_factura, id_proveedor } =
        req.body;
      const newFactura = await facturasService.createFactura(
        numero_factura,
        serie_factura,
        fecha_factura,
        id_proveedor
      );
      res.status(201).json(newFactura);
    } catch (error) {
      next(error);
    }
  }

  async updateFactura(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id } = req.params;
      const { numero_factura, serie_factura, fecha_factura, id_proveedor } =
        req.body;
      const updatedFactura = await facturasService.updateFactura(
        parseInt(id),
        numero_factura,
        serie_factura,
        fecha_factura,
        id_proveedor
      );
      if (!updatedFactura) {
        return res
          .status(404)
          .json({ message: "Factura no encontrada para actualizar." });
      }
      res.json(updatedFactura);
    } catch (error) {
      next(error);
    }
  }

  async deleteFactura(req, res, next) {
    try {
      const { id } = req.params;
      const deletedFactura = await facturasService.deleteFactura(parseInt(id));
      if (!deletedFactura) {
        return res
          .status(404)
          .json({ message: "Factura no encontrada para eliminar." });
      }
      res.json({ message: "Factura eliminada exitosamente." });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FacturasController();
