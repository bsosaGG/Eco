// Fase financiera (CU-07/08/09): compromiso presupuestario, devengado y solicitud de pago. Cada
// etapa es 1:1 con la anterior y ningún monto puede exceder al de la etapa previa.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const expedientes = require("./repositories/expedientes.repository");
const cdp = require("./repositories/cdp.repository");
const financiera = require("./repositories/fase-financiera.repository");
const numeracion = require("./repositories/numeracion.repository");
const bitacora = require("./repositories/bitacora.repository");
const { getExpedienteDetalle } = require("./expediente-detalle.service");
const { enrutar } = require("./ruta.service");
const { avanzarEstado } = require("./expediente-estado");
const { ESTADO_EXPEDIENTE, ESTADO_FINANCIERO } = require("./domain/estados");
const { DOCUMENTO } = require("./domain/numeracion");
const { quetzales } = require("./domain/montos");
const { ConflictError, NotFoundError, ValidationError } = require("./errors");

/**
 * CU-07 (paso 17): el Encargado de Presupuesto registra el compromiso presupuestario. Exige el
 * expediente en "Fase Financiera / Liquidación" (CU-06 completo) y valida el monto contra el CDP,
 * igual que CU-04 valida la Orden de Compra contra el CDP.
 */
async function registrarCompromiso(idExpediente, data, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    const expediente = await expedientes.findConEstado(tx, idExpediente);
    if (!expediente) throw new NotFoundError("Expediente no encontrado.");
    if (expediente.estado !== ESTADO_EXPEDIENTE.FASE_FINANCIERA) {
      throw new ConflictError(
        `El expediente debe estar en estado "${ESTADO_EXPEDIENTE.FASE_FINANCIERA}" para registrar el compromiso.`
      );
    }
    if (await financiera.existsCompromisoPorExpediente(tx, idExpediente)) {
      throw new ConflictError("Este expediente ya tiene un compromiso presupuestario registrado.");
    }

    const montoReservado = await cdp.findMontoReservadoPorExpediente(tx, idExpediente);
    if (montoReservado === undefined) throw new ConflictError("El expediente no tiene un CDP asociado.");

    const montoComprometido = parseFloat(data.monto_comprometido);
    if (montoComprometido > parseFloat(montoReservado)) {
      throw new ValidationError(
        `El monto comprometido (${quetzales(montoComprometido)}) no puede exceder el monto reservado en el CDP (${quetzales(montoReservado)}).`
      );
    }

    const numeroComp = await numeracion.siguienteNumeroAnual(tx, DOCUMENTO.COMPROMISO);
    await financiera.insertCompromiso(tx, {
      idExpediente,
      numeroComp,
      montoComprometido,
      usuarioId,
      estado: ESTADO_FINANCIERO.REGISTRADO,
    });

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: "Compromiso presupuestario registrado",
      entidadRelacionada: "compromisos_presupuestarios",
      observacion: `${numeroComp} por ${quetzales(montoComprometido)}.`,
    });
    await enrutar(tx, { idExpediente: idExpediente, actorId: usuarioId });
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * CU-08 (paso 19): el Encargado de Contabilidad registra el devengado. 1:1 con el compromiso; el
 * monto devengado no puede exceder lo comprometido.
 */
