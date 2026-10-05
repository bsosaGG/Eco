// Cliente del catálogo público de insumos MAGA/SIGES (búsqueda de apoyo para "Renglones
// Solicitados", CU-01). Hace GET a la misma URL pública que usa un navegador
// (?SearchString=...) y parsea la tabla HTML.
//
// Es un apoyo opcional: cualquier falla (sitio caído, cambio de markup, red bloqueada en el
// ambiente del backend) se traga aquí y devuelve []; nunca debe romper la creación de la
// solicitud.
const axios = require("axios");
const config = require("../../../config/adquisiciones.config");
const { parsearInsumos } = require("../domain/insumos-maga");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-GT,es;q=0.9",
};

async function buscarInsumos(textoBusqueda) {
  const { url, timeoutMs, itemsPerPage } = config.insumosMaga;
  try {
    const response = await axios.get(url, {
      params: { SearchString: textoBusqueda, itemsPerPage },
      timeout: timeoutMs,
      headers: HEADERS,
      validateStatus: () => true,
    });
    if (response.status !== 200 || typeof response.data !== "string") return [];
    return parsearInsumos(response.data);
  } catch (error) {
    console.error("No se pudo consultar el catálogo de insumos MAGA/SIGES:", error.message);
    return [];
  }
}

module.exports = { buscarInsumos };
