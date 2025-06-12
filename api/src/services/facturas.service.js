const { inventarioPool } = require("../config/db-inventario");

class FacturasService {
  constructor() {
    this.client = inventarioPool;
  }

  async getAllFacturas(limit = 100, offset = 0) {
    const query = `
            SELECT f.*, p.nombre AS proveedor_nombre
            FROM facturas f
            JOIN proveedores p ON f.id_proveedor = p.id
            ORDER BY f.fecha_factura DESC, f.numero_factura ASC
            LIMIT $1 OFFSET $2;
        `;
    const result = await this.client.query(query, [limit, offset]);
    return result.rows;
  }

  async getFacturaById(id) {
    const query = `
            SELECT f.*, p.nombre AS proveedor_nombre
            FROM facturas f
            JOIN proveedores p ON f.id_proveedor = p.id
            WHERE f.id = $1;
        `;
    const result = await this.client.query(query, [id]);
    return result.rows[0];
  }

  async createFactura(
    numero_factura,
    serie_factura,
    fecha_factura,
    id_proveedor
  ) {
    const query =
      "INSERT INTO facturas(numero_factura, serie_factura, fecha_factura, id_proveedor) VALUES($1, $2, $3, $4) RETURNING *;";
    const result = await this.client.query(query, [
      numero_factura,
      serie_factura,
      fecha_factura,
      id_proveedor,
    ]);
    return result.rows[0];
  }

  async updateFactura(
    id,
    numero_factura,
    serie_factura,
    fecha_factura,
    id_proveedor
  ) {
    const query =
      "UPDATE facturas SET numero_factura = $1, serie_factura = $2, fecha_factura = $3, id_proveedor = $4 WHERE id = $5 RETURNING *;";
    const result = await this.client.query(query, [
      numero_factura,
      serie_factura,
      fecha_factura,
      id_proveedor,
      id,
    ]);
    return result.rows[0];
  }

  async deleteFactura(id) {
    const client = await this.client.connect();
    try {
      await client.query("BEGIN");
      // Antes de eliminar una factura, debes asegurarte de que no haya ítems de inventario que la referencien.
      // O bien, puedes establecer id_factura a NULL en inventario_items, o usar CASCADE DELETE en la DB.
      // Por ahora, solo eliminar la factura. Si hay ítems referenciados, fallará por la restricción FOREIGN KEY.
      // Idealmente, deberías manejar esto en la lógica de negocio o en la base de datos (ON DELETE SET NULL / CASCADE).
      // Para el demo, asumiremos que si hay ítems asociados, el delete fallará o se maneja en el frontend.
      const query = "DELETE FROM facturas WHERE id = $1 RETURNING *;";
      const result = await client.query(query, [id]);
      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new FacturasService();
