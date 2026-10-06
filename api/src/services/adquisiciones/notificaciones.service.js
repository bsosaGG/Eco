// Avisos del trámite: un aviso dentro del sistema (la "campana") y un correo para el solicitante y la
// persona asignada cuando el expediente cambia de etapa, se asigna o se devuelve.
//
// El aviso dentro del sistema se guarda en la MISMA transacción del cambio que lo origina (si el
// cambio se revierte, el aviso también). El correo se envía después del commit con la cola del core
// (services/email.service.js, variables MAIL_*) y un fallo del correo nunca rompe el trámite.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const emailService = require("../email.service");
const expedientes = require("./repositories/expedientes.repository");
const notificaciones = require("./repositories/notificaciones.repository");
const usuarios = require("./repositories/usuarios.repository");
const { planificarNotificaciones, redactarCorreo } = require("./domain/notificaciones");
const { NotFoundError } = require("./errors");

const urlExpediente = (idExpediente) => {
  const base = (process.env.ADQUISICIONES_APP_URL || "").trim().replace(/\/+$/, "");
  return base ? `${base}/expedientes/${idExpediente}` : null;
};

/**
 * Registra los avisos de un evento dentro de la transacción `tx` y programa sus correos para
 * después del commit. `evento` y sus datos: ver domain/notificaciones.planificarNotificaciones.
 */
async function registrar(tx, { evento, idExpediente, actorId, ...datos }) {
  const resumen = await expedientes.findResumenParaAvisos(tx, idExpediente);
  if (!resumen) return;

  const avisos = planificarNotificaciones({
    evento,
    actorId,
    expediente: {
      codigo_expediente: resumen.codigo_expediente,
      objeto_compra: resumen.objeto_compra,
      solicitanteId: resumen.usuario_solicitante_id,
      responsableId: resumen.funcionario_responsable_id,
    },
    ...datos,
  });
  if (avisos.length === 0) return;

  const guardados = [];
  for (const aviso of avisos) {
    guardados.push(await notificaciones.insert(tx, { ...aviso, idExpediente }));
  }
  tx.afterCommit(() => enviarCorreos(guardados, resumen.codigo_expediente));
}

/** Envía el correo de cada aviso y deja anotado cómo salió. No lanza errores. */
async function enviarCorreos(avisos, codigoExpediente) {
  const contactos = await usuarios.findContactoPorIds(
    [...new Set(avisos.map((aviso) => aviso.id_usuario))],
    { soloActivos: true }
  );
  const emailPorId = Object.fromEntries(contactos.map((u) => [u.id_usuario, (u.email || "").trim()]));

  for (const aviso of avisos) {
    let estado;
    try {
      const destino = emailPorId[aviso.id_usuario];
      if (!destino) {
        estado = "sin_correo";
      } else if (!process.env.MAIL_HOST) {
        estado = "sin_smtp";
      } else {
        const correo = redactarCorreo({
          titulo: aviso.titulo,
          mensaje: aviso.mensaje,
          codigoExpediente,
          urlExpediente: urlExpediente(aviso.id_expediente),
        });
        await emailService.sendEmail(destino, correo.asunto, correo.html, correo.texto);
        estado = "encolado";
      }
    } catch (error) {
      console.error(`No se pudo encolar el correo del aviso ${aviso.id_notificacion}:`, error.message);
      estado = "error";
    }
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

module.exports = { registrar, listarMias, marcarLeida, marcarTodasLeidas };
