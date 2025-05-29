const { Pool } = require("pg");
require("dotenv").config(); // Carga variables de .env si existen

const pool = new Pool({
  connectionString: process.env.USERS_DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false, // Necesario para algunas DBaaS en producción
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
