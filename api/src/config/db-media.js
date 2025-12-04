const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.MEDIA_DATABASE_URL,
    ssl: false,
});

pool.on("connect", () => {
    console.log("Conectado a la base de datos de Escucha a Medios!");
});

pool.on("error", (err) => {
    console.error("Error inesperado en el cliente de la base de datos de Medios", err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
};