async function registrarDevengado(idCompromiso, data, usuarioId) {
  const idExpediente = await adquisicionesDb.transaction(async (tx) => {
    const compromiso = await financiera.findCompromiso(tx, idCompromiso);
    if (!compromiso) throw new NotFoundError("Compromiso presupuestario no encontrado.");
    if (await financiera.existsDevengadoPorCompromiso(tx, idCompromiso)) {
      throw new ConflictError("Este compromiso ya tiene un devengado registrado.");
    }

    const montoDevengado = parseFloat(data.monto_devengado);
    if (montoDevengado > parseFloat(compromiso.monto_comprometido)) {
      throw new ValidationError(
        `El monto devengado (${quetzales(montoDevengado)}) no puede exceder el monto comprometido (${quetzales(compromiso.monto_comprometido)}).`
      );
    }
    const retencionIsr = data.retencion_isr != null ? parseFloat(data.retencion_isr) : 0;

    const numeroDev = await numeracion.siguienteNumeroAnual(tx, DOCUMENTO.DEVENGADO);
    await financiera.insertDevengado(tx, {
      idCompromiso,
      numeroDev,
      montoDevengado,
      retencionIsr,
      usuarioId,
      estado: ESTADO_FINANCIERO.REGISTRADO,
    });

    await bitacora.insert(tx, {
      idExpediente: compromiso.id_expediente,
      usuarioId,
      accion: "Devengado registrado",
      entidadRelacionada: "devengados",
      observacion: `${numeroDev} por ${quetzales(montoDevengado)} (retención ISR ${quetzales(retencionIsr)}).`,
    });

    await enrutar(tx, { idExpediente: compromiso.id_expediente, actorId: usuarioId });
    return compromiso.id_expediente;
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * CU-09 (paso 21): el Encargado de Contabilidad traslada la solicitud de pago con los datos
 * bancarios del proveedor. 1:1 con el devengado.
 */
async function solicitarPago(idDevengado, data, usuarioId) {
  const idExpediente = await adquisicionesDb.transaction(async (tx) => {
    const devengado = await financiera.findDevengadoConExpediente(tx, idDevengado);
    if (!devengado) throw new NotFoundError("Devengado no encontrado.");
    if (await financiera.existsSolicitudPagoPorDevengado(tx, idDevengado)) {
      throw new ConflictError("Este devengado ya tiene una solicitud de pago registrada.");
    }

    await financiera.insertSolicitudPago(tx, {
      idDevengado,
      entidadBancaria: data.entidad_bancaria,
      tipoCuenta: data.tipo_cuenta,
      numeroCuenta: data.numero_cuenta,
      numeroTransferenciaCheque: data.numero_transferencia_cheque,
      usuarioId,
      estado: ESTADO_FINANCIERO.PENDIENTE,
    });

    await bitacora.insert(tx, {
      idExpediente: devengado.id_expediente,
      usuarioId,
      accion: "Solicitud de pago trasladada",
      entidadRelacionada: "solicitudes_pago",
      observacion: `Depósito a ${data.entidad_bancaria}, cuenta ${data.tipo_cuenta} #${data.numero_cuenta}.`,
    });

    await enrutar(tx, { idExpediente: devengado.id_expediente, actorId: usuarioId });
    return devengado.id_expediente;
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * CU-09 (pasos 22-23): Sub Despacho tramita y autoriza el pago, y el expediente queda archivado:
 * cierra el ciclo completo del proceso.
 */
async function autorizarPago(idSolicitudPago, usuarioId) {
  const idExpediente = await adquisicionesDb.transaction(async (tx) => {
    const solicitud = await financiera.findSolicitudPagoConExpediente(tx, idSolicitudPago);
    if (!solicitud) throw new NotFoundError("Solicitud de pago no encontrada.");
    if (solicitud.estado !== ESTADO_FINANCIERO.PENDIENTE) {
      throw new ConflictError("La solicitud de pago ya fue tramitada.");
    }

    await financiera.marcarSolicitudPagoTramitada(tx, {
      idSolicitudPago,
      usuarioId,
      estado: ESTADO_FINANCIERO.TRAMITADO,
    });
    await avanzarEstado(tx, solicitud.id_expediente, ESTADO_EXPEDIENTE.PAGADO_Y_ARCHIVADO);

    await bitacora.insert(tx, {
      idExpediente: solicitud.id_expediente,
      usuarioId,
      accion: "Pago autorizado y expediente archivado",
      entidadRelacionada: "solicitudes_pago",
      observacion: "Pago tramitado por Sub Despacho. Cierra el ciclo completo del proceso de adquisición (CU-01 a CU-09).",
    });

    await enrutar(tx, { idExpediente: solicitud.id_expediente, actorId: usuarioId });
    return solicitud.id_expediente;
  });

  return getExpedienteDetalle(idExpediente);
}

module.exports = { registrarCompromiso, registrarDevengado, solicitarPago, autorizarPago };
