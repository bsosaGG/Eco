const { inventarioPool } = require("../config/db-inventario");

class ProveedoresService {
  constructor() {
    this.client = inventarioPool;
  }

  async getAllProveedores(limit = 100, offset = 0) {
    const query =
      "SELECT * FROM proveedores ORDER BY nombre ASC LIMIT $1 OFFSET $2;";
    const result = await this.client.query(query, [limit, offset]);
    return result.rows;
  }

  async getProveedorById(id) {
    const query = "SELECT * FROM proveedores WHERE id = $1;";
    const result = await this.client.query(query, [id]);
    return result.rows[0];
  }

  async createProveedor(nombre, nit) {
    const query =
      "INSERT INTO proveedores(nombre, nit) VALUES($1, $2) RETURNING *;";
    const result = await this.client.query(query, [nombre, nit]);
    return result.rows[0];
  }

  async updateProveedor(id, nombre, nit) {
    const query =
      "UPDATE proveedores SET nombre = $1, nit = $2 WHERE id = $3 RETURNING *;";
    const result = await this.client.query(query, [nombre, nit, id]);
    return result.rows[0];
  }

  async deleteProveedor(id) {
    const query = "DELETE FROM proveedores WHERE id = $1 RETURNING *;";
    const result = await this.client.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = new ProveedoresService();
