// Rutas y lectores de fixtures para pruebas que no necesitan BD ni autenticación.
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "../../../src");
const FIXTURES = path.join(__dirname, "../fixtures");

const readFixture = (relative) => fs.readFileSync(path.join(FIXTURES, relative));
const readJsonFixture = (relative) => JSON.parse(readFixture(relative).toString("utf8"));

module.exports = { SRC, FIXTURES, readFixture, readJsonFixture };
