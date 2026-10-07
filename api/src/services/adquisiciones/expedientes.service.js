// Casos de uso del expediente (CU-01): crear y enviar la Solicitud de Compra, listarla, consultarla,
// asignarla a un analista, cambiar su estado y devolverla con observaciones. Orquesta repositorios y
// dominio; no conoce HTTP.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const expedientes = require("./repositories/expedientes.repository");
const catalogos = require("./repositories/catalogos.repository");
const unidades = require("./repositories/unidades.repository");
const asignaciones = require("./repositories/asignaciones-unidad.repository");
const numeracion = require("./repositories/numeracion.repository");
const bitacora = require("./repositories/bitacora.repository");
const devoluciones = require("./repositories/devoluciones.repository");
const notificaciones = require("./notificaciones.service");
const { enrutar, elegirParaPerfil } = require("./ruta.service");
const { avanzarEstado } = require("./expediente-estado");
const { getExpedienteDetalle } = require("./expediente-detalle.service");
const { exigirUsuarioDelModulo } = require("./usuarios-modulo.service");
const { ESTADO_EXPEDIENTE } = require("./domain/estados");
const { codigoExpediente } = require("./domain/numeracion");
const { PERFIL } = require("./domain/siguiente-paso");
const { puedeVerExpediente } = require("./domain/visibilidad");
const { ConfigurationError, ConflictError, NotFoundError, ValidationError } = require("./errors");

const MODALIDAD_POR_DEFECTO = "Baja Cuantía";

/** Código correlativo de la unidad para el año en curso, con la nomenclatura oficial (p. ej. "UA-1-2026"). */
async function generarCodigoExpediente(tx, idUnidad) {
  const anio = new Date().getFullYear();
  const codigoUnidad = await unidades.findCodigoUnidad(tx, idUnidad);
  if (codigoUnidad === undefined) throw new ValidationError("La unidad solicitante especificada no existe.");

  const existentes = await numeracion.contarExpedientesDelAnio(tx, codigoUnidad, anio);
  return codigoExpediente(codigoUnidad, existentes + 1, anio);
}

/**
 * Listado paginado; `filtros` admite limit, offset, estado, unidad y search. `actor` es
 * { userId, verTodo }: quien no ve todo solo recibe los expedientes que le tocan y los que emitió.
 */
const listarExpedientes = (filtros, actor) =>
  expedientes.list(adquisicionesDb, { ...filtros, participanteId: actor.verTodo ? undefined : actor.userId });

/**
 * El expediente por id numérico o código, con todo su trámite. Quien no ve todo solo puede abrir
 * los que le tocan y los que emitió; los demás responden como si no existieran.
 */
async function getExpedientePorId(id, actor) {
  const expediente = await getExpedienteDetalle(id);
  if (!expediente || !puedeVerExpediente(actor, expediente)) {
    throw new NotFoundError("Expediente no encontrado.");
  }
  return expediente;
}

/**
 * CU-01: crea y envía una Solicitud de Compra (SCR-02). Recibe los datos del expediente más un
 * arreglo `items` (renglones solicitados).
 */
