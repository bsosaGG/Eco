const { Pool } = require("pg");
require("dotenv").config(); // Carga variables de .env si existen

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

pool.on("connect", () => {
  console.log("Conectado a la base de datos PostgreSQL!");
});

pool.on("error", (err) => {
  console.error("Error inesperado en el cliente de la base de datos", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(), // Para transacciones
};
