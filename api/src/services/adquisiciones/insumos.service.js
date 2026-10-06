// Búsqueda de apoyo en el catálogo público de insumos MAGA/SIGES para "Renglones Solicitados"
// (CU-01). Es opcional y nunca debe romper la creación de la solicitud: ver
// integrations/insumos-maga.client.js.
const config = require("../../config/adquisiciones.config");
const { buscarInsumos } = require("./integrations/insumos-maga.client");

/** Insumos que coinciden con el texto (vacío si el texto es muy corto o el sitio no responde). */
async function buscarInsumosMaga(textoBusqueda) {
  const consulta = (textoBusqueda || "").trim();
  if (consulta.length < config.insumosMaga.minQueryLength) return [];
  return buscarInsumos(consulta);
}

module.exports = { buscarInsumosMaga };
