// Avisos del trámite: un aviso dentro del sistema (la "campana") y un correo para el solicitante y
// para quien tiene el expediente cuando cambia de etapa, le toca a otra persona o se devuelve.
//
// El aviso dentro del sistema se guarda en la MISMA transacción del cambio que lo origina (si el
// cambio se revierte, el aviso también). El correo se arma y se envía después del commit con la cola
// del core (services/email.service.js, variables MAIL_*) y un fallo del correo nunca rompe el trámite.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const emailService = require("../email.service");
const expedientes = require("./repositories/expedientes.repository");
const notificaciones = require("./repositories/notificaciones.repository");
const usuarios = require("./repositories/usuarios.repository");
const { planificarDevolucion, planificarMovimiento } = require("./domain/notificaciones");
const { redactarCorreo, marcarComoPrueba } = require("./domain/plantilla-correo");
const { nombreOFallback } = require("./domain/nombres-usuarios");
const { NotFoundError } = require("./errors");

// Solo para pruebas: si ADQUISICIONES_CORREO_REDIRIGIR_A trae una o más direcciones (separadas por coma), TODOS los
// correos del módulo salen hacia ahí en vez de a sus destinatarios, marcados con el nombre de a quién iban.
// Nunca se define en producción; en local va en docker-compose.override.yml (que no se sube).
const redirigirA = () => (process.env.ADQUISICIONES_CORREO_REDIRIGIR_A || "").trim();

const urlExpediente = (idExpediente) => {
  const base = (process.env.ADQUISICIONES_APP_URL || "").trim().replace(/\/+$/, "");
  return base ? `${base}/expedientes/${idExpediente}` : null;
};

/**
 * ¿El estado acaba de cambiar en esta transacción? Entonces la entrada anterior del historial es el
 * estado del que viene y se sabe cuánto tiempo estuvo ahí.
 */
async function detalleDelCambio(tx, idExpediente) {
  const [ultima, anterior] = await expedientes.findUltimasEntradasDeEstado(tx, idExpediente, 2);
  const cambioElEstado = Boolean(ultima?.en_esta_transaccion && anterior);
  return {
    estadoAnterior: cambioElEstado ? anterior.estado : undefined,
    colorAnterior: cambioElEstado ? anterior.color : undefined,
    tiempoEnEstadoAnteriorMs: cambioElEstado ? new Date(ultima.ahora) - new Date(anterior.fecha_entrada) : undefined,
    ocurrioEn: ultima?.ahora || new Date().toISOString(),
  };
}

const datosDelExpediente = (resumen) => ({
  codigo_expediente: resumen.codigo_expediente,
  objeto_compra: resumen.objeto_compra,
  solicitanteId: resumen.usuario_solicitante_id,
  responsableId: resumen.funcionario_responsable_id,
});

/** Guarda los avisos en la transacción y programa sus correos para después del commit. */
async function guardarYProgramar(tx, avisos, { idExpediente, actorId, detalle }) {
  if (avisos.length === 0) return;
  const guardados = [];
  for (const aviso of avisos) {
    const fila = await notificaciones.insert(tx, { ...aviso, idExpediente });
    guardados.push({ ...fila, evento: aviso.evento });
  }
  tx.afterCommit(() => enviarCorreos(guardados, { idExpediente, actorId, detalle }));
}

/** Avisos de una devolución con observaciones (al solicitante y a quien tenía el expediente). */
async function registrarDevolucion(tx, { idExpediente, actorId, motivo }) {
  const resumen = await expedientes.findResumenParaAvisos(tx, idExpediente);
  if (!resumen) return;
  const detalle = { ...(await detalleDelCambio(tx, idExpediente)), motivo };
  const avisos = planificarDevolucion({ expediente: datosDelExpediente(resumen), motivo });
  await guardarYProgramar(tx, avisos, { idExpediente, actorId, detalle });
}

/**
 * Avisos de un movimiento del trámite: a quien le toca el paso (`nuevoResponsable`, si cambió) y, si
 * el estado cambió en esta transacción, al solicitante.
 */
async function registrarMovimiento(tx, { idExpediente, actorId, paso, nuevoResponsable }) {
  const resumen = await expedientes.findResumenParaAvisos(tx, idExpediente);
  if (!resumen) return;
  const contexto = await expedientes.findContextoParaCorreo(tx, idExpediente);
  const detalle = {
    ...(await detalleDelCambio(tx, idExpediente)),
    pasoTitulo: paso?.titulo,
    responsableNombre: nuevoResponsable?.nombre,
  };
  const avisos = planificarMovimiento({
    expediente: datosDelExpediente(resumen),
    estado: contexto.estado,
    estadoAnterior: detalle.estadoAnterior,
    paso,
    nuevoResponsable,
  });
  await guardarYProgramar(tx, avisos, { idExpediente, actorId, detalle });
}

