// PDF de la Solicitud de Compra (FOR-DG-UA-00-01) de un expediente.
const { getExpedientePorId } = require("./expedientes.service");
const { construirDatosSolicitudCompra } = require("./domain/solicitud-compra");
const { renderizarSolicitudCompraPdf } = require("./documents/solicitud-compra-pdf");

/**
 * { buffer, codigoExpediente } con el PDF de la solicitud; 404 si el expediente no existe o, para
 * quien solo ve lo suyo (`actor`), si no lo emitió.
 */
async function generarSolicitudPdf(idExpediente, actor) {
  const expediente = await getExpedientePorId(idExpediente, actor);

  const buffer = await renderizarSolicitudCompraPdf(construirDatosSolicitudCompra(expediente));
  return { buffer, codigoExpediente: expediente.codigo_expediente };
}

module.exports = { generarSolicitudPdf };