async function crearExpediente(data, usuarioSolicitanteId) {
  const idExpediente = await adquisicionesDb.transaction(async (tx) => {
    const idEstadoInicial = await catalogos.findEstadoIdPorNombre(tx, ESTADO_EXPEDIENTE.RECIBIDA);
    if (!idEstadoInicial) {
      throw new ConfigurationError(`No se ha configurado el estado inicial '${ESTADO_EXPEDIENTE.RECIBIDA}'.`);
    }

    const codigo = await generarCodigoExpediente(tx, data.id_unidad_solicitante);

    // Firma 2 (FOR-DG-UA-00-01): puede ser cualquier usuario real del módulo; NO se restringe a
    // quien esté "asignado" a la unidad solicitante, porque en la práctica quien firma no siempre
    // es el/la jefe de esa unidad.
    let firma2Cargo = null;
    if (data.firma2_usuario_id) {
      await exigirUsuarioDelModulo(
        data.firma2_usuario_id,
        "El usuario seleccionado para la segunda firma no existe o no pertenece al módulo de Adquisiciones."
      );
      // "Foto" del cargo al firmar: el que tiene asignado en la unidad (si no está asignado, queda vacío).
      firma2Cargo =
        (await asignaciones.findCargoActivo(tx, data.id_unidad_solicitante, data.firma2_usuario_id)) || null;
    }

    const tieneAnexo = !!data.tiene_anexo;
    const creado = await expedientes.insert(tx, {
      codigoExpediente: codigo,
      idUnidadSolicitante: data.id_unidad_solicitante,
      usuarioSolicitanteId,
      funcionarioResponsable: data.funcionario_responsable || null,
      objetoCompra: data.objeto_compra,
      justificacion: data.justificacion,
      montoEstimado: data.monto_estimado || null,
      modalidad: data.modalidad || MODALIDAD_POR_DEFECTO,
      idEstadoActual: idEstadoInicial,
      documentoEspecificacionesUrl: data.documento_especificaciones_url || null,
      tipoCompra: data.tipo_compra || null,
      tieneAnexo,
      anexoCaracteristicasTecnicas: tieneAnexo ? data.anexo_caracteristicas_tecnicas || null : null,
      anexoEspecificacionesEspeciales: tieneAnexo ? data.anexo_especificaciones_especiales || null : null,
      firma2UsuarioId: data.firma2_usuario_id || null,
      firma2Cargo,
    });

    const items = Array.isArray(data.items) ? data.items : [];
    for (const item of items) {
      // El precio no se captura en la solicitud inicial: a esta altura todavía no hay proveedor ni
      // cotización. La columna es NOT NULL, así que se guarda en 0; al adjudicar la cotización se
      // actualiza el monto del expediente (ver cotizaciones.service.adjudicarCotizacion).
      await expedientes.insertItem(tx, creado.id_expediente, {
        ...item,
        costo_unitario_estimado: item.costo_unitario_estimado ?? 0,
      });
    }

    await bitacora.insert(tx, {
      idExpediente: creado.id_expediente,
      usuarioId: usuarioSolicitanteId,
      accion: "Expediente creado",
      entidadRelacionada: "expedientes",
      observacion: `Solicitud de compra registrada con código ${creado.codigo_expediente}.`,
    });

    // Le toca recibirla a alguien con el perfil de Jefe de Adquisiciones.
    await enrutar(tx, { idExpediente: creado.id_expediente, actorId: usuarioSolicitanteId });

    return creado.id_expediente;
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * Cambia el analista que lleva el expediente (reasignación manual; lo normal es que "Recibir y turnar" lo
 * asigne solo). Si el expediente apenas se recibió, pasa a cotización. A quién le toca el paso lo resuelve
 * el enrutamiento: si es un paso de analista, es el analista elegido.
 */
async function asignarExpediente(idExpediente, idUsuarioAsignado, usuarioIdActor) {
  const usuarioAsignado = await exigirUsuarioDelModulo(
    idUsuarioAsignado,
    "El usuario seleccionado no pertenece al módulo de Adquisiciones."
  );
  const nombreAsignado = usuarioAsignado.nombre_completo || usuarioAsignado.email;

  await adquisicionesDb.transaction(async (tx) => {
    const situacion = await expedientes.findSituacion(tx, idExpediente);
    if (!situacion) throw new NotFoundError("Expediente no encontrado.");

    await expedientes.setAnalista(tx, idExpediente, usuarioAsignado.id_usuario);
    if (situacion.estado === ESTADO_EXPEDIENTE.RECIBIDA) {
      await avanzarEstado(tx, idExpediente, ESTADO_EXPEDIENTE.PENDIENTE_COTIZACION);
    }

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId: usuarioIdActor,
      accion: "Expediente asignado",
      entidadRelacionada: "expedientes",
      observacion: `Asignado a: ${nombreAsignado}`,
    });

    await enrutar(tx, { idExpediente, actorId: usuarioIdActor });
  });

  return getExpedienteDetalle(idExpediente);
}

/**
 * Recibir la solicitud en Adquisiciones y turnarla a un analista: el sistema elige al analista (el que
 * menos expedientes abiertos tiene), pasa el expediente a cotización y se lo asigna, en un solo paso.
 */
async function turnarExpediente(idExpediente, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    const situacion = await expedientes.findSituacion(tx, idExpediente);
    if (!situacion) throw new NotFoundError("Expediente no encontrado.");
    if (situacion.estado !== ESTADO_EXPEDIENTE.RECIBIDA) {
      throw new ConflictError("Este expediente ya fue recibido y turnado.");
    }

    const analista = await elegirParaPerfil(tx, PERFIL.ANALISTA, { preferidoId: situacion.analista_usuario_id });
    if (!analista) {
      throw new ConflictError(`No hay ningún usuario con el perfil «${PERFIL.ANALISTA}» para turnar el expediente.`);
    }

    await expedientes.setAnalista(tx, idExpediente, analista.id);
    await avanzarEstado(tx, idExpediente, ESTADO_EXPEDIENTE.PENDIENTE_COTIZACION);

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: "Expediente recibido y turnado",
      entidadRelacionada: "expedientes",
      observacion: `Turnado a: ${analista.nombre}`,
    });

    await enrutar(tx, { idExpediente, actorId: usuarioId });
  });

  return getExpedienteDetalle(idExpediente);
}

