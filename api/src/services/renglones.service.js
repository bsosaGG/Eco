const { inventarioPool } = require("../config/db-inventario");

class RenglonesService {
  constructor() {
    this.client = inventarioPool;
  }

  async getAllRenglones(limit = 100, offset = 0) {
    const query =
      "SELECT * FROM renglones_inventario ORDER BY nombre ASC LIMIT $1 OFFSET $2;";
    const result = await this.client.query(query, [limit, offset]);
    return result.rows;
  }

  async getRenglonById(id) {
    const query = "SELECT * FROM renglones_inventario WHERE id = $1;";
    const result = await this.client.query(query, [id]);
    return result.rows[0];
  }

  async createRenglon(nombre) {
    const query =
      "INSERT INTO renglones_inventario(nombre) VALUES($1) RETURNING *;";
    const result = await this.client.query(query, [nombre]);
    return result.rows[0];
  }

  async updateRenglon(id, nombre) {
    const query =
      "UPDATE renglones_inventario SET nombre = $1 WHERE id = $2 RETURNING *;";
    const result = await this.client.query(query, [nombre, id]);
    return result.rows[0];
  }

  async deleteRenglon(id) {
    const query = "DELETE FROM renglones_inventario WHERE id = $1 RETURNING *;";
    const result = await this.client.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = new RenglonesService();
