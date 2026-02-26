const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.IMPRESIONES_DATABASE_URL,
  ssl: false,
});

pool.on("connect", () => {
  // console.log("Conectado a la base de datos IMPRESIONES!");
});

pool.on("error", (err) => {
  console.error("Error inesperado en el cliente de la base de datos IMPRESIONES", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
