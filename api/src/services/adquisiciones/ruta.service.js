// Enrutamiento automático del expediente: después de cada paso del trámite se calcula qué sigue y a qué
// perfil le toca (domain/siguiente-paso.js) y el expediente pasa solo a una persona con ese perfil. Así
// no hay que elegir a nadie a mano ni cambiar el estado por separado: cada paso deja el expediente en
// manos de quien debe hacer el siguiente, y eso es lo que se ve en el seguimiento.
//
// Reglas para elegir a la persona:
//  1. En un expediente devuelto le toca a quien emitió la solicitud.
//  2. En los pasos de analista le toca al analista que lleva el expediente de principio a fin.
//  3. Si ya lo tiene alguien con el perfil del paso, sigue con esa persona (no se reparte de más).
//  4. Si no, entre quienes tienen el perfil, a quien menos expedientes abiertos tiene (empate: el más
//     antiguo). Si nadie tiene el perfil, el expediente queda sin responsable y el siguiente paso lo dice.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const expedientes = require("./repositories/expedientes.repository");
const usuarios = require("./repositories/usuarios.repository");
const notificaciones = require("./notificaciones.service");
const { siguientePaso, PERFIL, TIPO } = require("./domain/siguiente-paso");
const { nombreOFallback } = require("./domain/nombres-usuarios");

const comoResponsable = (usuario) => ({ id: usuario.id_usuario, nombre: usuario.nombre_completo || usuario.email });

/**
 * Persona a quien asignar un paso del perfil indicado: la preferida (elegida a mano o el analista del
 * expediente), la que ya lo tiene con ese perfil (`actualId`) o la que menos expedientes abiertos tiene.
 * null si nadie tiene el perfil.
 */
async function elegirParaPerfil(db, perfil, { preferidoId, actualId } = {}) {
  // Una persona elegida a mano (o el analista que ya lleva el expediente) se respeta mientras siga activa.
  if (preferidoId) {
    const [elegida] = await usuarios.findContactoPorIds([preferidoId], { soloActivos: true });
    if (elegida) return comoResponsable(elegida);
  }

  const candidatos = await usuarios.listPorPerfil(perfil);
  if (candidatos.length === 0) return null;

  const actual = actualId && candidatos.find((u) => u.id_usuario === actualId);
  if (actual) return comoResponsable(actual);

  const cargas = await expedientes.contarAbiertosPorResponsable(db, candidatos.map((u) => u.id_usuario));
  const [elegido] = [...candidatos].sort(
    (a, b) => (cargas[a.id_usuario] || 0) - (cargas[b.id_usuario] || 0) || a.id_usuario - b.id_usuario
  );
  return comoResponsable(elegido);
}

/** A quién le toca el paso: { id, nombre }, null (nadie tiene el perfil) o undefined (no cambia). */
async function responsableParaPaso(tx, situacion, paso) {
  if (paso.tipo === TIPO.DEVUELTO) {
    const nombres = await usuarios.findNombresPorId([situacion.usuario_solicitante_id]);
    return { id: situacion.usuario_solicitante_id, nombre: nombreOFallback(nombres, situacion.usuario_solicitante_id) };
  }
  if (paso.tipo !== TIPO.PENDIENTE) return undefined;

  return elegirParaPerfil(tx, paso.perfil, {
    preferidoId: paso.perfil === PERFIL.ANALISTA ? situacion.analista_usuario_id : undefined,
    actualId: situacion.funcionario_responsable_id,
  });
}

/**
 * Deja el expediente en manos de quien debe hacer el siguiente paso. Se llama al final de cada caso de
 * uso, dentro de su transacción. Avisa a la nueva persona y, si el estado cambió, al solicitante
 * (`avisar: false` cuando el propio caso de uso ya avisó, como en una devolución).
 */
async function enrutar(tx, { idExpediente, actorId, avisar = true }) {
  const situacion = await expedientes.findSituacion(tx, idExpediente);
  if (!situacion) return;

  const paso = siguientePaso(situacion);
  const destino = paso ? await responsableParaPaso(tx, situacion, paso) : undefined;

  let nuevoResponsable;
  if (destino !== undefined) {
    const idNuevo = destino ? destino.id : null;
    if (idNuevo !== (situacion.funcionario_responsable_id ?? null)) {
      await expedientes.setResponsable(tx, idExpediente, idNuevo);
      nuevoResponsable = destino || undefined;
    }
    // El primer analista que toca el expediente queda como su analista hasta el final.
    if (paso.perfil === PERFIL.ANALISTA && destino && !situacion.analista_usuario_id) {
      await expedientes.setAnalista(tx, idExpediente, destino.id);
    }
  }

  if (avisar) await notificaciones.registrarMovimiento(tx, { idExpediente, actorId, paso, nuevoResponsable });
}

module.exports = { enrutar, elegirParaPerfil };
