// CU-05 / CU-06: recepción del bien o servicio, documentos de soporte y traslado a Contabilidad.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const expedientes = require("./repositories/expedientes.repository");
const ordenesCompra = require("./repositories/ordenes-compra.repository");
const recepciones = require("./repositories/recepciones.repository");
const bitacora = require("./repositories/bitacora.repository");
const { getExpedienteDetalle } = require("./expediente-detalle.service");
const { enrutar } = require("./ruta.service");
const { avanzarEstado } = require("./expediente-estado");
const { ESTADO_EXPEDIENTE, ESTADO_ORDEN_COMPRA } = require("./domain/estados");
const { ConflictError, NotFoundError } = require("./errors");

/**
 * CU-05: el Analista de Adquisiciones confirma la compra con el proveedor y registra la recepción
 * del bien/servicio. La Orden de Compra debe estar "Emitida" (CU-04 completo) y solo puede existir
 * una recepción por OC. No cambia el estado del expediente por sí sola: el traslado a Contabilidad
 * (CU-06) es el que avanza el trámite, y exige que la recepción esté conforme.
 */
async function registrarRecepcion(idOrdenCompra, data, usuarioId) {
  const idExpediente = await adquisicionesDb.transaction(async (tx) => {
    const oc = await ordenesCompra.findPorId(tx, idOrdenCompra);
    if (!oc) throw new NotFoundError("Orden de Compra no encontrada.");
    if (oc.estado !== ESTADO_ORDEN_COMPRA.EMITIDA) {
      throw new ConflictError("La Orden de Compra debe estar emitida antes de registrar la recepción.");
    }
    if (await recepciones.existsPorOrdenCompra(tx, idOrdenCompra)) {
      throw new ConflictError("Esta Orden de Compra ya tiene una recepción registrada.");
    }

    const recibidoConforme = data.recibido_conforme === true || data.recibido_conforme === "true";
    await recepciones.insert(tx, {
      idOrdenCompra,
      recibidoConforme,
      dictamenFisico: data.dictamen_fisico,
      tecnicoReceptorUsuarioId: usuarioId,
      observaciones: data.observaciones,
    });

    await bitacora.insert(tx, {
      idExpediente: oc.id_expediente,
      usuarioId,
      accion: "Recepción registrada",
      entidadRelacionada: "recepciones",
      observacion: `Recepción de ${oc.numero_oc}: ${recibidoConforme ? "recibido conforme" : "recibido con observaciones"}.`,
    });

    await enrutar(tx, { idExpediente: oc.id_expediente, actorId: usuarioId });
    return oc.id_expediente;
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * CU-06 (primera parte): adjunta un documento de soporte (factura, Hoja 1H, egreso de almacén,
 * certificado de satisfacción u otro) al expediente. Tabla genérica: se puede llamar varias veces
 * para ir completando el expediente antes de trasladarlo a Contabilidad.
 */
async function adjuntarDocumentoSoporte(idExpediente, data, archivoUrl, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    if (!(await expedientes.exists(tx, idExpediente))) throw new NotFoundError("Expediente no encontrado.");

    const idDocumento = await recepciones.insertDocumentoSoporte(tx, {
      idExpediente,
      tipoDocumento: data.tipo_documento,
      numeroDocumento: data.numero_documento,
      archivoUrl,
      fechaDocumento: data.fecha_documento,
      usuarioId,
    });

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: "Documento de soporte adjuntado",
      entidadRelacionada: "documentos_soporte",
      observacion: `${data.tipo_documento} adjuntado (documento #${idDocumento}).`,
    });
    await enrutar(tx, { idExpediente: idExpediente, actorId: usuarioId });
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * CU-06 (segunda parte): traslada el expediente a Contabilidad para iniciar la fase financiera
 * (CU-07/08/09). Exige una recepción conforme y al menos un documento de soporte.
 */
async function trasladarAContabilidad(idExpediente, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    const expediente = await expedientes.findConEstado(tx, idExpediente, { lock: true });
    if (!expediente) throw new NotFoundError("Expediente no encontrado.");
    if (expediente.estado !== ESTADO_EXPEDIENTE.EN_CONFORMACION) {
      throw new ConflictError(
        `El expediente debe estar en estado "${ESTADO_EXPEDIENTE.EN_CONFORMACION}" para trasladarlo a Contabilidad.`
      );
    }

    const recibidoConforme = await recepciones.findConformidadPorExpediente(tx, idExpediente);
    if (recibidoConforme === undefined) {
      throw new ConflictError(
        "Debe registrarse la recepción del bien/servicio antes de trasladar el expediente a Contabilidad."
      );
    }
    if (!recibidoConforme) {
      throw new ConflictError(
        "La recepción no está conforme — resuelva las observaciones antes de trasladar el expediente a Contabilidad."
      );
    }

    if ((await recepciones.contarDocumentosSoporte(tx, idExpediente)) === 0) {
      throw new ConflictError(
        "Debe adjuntar al menos un documento de soporte antes de trasladar el expediente a Contabilidad."
      );
    }

    await avanzarEstado(tx, idExpediente, ESTADO_EXPEDIENTE.FASE_FINANCIERA);

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: "Expediente trasladado a Contabilidad",
      entidadRelacionada: "expedientes",
      observacion: "Inicia la fase financiera (compromiso, devengado y solicitud de pago).",
    });
    await enrutar(tx, { idExpediente: idExpediente, actorId: usuarioId });
  });

  return getExpedienteDetalle(idExpediente);
}

module.exports = { registrarRecepcion, adjuntarDocumentoSoporte, trasladarAContabilidad };
