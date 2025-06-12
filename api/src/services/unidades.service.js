const { inventarioPool } = require("../config/db-inventario");

class UnidadesService {
  constructor() {
    this.client = inventarioPool;
  }

  async getAllUnidades(limit = 100, offset = 0) {
    const query =
      "SELECT * FROM unidades_direcciones ORDER BY nombre ASC LIMIT $1 OFFSET $2;";
    const result = await this.client.query(query, [limit, offset]);
    return result.rows;
  }

  async getUnidadById(id) {
    const query = "SELECT * FROM unidades_direcciones WHERE id = $1;";
    const result = await this.client.query(query, [id]);
    return result.rows[0];
  }

  async createUnidad(nombre, descripcion) {
    const query =
      "INSERT INTO unidades_direcciones(nombre, descripcion) VALUES($1, $2) RETURNING *;";
    const result = await this.client.query(query, [nombre, descripcion]);
    return result.rows[0];
  }

  async updateUnidad(id, nombre, descripcion) {
    const query =
      "UPDATE unidades_direcciones SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *;";
    const result = await this.client.query(query, [nombre, descripcion, id]);
    return result.rows[0];
  }

  async deleteUnidad(id) {
    const query = "DELETE FROM unidades_direcciones WHERE id = $1 RETURNING *;";
    const result = await this.client.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = new UnidadesService();
