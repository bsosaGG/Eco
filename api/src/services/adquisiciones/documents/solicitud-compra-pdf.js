// PDF de la Solicitud de Compra (FOR-DG-UA-00-01): renderiza la plantilla HTML
// (templates/adquisiciones/solicitud-compra-html.template.js) con Chromium headless vía
// puppeteer-core.
//
// Se abandonó el enfoque de plantilla DOCX + easy-template-x porque el formulario oficial real
// está construido en Word como una cuadrícula de celdas (una letra por celda), lo que hacía
// imposible insertar tags de texto variable sin romper el documento. El HTML replica el diseño
// visual del formulario (incluyendo el logo oficial) y la página de ANEXO solo se agrega cuando
// el expediente tiene anexo.
const fs = require("fs");
const config = require("../../../config/adquisiciones.config");
const { buildSolicitudCompraHtml } = require("../../../templates/adquisiciones/solicitud-compra-html.template");
const { ConfigurationError } = require("../errors");

let puppeteer = null;
try {
  // eslint-disable-next-line global-require
  puppeteer = require("puppeteer-core");
} catch (err) {
  // Se valida al usarlo: si falta la dependencia, renderizarPdf lanza un error claro.
}

/**
 * Ubica el binario de Chromium instalado en la imagen Docker (paquete "chromium" de Alpine).
 * Se prueba primero CHROMIUM_PATH (definida en el Dockerfile) y luego las rutas típicas, por si
 * el nombre del binario cambia entre versiones de la imagen base.
 */
function resolverRutaChromium() {
  const { candidates } = config.chromium;
  const encontrado = candidates.find((ruta) => fs.existsSync(ruta));
  if (!encontrado) {
    throw new ConfigurationError(
      "No se encontró el binario de Chromium en el servidor (se probaron: " +
        candidates.join(", ") +
        "). Revisa la instalación de 'chromium' en el Dockerfile."
    );
  }
  return encontrado;
}

/** Genera el PDF (Buffer) de la Solicitud de Compra a partir de los datos de la plantilla. */
async function renderizarSolicitudCompraPdf(datos) {
  if (!puppeteer) {
    throw new ConfigurationError(
      "Falta la dependencia 'puppeteer-core' en el servidor. Ejecuta 'npm install' en /api y reconstruye el contenedor."
    );
  }

  const html = buildSolicitudCompraHtml(datos);

  const browser = await puppeteer.launch({
    executablePath: resolverRutaChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });
  } finally {
    await browser.close();
  }
}

module.exports = { renderizarSolicitudCompraPdf, resolverRutaChromium };
