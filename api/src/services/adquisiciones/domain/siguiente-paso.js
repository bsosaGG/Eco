// Qué falta hacer en un expediente, a qué perfil le toca y en qué paso se hace. Lógica pura, sin I/O.
// Es la única fuente de esta regla: la usa el enrutamiento automático (para asignar el expediente a la
// persona que corresponde) y el detalle del expediente (para mostrar el "siguiente paso").
const { ESTADO_EXPEDIENTE, ESTADO_CDP } = require("./estados");

// Perfiles del proceso de Baja Cuantía (nombres tal como están en db_global_users).
const PERFIL = {
  JEFE_ADQUISICIONES: "Jefe de Adquisiciones",
  ANALISTA: "Analista de Adquisiciones",
  ASISTENTE_PRESUPUESTO: "Asistente de Presupuesto",
  ENCARGADO_PRESUPUESTO: "Encargado de Presupuesto",
  JEFE_UDAF: "Jefe UDAF",
  DIRECTORA_GENERAL: "Directora General",
  ENCARGADO_CONTABILIDAD: "Encargado de Contabilidad",
  SUB_DESPACHO: "Sub Despacho",
};

const TIPO = { PENDIENTE: "pendiente", DEVUELTO: "devuelto", CERRADO: "cerrado", CANCELADO: "cancelado" };

const pendiente = (titulo, perfil, paso, permiso, accion) => ({
  tipo: TIPO.PENDIENTE,
  titulo,
  perfil,
  paso,
  permiso,
  ...(accion ? { accion } : {}),
});

/**
 * @param {object} s situación del expediente:
 *   estado, cdp_estado, tiene_recepcion, recepcion_conforme, documentos, tiene_compromiso,
 *   tiene_devengado, solicitud_pago_estado
 * @returns {{tipo, titulo, perfil?, paso?, permiso?, accion?}|null}
 *   `paso` es la clave del paso del trámite en pantalla (cotizacion, cdp, oc, recepcion, financiera);
 *   `accion: "turnar"` es el paso de recibir y turnar a un analista; en un expediente devuelto el
 *   responsable es quien emitió la solicitud (sin `perfil`).
 */
function siguientePaso(s) {
  if (!s) return null;

  switch (s.estado) {
    case ESTADO_EXPEDIENTE.RECIBIDA:
      return pendiente("Recibir la solicitud y turnarla a un analista", PERFIL.JEFE_ADQUISICIONES, null, "adquisiciones:assign", "turnar");

    case ESTADO_EXPEDIENTE.PENDIENTE_COTIZACION:
      return pendiente("Registrar las cotizaciones y adjudicar una", PERFIL.ANALISTA, "cotizacion", "adquisiciones:manage-cotizaciones");

    case ESTADO_EXPEDIENTE.EN_FIRMA_CDP:
      if (!s.cdp_estado) return pendiente("Elaborar el CDP", PERFIL.ASISTENTE_PRESUPUESTO, "cdp", "adquisiciones:elaborar-cdp");
      if (s.cdp_estado === ESTADO_CDP.APROBADO_TECNICAMENTE) {
        return pendiente("Dar el Vo.Bo. financiero del CDP", PERFIL.JEFE_UDAF, "cdp", "adquisiciones:vobo-financiero");
      }
      return pendiente("Aprobar técnicamente el CDP", PERFIL.ENCARGADO_PRESUPUESTO, "cdp", "adquisiciones:aprobar-cdp");

    case ESTADO_EXPEDIENTE.REVISION_JURIDICA:
      return pendiente("Elaborar la Orden de Compra", PERFIL.ANALISTA, "oc", "adquisiciones:elaborar-oc");

    case ESTADO_EXPEDIENTE.APROBACION_JEFATURA:
      return pendiente("Aprobar la Orden de Compra", PERFIL.JEFE_ADQUISICIONES, "oc", "adquisiciones:aprobar-oc");

    case ESTADO_EXPEDIENTE.PENDIENTE_AUTORIZACION_FINAL:
      return pendiente("Autorizar la Orden de Compra", PERFIL.DIRECTORA_GENERAL, "oc", "adquisiciones:autorizar-oc");

    case ESTADO_EXPEDIENTE.EN_CONFORMACION:
      if (!s.tiene_recepcion) {
        return pendiente("Registrar la recepción del bien o servicio", PERFIL.ANALISTA, "recepcion", "adquisiciones:confirmar-recepcion");
      }
      if (!s.recepcion_conforme) {
        return pendiente("Resolver las observaciones de la recepción", PERFIL.ANALISTA, "recepcion", "adquisiciones:confirmar-recepcion");
      }
      if (!s.documentos) {
        return pendiente("Adjuntar los documentos de soporte", PERFIL.ANALISTA, "recepcion", "adquisiciones:conformar-pago");
      }
      return pendiente("Trasladar el expediente a Contabilidad", PERFIL.ANALISTA, "recepcion", "adquisiciones:conformar-pago");

    case ESTADO_EXPEDIENTE.FASE_FINANCIERA:
      if (!s.tiene_compromiso) {
        return pendiente("Registrar el compromiso presupuestario", PERFIL.ENCARGADO_PRESUPUESTO, "financiera", "adquisiciones:registrar-compromiso");
      }
      if (!s.tiene_devengado) {
        return pendiente("Registrar el devengado", PERFIL.ENCARGADO_CONTABILIDAD, "financiera", "adquisiciones:registrar-devengado");
      }
      if (!s.solicitud_pago_estado) {
        return pendiente("Trasladar la solicitud de pago", PERFIL.ENCARGADO_CONTABILIDAD, "financiera", "adquisiciones:solicitar-pago");
      }
      return pendiente("Autorizar el pago", PERFIL.SUB_DESPACHO, "financiera", "adquisiciones:autorizar-pago");

    case ESTADO_EXPEDIENTE.DEVUELTO:
      return { tipo: TIPO.DEVUELTO, titulo: "Subsanar las observaciones y reingresar la solicitud", paso: null };

    case ESTADO_EXPEDIENTE.PAGADO_Y_ARCHIVADO:
      return { tipo: TIPO.CERRADO, titulo: "Trámite completo: pagado y archivado" };

    case "Cancelado / Desierto":
      return { tipo: TIPO.CANCELADO, titulo: "Expediente cancelado o declarado desierto" };

    default:
      return null;
  }
}

/** Arma la situación a partir del detalle del expediente (la forma que devuelve el API). */
function situacionDesdeDetalle(expediente) {
  return {
    estado: expediente.estado,
    cdp_estado: expediente.cdp?.estado || null,
    tiene_recepcion: Boolean(expediente.recepcion),
    recepcion_conforme: Boolean(expediente.recepcion?.recibido_conforme),
    documentos: (expediente.documentos_soporte || []).length,
    tiene_compromiso: Boolean(expediente.compromiso),
    tiene_devengado: Boolean(expediente.devengado),
    solicitud_pago_estado: expediente.solicitud_pago?.estado || null,
  };
}

module.exports = { siguientePaso, situacionDesdeDetalle, PERFIL, TIPO };
