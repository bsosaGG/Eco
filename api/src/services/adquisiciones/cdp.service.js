// CU-03: Certificado de Disponibilidad Presupuestaria (CDP). Tres pasos: el Asistente de Presupuesto
// elabora el borrador, el Encargado de Presupuesto lo aprueba técnicamente y el Jefe UDAF da el
// Vo.Bo. financiero final (aquí sí se descuenta el saldo de la partida).
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const expedientes = require("./repositories/expedientes.repository");
const cdp = require("./repositories/cdp.repository");
const partidas = require("./repositories/partidas.repository");
const numeracion = require("./repositories/numeracion.repository");
const bitacora = require("./repositories/bitacora.repository");
const { getExpedienteDetalle } = require("./expediente-detalle.service");
const { enrutar } = require("./ruta.service");
const { avanzarEstado } = require("./expediente-estado");
const { ESTADO_EXPEDIENTE, ESTADO_CDP } = require("./domain/estados");
const { DOCUMENTO } = require("./domain/numeracion");
const { generarFirmaHash } = require("./domain/firma");
const { quetzales } = require("./domain/montos");
const { ConflictError, NotFoundError, ValidationError } = require("./errors");

/** El CDP bloqueado para modificarlo, o 404 si no existe. */
async function cargarCdp(tx, idCdp) {
  const actual = await cdp.findPorIdBloqueado(tx, idCdp);
  if (!actual) throw new NotFoundError("El CDP especificado no existe.");
  return actual;
}

/**
 * CU-03 (paso 5): el Asistente de Presupuesto elabora el borrador del CDP. Valida el techo/saldo
 * disponible de la partida, pero todavía NO descuenta el saldo: eso solo ocurre cuando UDAF da el
 * Vo.Bo. final (voboCdp), para no reservar presupuesto sobre un borrador que puede quedar
 * rechazado en el camino.
 */
async function elaborarCdp(idExpediente, data, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    if (!(await expedientes.exists(tx, idExpediente))) throw new NotFoundError("Expediente no encontrado.");
    if (await cdp.existsPorExpediente(tx, idExpediente)) {
      throw new ConflictError("Este expediente ya tiene un CDP elaborado.");
    }

    const saldo = await partidas.findMontoDisponibleBloqueado(tx, data.id_partida);
    if (saldo === undefined) throw new ValidationError("La partida presupuestaria especificada no existe.");

    const montoDisponible = parseFloat(saldo);
    const montoReservado = parseFloat(data.monto_reservado);
    if (montoReservado > montoDisponible) {
      throw new ValidationError(
        `El monto solicitado (${quetzales(montoReservado)}) excede el saldo disponible de la partida (${quetzales(montoDisponible)}).`
      );
    }

    const numeroCdp = await numeracion.siguienteNumeroAnual(tx, DOCUMENTO.CDP);
    await cdp.insertBorrador(tx, {
      idExpediente,
      idPartida: data.id_partida,
      numeroCdp,
      montoReservado,
      usuarioId,
      estado: ESTADO_CDP.BORRADOR,
    });

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: "CDP elaborado",
      entidadRelacionada: "cdp",
      observacion: `Borrador ${numeroCdp} por ${quetzales(montoReservado)}.`,
    });
    await enrutar(tx, { idExpediente: idExpediente, actorId: usuarioId });
  });

  return getExpedienteDetalle(idExpediente);
}

/** CU-03 (paso 6): el Encargado de Presupuesto aprueba técnicamente el CDP. */
async function aprobarCdp(idCdp, usuarioId) {
  const idExpediente = await adquisicionesDb.transaction(async (tx) => {
    const actual = await cargarCdp(tx, idCdp);
    if (actual.estado !== ESTADO_CDP.BORRADOR) {
      throw new ConflictError(
        `El CDP debe estar en estado "${ESTADO_CDP.BORRADOR}" para aprobarse (estado actual: "${actual.estado}").`
      );
    }

    await cdp.marcarAprobadoTecnicamente(tx, {
      idCdp,
      usuarioId,
      firmaHash: generarFirmaHash(`cdp:${idCdp}:aprobar:${usuarioId}`),
      estado: ESTADO_CDP.APROBADO_TECNICAMENTE,
    });

    await bitacora.insert(tx, {
      idExpediente: actual.id_expediente,
      usuarioId,
      accion: "CDP aprobado técnicamente",
      entidadRelacionada: "cdp",
      observacion: `${actual.numero_cdp} aprobado por Encargado de Presupuesto.`,
    });

    await enrutar(tx, { idExpediente: actual.id_expediente, actorId: usuarioId });
    return actual.id_expediente;
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * CU-03 (cierre): el Jefe UDAF da el Vo.Bo. financiero final al CDP. Aquí sí se descuenta en firme
 * el saldo de la partida presupuestaria y el expediente avanza a "Revisión Jurídica".
 */
async function voboCdp(idCdp, usuarioId) {
  const idExpediente = await adquisicionesDb.transaction(async (tx) => {
    const actual = await cargarCdp(tx, idCdp);
    if (actual.estado !== ESTADO_CDP.APROBADO_TECNICAMENTE) {
      throw new ConflictError(
        `El CDP debe tener aprobación técnica antes del Vo.Bo. financiero (estado actual: "${actual.estado}").`
      );
    }

    await cdp.marcarAprobado(tx, {
      idCdp,
      usuarioId,
      firmaHash: generarFirmaHash(`cdp:${idCdp}:vobo:${usuarioId}`),
      estado: ESTADO_CDP.APROBADO,
    });
    await partidas.descontar(tx, actual.id_partida, actual.monto_reservado);
    await avanzarEstado(tx, actual.id_expediente, ESTADO_EXPEDIENTE.REVISION_JURIDICA);

    await bitacora.insert(tx, {
      idExpediente: actual.id_expediente,
      usuarioId,
      accion: "Vo.Bo. financiero del CDP",
      entidadRelacionada: "cdp",
      observacion: `${actual.numero_cdp} aprobado en firme por UDAF. Reservado ${quetzales(actual.monto_reservado)} de la partida.`,
    });

    await enrutar(tx, { idExpediente: actual.id_expediente, actorId: usuarioId });
    return actual.id_expediente;
  });

  return getExpedienteDetalle(idExpediente);
}

module.exports = { elaborarCdp, aprobarCdp, voboCdp };
