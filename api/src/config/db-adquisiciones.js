// api/src/config/db-adquisiciones.js
// Pool de la BD de Adquisiciones (SICOMPRAS). Expone una interfaz mínima (query + transaction)
// para que los repositorios no dependan de `pg` directamente; en las pruebas se reemplaza con
// useAdapter() por una BD en memoria.
//
// Conexión: ADQUISICIONES_DATABASE_URL (postgresql://usuario:clave@host:5432/base).
const { Pool } = require("pg");
require("dotenv").config();

let adapter = null;
let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.ADQUISICIONES_DATABASE_URL,
      ssl: false, // Ajusta si usas SSL en producción
    });
    pool.on("connect", () => {
      console.log("Conectado a la base de datos de Adquisiciones (SICOMPRAS)!");
    });
    pool.on("error", (err) => {
      // Un cliente inactivo caído no debe tumbar todo el core: se registra y el pool abre
      // otra conexión al siguiente uso.
      console.error("Error inesperado en el cliente de la base de datos de Adquisiciones", err);
    });
  }
  return pool;
}

async function runTransaction(work) {
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
      console.error("Falló el ROLLBACK en Adquisiciones:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
}

const adquisicionesDb = {
  /** Ejecuta una consulta; devuelve el objeto de resultado de pg ({ rows, rowCount }). */
  query(text, params) {
    return adapter ? adapter.query(text, params) : getPool().query(text, params);
  },

  /**
   * Ejecuta `work(tx)` dentro de una transacción (BEGIN/COMMIT, ROLLBACK si falla).
   * `tx.query` usa la misma conexión para todas las sentencias. `tx.afterCommit(fn)` registra una
   * acción (p. ej. enviar un correo) que corre solo si la transacción se confirmó; si esa acción
   * falla se registra el error y no afecta al resultado.
   */
  async transaction(work) {
    const afterCommit = [];
    const conGanchos = (tx) => ({
      query: (text, params) => tx.query(text, params),
      afterCommit: (accion) => afterCommit.push(accion),
    });

    const result = await runTransaction((tx) => work(conGanchos(tx)));

    for (const accion of afterCommit) {
      try {
        await accion();
      } catch (error) {
        console.error("Falló una acción posterior a la transacción en Adquisiciones:", error.message);
      }
    }
    return result;
  },

  /** Solo para pruebas: sustituye el pool real. Pasar null restaura el pool real. */
  useAdapter(next) {
    adapter = next;
  },
};

module.exports = { adquisicionesDb };
