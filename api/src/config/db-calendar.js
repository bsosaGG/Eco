const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.CALENDAR_DATABASE_URL,
});

pool.on("connect", () => {
    console.log("Conectado a la base de datos de Calendario");
});

pool.on("error", (err) => {
    console.error("Error inesperado en el cliente inactivo (Calendario)", err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
};