/** Transición de estado genérica (uso administrativo), con registro en bitácora. */
async function cambiarEstado(idExpediente, nuevoEstadoId, comentario, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    const nombreEstado = await catalogos.findEstadoNombrePorId(tx, nuevoEstadoId);
    if (!nombreEstado) throw new ValidationError("El estado especificado no existe.");

    const actualizado = await expedientes.setEstadoExacto(tx, idExpediente, nuevoEstadoId);
    if (!actualizado) throw new NotFoundError("Expediente no encontrado.");

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: `Cambio de estado a "${nombreEstado}"`,
      entidadRelacionada: "expedientes",
      observacion: comentario || null,
    });

    await enrutar(tx, { idExpediente, actorId: usuarioId });
  });

  return getExpedienteDetalle(idExpediente);
}

/** Flujos A1/A2 (SCR-10): devolución con observaciones. */
async function devolverExpediente(idExpediente, data, usuarioId) {
  await adquisicionesDb.transaction(async (tx) => {
    const idEstadoDevuelto = await catalogos.findEstadoIdPorNombre(tx, ESTADO_EXPEDIENTE.DEVUELTO);
    await expedientes.setEstado(tx, idExpediente, idEstadoDevuelto);

    const dias = data.plazo_subsanacion_dias ? parseInt(data.plazo_subsanacion_dias, 10) : null;
    await devoluciones.insert(tx, {
      idExpediente,
      etapaOrigen: data.etapa_origen,
      motivo: data.motivo,
      descripcion: data.descripcion,
      usuarioRevisorId: usuarioId,
      plazoSubsanacionDias: Number.isNaN(dias) ? null : dias,
    });

    await notificaciones.registrarDevolucion(tx, { idExpediente, actorId: usuarioId, motivo: data.motivo });

    await bitacora.insert(tx, {
      idExpediente,
      usuarioId,
      accion: "Expediente devuelto con observaciones",
      entidadRelacionada: "devoluciones_observaciones",
      observacion: data.motivo,
    });

    // Le toca al solicitante subsanar; el aviso de la devolución ya salió.
    await enrutar(tx, { idExpediente, actorId: usuarioId, avisar: false });
  });

  return getExpedienteDetalle(idExpediente);
}

module.exports = {
  listarExpedientes,
  getExpedientePorId,
  crearExpediente,
  asignarExpediente,
  turnarExpediente,
  cambiarEstado,
  devolverExpediente,
};
