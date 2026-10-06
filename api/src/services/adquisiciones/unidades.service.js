// Unidades solicitantes: catálogo administrable (mismo patrón que Proveedores). El combo de
// unidades activas lo sirve catalogos.service.getUnidades().
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const unidades = require("./repositories/unidades.repository");
const { NotFoundError } = require("./errors");

const getAllUnidadesSolicitantes = (searchQuery = "") => unidades.list(adquisicionesDb, searchQuery);

const createUnidadSolicitante = (data) => unidades.insert(adquisicionesDb, data);

async function updateUnidadSolicitante(id, data) {
  const unidad = await unidades.update(adquisicionesDb, id, data);
  if (!unidad) throw new NotFoundError("Unidad solicitante no encontrada para actualizar.");
  return unidad;
}

module.exports = { getAllUnidadesSolicitantes, createUnidadSolicitante, updateUnidadSolicitante };
