// api/src/config/db-plan-medios.js
// Pool de la BD de Plan de Medios. Expone una interfaz mínima (query + transaction)
// para que los repositorios no dependan de `pg` directamente; en las pruebas se
// reemplaza con useAdapter() por una BD en memoria.
//
// La conexión se lee con las MISMAS variables que usaba el proyecto Python, de modo que
// su .env anterior funciona sin cambios:
//   PLAN_MEDIOS_DATABASE_URL   postgresql://usuario:clave@host:5432/base   (acepta también el
//                              formato postgresql+psycopg:// del proyecto Python)
//   o bien los componentes     PLAN_MEDIOS_DB_HOST, _PORT, _USER, _PASSWORD, _NAME
// Si ambas formas están presentes, gana la URL (igual que en el sistema original).
const { Pool } = require("pg");
require("dotenv").config();

const MISSING_CONFIG_MESSAGE =
  "Falta la configuración de la base de datos de Plan de Medios: defina PLAN_MEDIOS_DATABASE_URL " +
  "o PLAN_MEDIOS_DB_HOST, PLAN_MEDIOS_DB_USER y PLAN_MEDIOS_DB_NAME.";

const clean = (value) => (typeof value === "string" ? value.trim() : "");

/**
 * Opciones de conexión de `pg` a partir de variables de entorno.
 * @returns {{connectionString: string} | {host: string, port: number, user: string, password?: string, database: string}}
 */
function resolveConnection(env = process.env) {
  const url = clean(env.PLAN_MEDIOS_DATABASE_URL);
  if (url) {
    // El proyecto Python usaba el prefijo del driver (postgresql+psycopg://); `pg` no lo entiende.
    return { connectionString: url.replace(/^postgres(?:ql)?\+[a-z0-9_]+:\/\//i, "postgresql://") };
  }

  const host = clean(env.PLAN_MEDIOS_DB_HOST);
  const user = clean(env.PLAN_MEDIOS_DB_USER);
  const database = clean(env.PLAN_MEDIOS_DB_NAME);
  const password = clean(env.PLAN_MEDIOS_DB_PASSWORD);
  if (!host && !user && !database && !password) throw new Error(MISSING_CONFIG_MESSAGE);

  const missing = [["PLAN_MEDIOS_DB_HOST", host], ["PLAN_MEDIOS_DB_USER", user], ["PLAN_MEDIOS_DB_NAME", database]]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) throw new Error(`Configuración PostgreSQL incompleta de Plan de Medios: falta ${missing.join(", ")}.`);

  const port = clean(env.PLAN_MEDIOS_DB_PORT) || "5432";
  if (!/^\d+$/.test(port)) throw new Error("PLAN_MEDIOS_DB_PORT debe ser numérico.");

  // Se entregan por separado (no como URL) para que contraseñas con caracteres especiales funcionen.
  return { host, port: parseInt(port, 10), user, password: password || undefined, database };
}

let adapter = null;
let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({ ...resolveConnection(), ssl: false });
    pool.on("error", (err) => {
      // A diferencia de otros módulos, un cliente inactivo caído no debe tumbar
      // todo el core: se registra y el pool abre otra conexión al siguiente uso.
      console.error("Error inesperado en el cliente de la BD de Plan de Medios", err);
    });
  }
  return pool;
}

const planMediosDb = {
  /** Ejecuta una consulta; devuelve el objeto de resultado de pg ({ rows, rowCount }). */
  query(text, params) {
    return adapter ? adapter.query(text, params) : getPool().query(text, params);
  },

  /**
   * Ejecuta `work(tx)` dentro de una transacción (BEGIN/COMMIT, ROLLBACK si falla).
   * `tx.query` usa la misma conexión para todas las sentencias.
   */
  async transaction(work) {
    if (adapter) return adapter.transaction(work);
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const result = await work({ query: (text, params) => client.query(text, params) });
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Fallo el ROLLBACK en Plan de Medios:", rollbackError.message);
      }
      throw error;
    } finally {
      client.release();
    }
  },

  /** Solo para pruebas: sustituye el pool real. Pasar null restaura el pool real. */
  useAdapter(next) {
    adapter = next;
  },
};

module.exports = { planMediosDb, resolveConnection };
