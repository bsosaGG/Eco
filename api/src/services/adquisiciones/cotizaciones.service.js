// CU-02: cotizaciones de los proveedores y adjudicación.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const cotizaciones = require("./repositories/cotizaciones.repository");
const expedientes = require("./repositories/expedientes.repository");
const proveedores = require("./repositories/proveedores.repository");
const bitacora = require("./repositories/bitacora.repository");
const { getExpedienteDetalle } = require("./expediente-detalle.service");
const { avanzarEstado } = require("./expediente-estado");
const { ESTADO_EXPEDIENTE } = require("./domain/estados");
const { NotFoundError, ValidationError } = require("./errors");

/** CU-02: registra la oferta de un proveedor para un expediente. */
async function registrarCotizacion(idExpediente, data, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    const razonSocial = await proveedores.findRazonSocial(tx, data.id_proveedor);
    if (razonSocial === undefined) throw new ValidationError("El proveedor especificado no existe.");

    await cotizaciones.insert(tx, {
      idExpediente,
      idProveedor: data.id_proveedor,
      montoOfertado: data.monto_ofertado,
      plazoEntregaDias: data.plazo_entrega_dias,
      garantiaMeses: data.garantia_meses,
      cumpleEspecificaciones: data.cumple_especificaciones,
      archivoPdfUrl: data.archivo_pdf_url,
      usuarioId,
    });

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: "Cotización registrada",
      entidadRelacionada: "cotizaciones",
      observacion: `Oferta de ${razonSocial} por ${data.monto_ofertado}.`,
    });
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * CU-02: adjudica una de las cotizaciones registradas y avanza el expediente a la firma del CDP. El
 * monto ofertado pasa a ser el monto estimado del expediente (se actualiza si se readjudica) y, si
 * el expediente tiene un solo renglón, su costo unitario. Con varios renglones el monto es un total
 * que no se puede repartir, así que el costo de cada renglón se deja como estaba.
 */
async function adjudicarCotizacion(idExpediente, idCotizacion, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    const cotizacion = await cotizaciones.findDeExpediente(tx, idCotizacion, idExpediente);
    if (!cotizacion) throw new NotFoundError("La cotización especificada no pertenece a este expediente.");

    await cotizaciones.adjudicar(tx, idExpediente, idCotizacion);
    await expedientes.setMontoEstimado(tx, idExpediente, cotizacion.monto_ofertado);
    await expedientes.setCostoUnitarioDeRenglonUnico(tx, idExpediente, cotizacion.monto_ofertado);
    await avanzarEstado(tx, idExpediente, ESTADO_EXPEDIENTE.EN_FIRMA_CDP, usuarioId);

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: "Cotización adjudicada",
      entidadRelacionada: "cotizaciones",
      observacion: `Adjudicada a ${cotizacion.razon_social}.`,
    });
  });

  return getExpedienteDetalle(idExpediente);
}

module.exports = { registrarCotizacion, adjudicarCotizacion };
