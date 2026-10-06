// Lectura de la tabla HTML del catálogo público de insumos MAGA/SIGES. No hay API JSON oficial:
// apps.maga.gob.gt/compras/Insumos es una vista MVC renderizada en el servidor, así que se parsea
// la tabla HTML de la respuesta. No expone precios (solo nomenclatura/renglón/presentación).
// Lógica pura: la petición HTTP vive en integrations/insumos-maga.client.js.

function decodificarEntidadesHtml(texto) {
  return texto
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCharCode(parseInt(decimal, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "·");
}

function quitarEtiquetas(html) {
  return decodificarEntidadesHtml(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convierte el HTML de la respuesta en la lista de insumos. Devuelve [] si no encuentra la tabla.
 * Las filas con menos de 7 celdas o sin nombre de insumo se descartan.
 */
function parsearInsumos(html) {
  const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbody) return [];

  const filas = tbody[1].match(/<tr>[\s\S]*?<\/tr>/g) || [];
  const resultados = [];

  for (const fila of filas) {
    const celdas = fila.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [];
    if (celdas.length < 7) continue;

    const [renglon, codigoInsumo, insumo, caracteristicas, presentacion, cantidadYUnidad, codigoPresentacion] = celdas
      .slice(0, 7)
      .map(quitarEtiquetas);
    if (!insumo) continue;

    // "1 Mililitro" -> cantidad "1", unidad "Mililitro" (para autollenar tanto la cantidad como
    // la unidad de medida del renglón en el formulario)
    const partes = cantidadYUnidad.match(/^([\d.,]+)\s*(.*)$/);

    resultados.push({
      renglon,
      codigo_insumo: codigoInsumo,
      insumo,
      caracteristicas,
      presentacion,
      cantidad_y_unidad: cantidadYUnidad,
      cantidad: partes ? partes[1].replace(",", "") : "",
      unidad_medida: partes ? partes[2].trim() : cantidadYUnidad,
      codigo_presentacion: codigoPresentacion,
    });
  }

  return resultados;
}

module.exports = { parsearInsumos, quitarEtiquetas, decodificarEntidadesHtml };
