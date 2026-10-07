// Personas que intervienen en un expediente. La BD del módulo solo guarda `id_usuario`; el
// nombre vive en db_global_users, así que el detalle del expediente se "enriquece" con una sola
// consulta cruzada. Aquí está qué campos de cada bloque son personas y cómo se aplican los
// nombres (lógica pura, sin I/O).
const { nombreOFallback } = require("./nombres-usuarios");

// bloque del expediente -> { campo con el id de usuario: campo donde se escribe su nombre }
const ACTORES_POR_BLOQUE = {
  cdp: {
    elaborado_por_usuario_id: "elaborado_por_nombre",
    aprobado_presupuesto_usuario_id: "aprobado_presupuesto_nombre",
    vobo_udaf_usuario_id: "vobo_udaf_nombre",
  },
  orden_compra: {
    elaborado_por_usuario_id: "elaborado_por_nombre",
    aprobado_jefe_usuario_id: "aprobado_jefe_nombre",
    autorizado_directora_usuario_id: "autorizado_directora_nombre",
  },
  recepcion: {
    tecnico_receptor_usuario_id: "tecnico_receptor_nombre",
    custodio_almacen_usuario_id: "custodio_almacen_nombre",
  },
  compromiso: { registrado_por_usuario_id: "registrado_por_nombre" },
  devengado: { registrado_por_usuario_id: "registrado_por_nombre" },
  solicitud_pago: {
    solicitado_por_usuario_id: "solicitado_por_nombre",
    tramitado_por_usuario_id: "tramitado_por_nombre",
  },
};

// Cada documento de soporte del arreglo `documentos_soporte`.
const ACTORES_DOCUMENTO = { subido_por_usuario_id: "subido_por_nombre" };

/** Ids de todos los usuarios que aparecen en el expediente (sin repetir). */
function idsDeActores(expediente) {
  const ids = [expediente.usuario_solicitante_id];
  if (expediente.firma2_usuario_id) ids.push(expediente.firma2_usuario_id);
  if (expediente.funcionario_responsable_id) ids.push(expediente.funcionario_responsable_id);
  if (expediente.analista_usuario_id) ids.push(expediente.analista_usuario_id);

  for (const [bloque, campos] of Object.entries(ACTORES_POR_BLOQUE)) {
    if (!expediente[bloque]) continue;
    for (const campo of Object.keys(campos)) {
      if (expediente[bloque][campo]) ids.push(expediente[bloque][campo]);
    }
  }
  for (const documento of expediente.documentos_soporte || []) {
    for (const campo of Object.keys(ACTORES_DOCUMENTO)) {
      if (documento[campo]) ids.push(documento[campo]);
    }
  }
  return [...new Set(ids)];
}

function nombreDe(nombrePorId, idUsuario) {
  return idUsuario ? nombreOFallback(nombrePorId, idUsuario) : null;
}

function anexarNombres(objeto, campos, nombrePorId) {
  for (const [campoId, campoNombre] of Object.entries(campos)) {
    objeto[campoNombre] = nombreDe(nombrePorId, objeto[campoId]);
  }
}

/** Agrega al expediente los campos `*_nombre` correspondientes a cada `*_usuario_id`. */
function anexarNombresDeActores(expediente, nombrePorId) {
  expediente.usuario_solicitante_nombre = nombreOFallback(nombrePorId, expediente.usuario_solicitante_id);
  expediente.firma2_usuario_nombre = nombreDe(nombrePorId, expediente.firma2_usuario_id);
  // Quién tiene el expediente hoy y el analista que lo lleva (el texto `funcionario_responsable` es del solicitante).
  expediente.responsable_actual_nombre = nombreDe(nombrePorId, expediente.funcionario_responsable_id);
  expediente.analista_nombre = nombreDe(nombrePorId, expediente.analista_usuario_id);

  for (const [bloque, campos] of Object.entries(ACTORES_POR_BLOQUE)) {
    if (expediente[bloque]) anexarNombres(expediente[bloque], campos, nombrePorId);
  }
  for (const documento of expediente.documentos_soporte || []) {
    anexarNombres(documento, ACTORES_DOCUMENTO, nombrePorId);
  }
  return expediente;
}

module.exports = { idsDeActores, anexarNombresDeActores };
