// CU-04: Orden de Compra. El Analista de Adquisiciones elabora el borrador, el Jefe de Adquisiciones
// la aprueba técnicamente y la Directora General la autoriza y emite en firme.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const expedientes = require("./repositories/expedientes.repository");
const cdp = require("./repositories/cdp.repository");
const cotizaciones = require("./repositories/cotizaciones.repository");
const ordenesCompra = require("./repositories/ordenes-compra.repository");
const numeracion = require("./repositories/numeracion.repository");
const bitacora = require("./repositories/bitacora.repository");
const { getExpedienteDetalle } = require("./expediente-detalle.service");
const { avanzarEstado } = require("./expediente-estado");
const { ESTADO_EXPEDIENTE, ESTADO_CDP, ESTADO_ORDEN_COMPRA } = require("./domain/estados");
const { DOCUMENTO } = require("./domain/numeracion");
const { generarFirmaHash } = require("./domain/firma");
const { quetzales } = require("./domain/montos");
const { ConflictError, NotFoundError, ValidationError } = require("./errors");

/** La Orden de Compra bloqueada para modificarla, o 404 si no existe. */
async function cargarOrdenCompra(tx, idOrdenCompra) {
  const actual = await ordenesCompra.findPorId(tx, idOrdenCompra, { lock: true });
  if (!actual) throw new NotFoundError("La Orden de Compra especificada no existe.");
  return actual;
}

/**
 * CU-04 (paso 9): el Analista de Adquisiciones elabora la Orden de Compra. El CDP y el proveedor
 * adjudicado NO se piden por body: se derivan del propio expediente (el CDP debe estar "Aprobado"
 * en firme y el proveedor es el de la cotización adjudicada) para que no se puedan falsificar desde
 * el cliente. Al quedar el borrador listo, el expediente avanza a "Aprobación Jefatura".
 */
async function elaborarOrdenCompra(idExpediente, data, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    if (!(await expedientes.exists(tx, idExpediente))) throw new NotFoundError("Expediente no encontrado.");
    if (await ordenesCompra.existsPorExpediente(tx, idExpediente)) {
      throw new ConflictError("Este expediente ya tiene una Orden de Compra elaborada.");
    }

    const certificado = await cdp.findPorExpediente(tx, idExpediente);
    if (!certificado || certificado.estado !== ESTADO_CDP.APROBADO) {
      throw new ConflictError("El expediente debe tener un CDP aprobado en firme antes de elaborar la Orden de Compra.");
    }

    const idProveedorAdjudicado = await cotizaciones.findProveedorAdjudicado(tx, idExpediente);
    if (idProveedorAdjudicado === undefined) {
      throw new ConflictError("El expediente no tiene una cotización adjudicada para determinar el proveedor.");
    }

    const montoTotal = parseFloat(data.monto_total);
    if (montoTotal > parseFloat(certificado.monto_reservado)) {
      throw new ValidationError(
        `El monto de la Orden de Compra (${quetzales(montoTotal)}) no puede exceder el monto reservado en el CDP (${quetzales(certificado.monto_reservado)}).`
      );
    }

    const numeroOc = await numeracion.siguienteNumeroAnual(tx, DOCUMENTO.ORDEN_COMPRA);
    await ordenesCompra.insertBorrador(tx, {
      idExpediente,
      idCdp: certificado.id_cdp,
      idProveedorAdjudicado,
      numeroOc,
      montoTotal,
      plazoEntrega: data.plazo_entrega,
      lugarEntrega: data.lugar_entrega,
      usuarioId,
      estado: ESTADO_ORDEN_COMPRA.BORRADOR,
    });
    await avanzarEstado(tx, idExpediente, ESTADO_EXPEDIENTE.APROBACION_JEFATURA, usuarioId);

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: "Orden de Compra elaborada",
      entidadRelacionada: "ordenes_compra",
      observacion: `Borrador ${numeroOc} por ${quetzales(montoTotal)}.`,
    });
  });

  return getExpedienteDetalle(idExpediente);
}

/** CU-04 (paso 10): el Jefe de Adquisiciones aprueba técnicamente la Orden de Compra. */
async function aprobarOrdenCompra(idOrdenCompra, usuarioId) {
  const idExpediente = await adquisicionesDb.transaction(async (tx) => {
    const actual = await cargarOrdenCompra(tx, idOrdenCompra);
    if (actual.estado !== ESTADO_ORDEN_COMPRA.BORRADOR) {
      throw new ConflictError(
        `La Orden de Compra debe estar en estado "${ESTADO_ORDEN_COMPRA.BORRADOR}" para aprobarse (estado actual: "${actual.estado}").`
      );
    }

    await ordenesCompra.marcarAprobadaJefatura(tx, {
      idOrdenCompra,
      usuarioId,
      firmaHash: generarFirmaHash(`oc:${idOrdenCompra}:aprobar:${usuarioId}`),
      estado: ESTADO_ORDEN_COMPRA.APROBADA_JEFATURA,
    });
    await avanzarEstado(tx, actual.id_expediente, ESTADO_EXPEDIENTE.PENDIENTE_AUTORIZACION_FINAL, usuarioId);

    await bitacora.insert(tx, {
      idExpediente: actual.id_expediente,
      usuarioId,
      accion: "Orden de Compra aprobada por Jefatura",
      entidadRelacionada: "ordenes_compra",
      observacion: `${actual.numero_oc} aprobada técnicamente por Jefe de Adquisiciones.`,
    });

    return actual.id_expediente;
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * CU-04 (paso 11): la Directora General autoriza y emite la Orden de Compra en firme. Se marca
 * `fecha_notificacion_proveedor` en el mismo paso: el CU no define un endpoint separado para
 * notificar al proveedor y este módulo no envía correos todavía, así que se deja constancia de que
 * la OC quedó lista para notificarse en cuanto se autoriza.
 */
async function autorizarOrdenCompra(idOrdenCompra, usuarioId) {
  const idExpediente = await adquisicionesDb.transaction(async (tx) => {
    const actual = await cargarOrdenCompra(tx, idOrdenCompra);
    if (actual.estado !== ESTADO_ORDEN_COMPRA.APROBADA_JEFATURA) {
      throw new ConflictError(
        `La Orden de Compra debe tener aprobación de Jefatura antes de autorizarse (estado actual: "${actual.estado}").`
      );
    }

    await ordenesCompra.marcarEmitida(tx, {
      idOrdenCompra,
      usuarioId,
      firmaHash: generarFirmaHash(`oc:${idOrdenCompra}:autorizar:${usuarioId}`),
      estado: ESTADO_ORDEN_COMPRA.EMITIDA,
    });
    await avanzarEstado(tx, actual.id_expediente, ESTADO_EXPEDIENTE.EN_CONFORMACION, usuarioId);

    await bitacora.insert(tx, {
      idExpediente: actual.id_expediente,
      usuarioId,
      accion: "Orden de Compra autorizada y emitida",
      entidadRelacionada: "ordenes_compra",
      observacion: `${actual.numero_oc} autorizada en firme por Directora General. Notificada al proveedor.`,
    });

    return actual.id_expediente;
  });

  return getExpedienteDetalle(idExpediente);
}

module.exports = { elaborarOrdenCompra, aprobarOrdenCompra, autorizarOrdenCompra };
