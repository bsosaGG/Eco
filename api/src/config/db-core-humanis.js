const { Pool } = require("pg");
const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

// Configuración idéntica al estándar de denuncias-scsp/api/src/config/db-*.js
const dbUrl = process.env.CORE_HUMANIS_DATABASE_URL || process.env.DATABASE_URL;

let pool = null;
let isConnected = false;

if (dbUrl) {
  pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
  });

  pool.on("error", (err) => {
    console.error("⚠️ Error en DB Core Humanis:", err.message);
  });
}

// Mock database store para modo standalone sin PostgreSQL activo
const mockStore = require("./mock-store");

module.exports = {
  query: async (text, params = []) => {
    if (pool) {
      try {
        return await pool.query(text, params);
      } catch (err) {
        if (err.code || err.severity) {
          throw err;
        }
        console.warn("⚠️ Postgres no disponible o falló consulta, usando datos simulados de respaldo:", err.message);
        return mockStore.query(text, params);
      }
    }
    return mockStore.query(text, params);
  },
  getClient: async () => {
    if (pool) {
      try {
        return await pool.connect();
      } catch (err) {
        console.warn("⚠️ Postgres getClient no disponible, usando cliente mock:", err.message);
        return mockStore.getClient();
      }
    }
    return mockStore.getClient();
  },
  isPostgresActive: () => Boolean(pool && isConnected),
};
