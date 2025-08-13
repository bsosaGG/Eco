const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.PAC_DATABASE_URL,
  ssl: false, // Ajusta si usas SSL en producción
});

pool.on("connect", () => {
  console.log("Conectado a la base de datos del PAC!");
});

pool.on("error", (err) => {
  console.error("Error inesperado en el cliente de la base de datos", err);
  process.exit(-1);
});

module.exports = {
  pacPool: pool,
};