/** Datos ya resueltos (nombres, unidad, estado) para llenar la plantilla del correo. */
async function contextoDelCorreo(idExpediente, actorId) {
  const ctx = await expedientes.findContextoParaCorreo(adquisicionesDb, idExpediente);
  const ids = [ctx.usuario_solicitante_id, ctx.funcionario_responsable_id, actorId].filter((id) => id != null);
  const nombrePorId = await usuarios.findNombresPorId([...new Set(ids)]);
  const nombreDe = (id) => (id == null ? "" : nombreOFallback(nombrePorId, id));

  return {
    nombreDe,
    solicitanteId: ctx.usuario_solicitante_id,
    realizadoPor: nombreDe(actorId),
    expediente: {
      codigo: ctx.codigo_expediente,
      objeto: ctx.objeto_compra,
      unidad: ctx.unidad,
      solicitante: nombreDe(ctx.usuario_solicitante_id),
      asignadoA: nombreDe(ctx.funcionario_responsable_id),
      estado: ctx.estado,
      etapa: ctx.etapa,
      color: ctx.color,
      tipoCompra: ctx.tipo_compra,
      montoEstimado: ctx.monto_estimado,
    },
  };
}

/** Envía el correo de cada aviso y deja anotado cómo salió. No lanza errores. */
async function enviarCorreos(avisos, { idExpediente, actorId, detalle }) {
  const contactos = await usuarios.findContactoPorIds(
    [...new Set(avisos.map((aviso) => aviso.id_usuario))],
    { soloActivos: true }
  );
  const emailPorId = Object.fromEntries(contactos.map((u) => [u.id_usuario, (u.email || "").trim()]));
  let contexto;
  try {
    contexto = await contextoDelCorreo(idExpediente, actorId);
  } catch (error) {
    console.error(`No se pudieron reunir los datos del correo del expediente ${idExpediente}:`, error.message);
    for (const aviso of avisos) {
      await notificaciones.setCorreoEstado(adquisicionesDb, aviso.id_notificacion, "error");
    }
    return;
  }

  for (const aviso of avisos) {
    const destino = emailPorId[aviso.id_usuario];
    const desvio = redirigirA();
    let estado;
    try {
      if (!destino && !desvio) {
        estado = "sin_correo";
      } else if (!process.env.MAIL_HOST) {
        estado = "sin_smtp";
      } else {
        let correo = redactarCorreo({
          tipo: aviso.tipo,
          evento: aviso.evento,
          rol: aviso.id_usuario === contexto.solicitanteId ? "solicitante" : "asignado",
          titulo: aviso.titulo,
          expediente: contexto.expediente,
          detalle: { ...detalle, realizadoPor: contexto.realizadoPor },
          urlExpediente: urlExpediente(idExpediente),
        });
        if (desvio) correo = marcarComoPrueba(correo, { para: destino ? `${contexto.nombreDe(aviso.id_usuario)} (${destino})` : contexto.nombreDe(aviso.id_usuario) || `usuario ${aviso.id_usuario}` });
        await emailService.sendEmail(desvio || destino, correo.asunto, correo.html, correo.texto);
        estado = "encolado";
      }
    } catch (error) {
      console.error(`No se pudo encolar el correo del aviso ${aviso.id_notificacion}:`, error.message);
      estado = "error";
    }
    // Queda en el log del API para poder ver, sin entrar a la base, qué pasó con cada correo.
    console.log(`Aviso ${aviso.id_notificacion} (${aviso.tipo}, expediente ${idExpediente}) -> ${desvio ? `${desvio} (prueba; era para ${destino || "usuario sin correo"})` : destino || "sin correo registrado"}: ${estado}`);
    try {
      await notificaciones.setCorreoEstado(adquisicionesDb, aviso.id_notificacion, estado);
    } catch (error) {
      console.error(`No se pudo anotar el estado del correo del aviso ${aviso.id_notificacion}:`, error.message);
    }
  }
}

/** Avisos de la persona (más recientes primero) con el total sin leer. */
async function listarMias(idUsuario, { soloNoLeidas = false, limite = 30 } = {}) {
  const [items, noLeidas] = await Promise.all([
    notificaciones.listByUsuario(adquisicionesDb, idUsuario, { soloNoLeidas, limite }),
    notificaciones.contarNoLeidas(adquisicionesDb, idUsuario),
  ]);
  return { items, no_leidas: noLeidas };
}

async function marcarLeida(idNotificacion, idUsuario) {
  const existe = await notificaciones.marcarLeida(adquisicionesDb, idNotificacion, idUsuario);
  if (!existe) throw new NotFoundError("Aviso no encontrado.");
  return { ok: true };
}

async function marcarTodasLeidas(idUsuario) {
  return { marcadas: await notificaciones.marcarTodasLeidas(adquisicionesDb, idUsuario) };
}

module.exports = { registrarDevolucion, registrarMovimiento, listarMias, marcarLeida, marcarTodasLeidas };
