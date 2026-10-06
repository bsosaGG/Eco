// Proveedores: catálogo propio de Adquisiciones (administración con permiso adquisiciones:config).
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const proveedores = require("./repositories/proveedores.repository");
const { NotFoundError } = require("./errors");

const getAllProveedores = (opciones) => proveedores.list(adquisicionesDb, opciones);

async function getProveedorById(id) {
  const proveedor = await proveedores.findById(adquisicionesDb, id);
  if (!proveedor) throw new NotFoundError("Proveedor no encontrado.");
  return proveedor;
}

const createProveedor = (data) => proveedores.insert(adquisicionesDb, data);

async function updateProveedor(id, data) {
  const proveedor = await proveedores.update(adquisicionesDb, id, data);
  if (!proveedor) throw new NotFoundError("Proveedor no encontrado para actualizar.");
  return proveedor;
}

module.exports = { getAllProveedores, getProveedorById, createProveedor, updateProveedor };
