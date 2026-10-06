// Catálogos de lectura que alimentan los combos del frontend.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const catalogos = require("./repositories/catalogos.repository");

const getUnidades = () => catalogos.listUnidadesActivas(adquisicionesDb);
const getRenglones = () => catalogos.listRenglones(adquisicionesDb);
const getPartidas = () => catalogos.listPartidas(adquisicionesDb);
const getEstados = () => catalogos.listEstados(adquisicionesDb);

module.exports = { getUnidades, getRenglones, getPartidas, getEstados };
