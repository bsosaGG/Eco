const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.MONITOREO_DATABASE_URL,
  ssl: false, // Ajusta si usas SSL en producción
});

pool.on("connect", () => {
  // Corregido el mensaje para esta base de datos
  console.log("Conectado a la base de datos de Monitoreo!");
});

pool.on("error", (err) => {
  console.error(
    "Error inesperado en el cliente de la base de datos de Monitoreo",
    err
  );
  process.exit(-1);
});

module.exports = {
  // Corregida la exportación para evitar colisiones de nombres
  monitoreoPool: pool,
};
