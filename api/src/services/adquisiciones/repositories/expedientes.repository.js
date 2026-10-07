// Tablas `expedientes` y `expediente_items`. Todas las funciones reciben `db` (adquisicionesDb o la
// transacción `tx`) con `.query`.
const detalleQuery = require("./expediente-detalle.query");

const POR_ID = detalleQuery("e.id_expediente = $1::int");
const POR_CODIGO = detalleQuery("e.codigo_expediente = $1::text");

/**
 * Fila del expediente con todo su trámite embebido; undefined si no existe. Se busca por id cuando
 * el valor es numérico y por código (p. ej. "UA-1-2026") en cualquier otro caso.
 */
async function findDetalle(db, idOCodigo) {
  const esId = /^[0-9]+$/.test(String(idOCodigo));
  const { rows } = await db.query(esId ? POR_ID : POR_CODIGO, [idOCodigo]);
  return rows[0];
}

/** Listado paginado con filtros opcionales por estado, unidad y texto; `participanteId` limita a lo que esa persona emitió o le toca. */
async function list(db, { limit = 20, offset = 0, estado, unidad, search, participanteId }) {
  let query = `
      SELECT
        e.id_expediente, e.codigo_expediente, e.objeto_compra, e.monto_estimado,
        e.fecha_creacion, e.fecha_actualizacion,
        CURRENT_TIMESTAMP AS servidor_ahora,
        (
          SELECT h.fecha_entrada FROM historial_estados h
          WHERE h.id_expediente = e.id_expediente
          ORDER BY h.fecha_entrada DESC, h.id_historial DESC LIMIT 1
        ) AS en_estado_desde,
        u.nombre AS unidad_solicitante,
        est.nombre AS estado, est.color AS estado_color, est.etapa AS estado_etapa, est.es_final
      FROM expedientes e
      JOIN unidades_solicitantes u ON e.id_unidad_solicitante = u.id_unidad
      JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
    `;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (estado) {
    conditions.push(`e.id_estado_actual = $${paramIndex++}`);
    values.push(estado);
  }
  if (unidad) {
    conditions.push(`e.id_unidad_solicitante = $${paramIndex++}`);
    values.push(unidad);
  }
  if (participanteId != null) {
    conditions.push(`(e.usuario_solicitante_id = $${paramIndex} OR e.funcionario_responsable_id = $${paramIndex})`);
    paramIndex += 1;
    values.push(participanteId);
  }
  if (search) {
    conditions.push(`(e.objeto_compra ILIKE $${paramIndex++} OR e.codigo_expediente ILIKE $${paramIndex++})`);
    values.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += ` ORDER BY e.id_expediente DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  values.push(limit, offset);

  const { rows } = await db.query(query, values);
  return rows;
}

/** Lo mínimo para redactar los avisos: código, objeto, solicitante y responsable asignado. */
async function findResumenParaAvisos(db, idExpediente) {
  const { rows } = await db.query(
    `SELECT codigo_expediente, objeto_compra, usuario_solicitante_id, funcionario_responsable_id
     FROM expedientes WHERE id_expediente = $1`,
    [idExpediente]
  );
  return rows[0];
}

/** Datos del expediente para redactar el correo: objeto, unidad, estado actual, monto, tipo. */
async function findContextoParaCorreo(db, idExpediente) {
  const { rows } = await db.query(
    `SELECT e.codigo_expediente, e.objeto_compra, e.monto_estimado, e.tipo_compra,
            e.usuario_solicitante_id, e.funcionario_responsable_id,
            u.nombre AS unidad, est.nombre AS estado, est.etapa, est.color
     FROM expedientes e
     JOIN unidades_solicitantes u ON e.id_unidad_solicitante = u.id_unidad
     JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
     WHERE e.id_expediente = $1`,
    [idExpediente]
  );
  return rows[0];
}

/**
 * Las últimas entradas del historial de estados (la más reciente primero). `en_esta_transaccion`
 * indica si la entrada se registró en la transacción en curso, es decir, si el estado acaba de cambiar.
 */
async function findUltimasEntradasDeEstado(db, idExpediente, limite = 2) {
  const { rows } = await db.query(
    `SELECT es.nombre AS estado, es.color, h.fecha_entrada, CURRENT_TIMESTAMP AS ahora,
            (h.fecha_entrada = CURRENT_TIMESTAMP) AS en_esta_transaccion
     FROM historial_estados h
     JOIN estados_expediente es ON es.id_estado = h.id_estado
     WHERE h.id_expediente = $1
     ORDER BY h.fecha_entrada DESC, h.id_historial DESC
     LIMIT $2`,
    [idExpediente, limite]
  );
  return rows;
}

/**
 * Lo que hace falta para saber qué sigue en el trámite (ver domain/siguiente-paso.js) y quién lo
 * tiene hoy. undefined si el expediente no existe.
 */
async function findSituacion(db, idExpediente) {
  const { rows } = await db.query(
    `SELECT est.nombre AS estado, est.es_final,
            e.usuario_solicitante_id, e.funcionario_responsable_id, e.analista_usuario_id,
            (SELECT cd.estado FROM cdp cd WHERE cd.id_expediente = e.id_expediente) AS cdp_estado,
            EXISTS (SELECT 1 FROM recepciones rc JOIN ordenes_compra oc ON rc.id_orden_compra = oc.id_orden_compra
                    WHERE oc.id_expediente = e.id_expediente) AS tiene_recepcion,
            COALESCE((SELECT rc.recibido_conforme FROM recepciones rc JOIN ordenes_compra oc ON rc.id_orden_compra = oc.id_orden_compra
                      WHERE oc.id_expediente = e.id_expediente), FALSE) AS recepcion_conforme,
            (SELECT COUNT(*)::int FROM documentos_soporte ds WHERE ds.id_expediente = e.id_expediente) AS documentos,
            EXISTS (SELECT 1 FROM compromisos_presupuestarios cp WHERE cp.id_expediente = e.id_expediente) AS tiene_compromiso,
            EXISTS (SELECT 1 FROM devengados dv JOIN compromisos_presupuestarios cp ON dv.id_compromiso = cp.id_compromiso
                    WHERE cp.id_expediente = e.id_expediente) AS tiene_devengado,
            (SELECT sp.estado FROM solicitudes_pago sp
               JOIN devengados dv ON sp.id_devengado = dv.id_devengado
               JOIN compromisos_presupuestarios cp ON dv.id_compromiso = cp.id_compromiso
             WHERE cp.id_expediente = e.id_expediente) AS solicitud_pago_estado
     FROM expedientes e
     JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
     WHERE e.id_expediente = $1`,
    [idExpediente]
  );
  return rows[0];
}

/**
 * Quién tiene el expediente en el paso actual (null si no hay nadie con el perfil que toca). Solo se guarda el
 * id: el nombre se resuelve al mostrarlo. La columna de texto `funcionario_responsable` NO se toca, porque es
 * lo que escribió el solicitante y sale como cargo de la primera firma en el PDF.
 */
async function setResponsable(db, idExpediente, idUsuario) {
  await db.query(
    "UPDATE expedientes SET funcionario_responsable_id = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_expediente = $2",
    [idUsuario, idExpediente]
  );
}

/** El analista que lleva el expediente de principio a fin. Devuelve false si el expediente no existe. */
async function setAnalista(db, idExpediente, idUsuario) {
  const { rows } = await db.query(
    "UPDATE expedientes SET analista_usuario_id = $1 WHERE id_expediente = $2 RETURNING id_expediente",
    [idUsuario, idExpediente]
  );
  return rows.length > 0;
}

/** { id_usuario: cantidad } de expedientes abiertos (no finales) que tiene cada persona en este momento. */
async function contarAbiertosPorResponsable(db, idsUsuario) {
  const { rows } = await db.query(
    `SELECT e.funcionario_responsable_id AS id_usuario, COUNT(*)::int AS total
     FROM expedientes e
     JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
     WHERE est.es_final = FALSE AND e.funcionario_responsable_id = ANY($1::int[])
     GROUP BY e.funcionario_responsable_id`,
    [idsUsuario]
  );
  return Object.fromEntries(rows.map((fila) => [fila.id_usuario, fila.total]));
}

/** Id del estado en que está el expediente, o undefined si no existe. */
async function findIdEstadoActual(db, idExpediente) {
  const { rows } = await db.query("SELECT id_estado_actual FROM expedientes WHERE id_expediente = $1", [idExpediente]);
  return rows[0]?.id_estado_actual;
}

async function exists(db, idExpediente) {
  const { rows } = await db.query("SELECT id_expediente FROM expedientes WHERE id_expediente = $1", [idExpediente]);
  return rows.length > 0;
}

/** Id y nombre del estado actual; con `lock` toma el bloqueo de fila hasta terminar la transacción. */
async function findConEstado(db, idExpediente, { lock = false } = {}) {
  const { rows } = await db.query(
    `SELECT e.id_expediente, est.nombre AS estado
     FROM expedientes e
     JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
     WHERE e.id_expediente = $1${lock ? "\n     FOR UPDATE OF e" : ""}`,
    [idExpediente]
  );
  return rows[0];
}

async function insert(db, values) {
  const { rows } = await db.query(
    `INSERT INTO expedientes
       (codigo_expediente, id_unidad_solicitante, usuario_solicitante_id, funcionario_responsable,
        objeto_compra, justificacion, monto_estimado, modalidad, id_estado_actual, documento_especificaciones_url,
        tipo_compra, tiene_anexo, anexo_caracteristicas_tecnicas, anexo_especificaciones_especiales,
        firma2_usuario_id, firma2_cargo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING id_expediente, codigo_expediente`,
    [
      values.codigoExpediente,
      values.idUnidadSolicitante,
      values.usuarioSolicitanteId,
      values.funcionarioResponsable,
      values.objetoCompra,
      values.justificacion,
      values.montoEstimado,
      values.modalidad,
      values.idEstadoActual,
      values.documentoEspecificacionesUrl,
      values.tipoCompra,
      values.tieneAnexo,
      values.anexoCaracteristicasTecnicas,
      values.anexoEspecificacionesEspeciales,
      values.firma2UsuarioId,
      values.firma2Cargo,
    ]
  );
  return rows[0];
}

async function insertItem(db, idExpediente, item) {
  await db.query(
    `INSERT INTO expediente_items
       (id_expediente, descripcion, cantidad, unidad_medida, costo_unitario_estimado,
        codigo_insumo, id_renglon)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      idExpediente,
      item.descripcion,
      item.cantidad,
      item.unidad_medida,
      item.costo_unitario_estimado,
      item.codigo_insumo || null,
      item.id_renglon || null,
    ]
  );
}

/**
 * Avanza el expediente al estado indicado. Si `idEstado` es undefined (el estado no existe en el
 * catálogo) conserva el estado actual en vez de fallar.
 */
async function setEstado(db, idExpediente, idEstado) {
  await db.query(
    `UPDATE expedientes
     SET id_estado_actual = COALESCE($1, id_estado_actual), fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id_expediente = $2`,
    [idEstado, idExpediente]
  );
}

/** Fija el monto estimado del expediente (se calcula con la cotización adjudicada). */
async function setMontoEstimado(db, idExpediente, monto) {
  await db.query("UPDATE expedientes SET monto_estimado = $1 WHERE id_expediente = $2", [monto, idExpediente]);
}

/**
 * Si el expediente tiene un único renglón, su costo unitario es el monto adjudicado entre la
 * cantidad. Con varios renglones no hay forma de repartir un monto total, así que no se toca.
 */
async function setCostoUnitarioDeRenglonUnico(db, idExpediente, montoTotal) {
  await db.query(
    `UPDATE expediente_items
     SET costo_unitario_estimado = ROUND($1::numeric / cantidad, 2)
     WHERE id_expediente = $2
       AND cantidad > 0
       AND (SELECT COUNT(*) FROM expediente_items WHERE id_expediente = $2) = 1`,
    [montoTotal, idExpediente]
  );
}

/** Cambia el estado de forma exacta. Devuelve false si el expediente no existe. */
async function setEstadoExacto(db, idExpediente, idEstado) {
  const { rows } = await db.query(
    `UPDATE expedientes SET id_estado_actual = $1, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id_expediente = $2 RETURNING id_expediente`,
    [idEstado, idExpediente]
  );
  return rows.length > 0;
}

module.exports = {
  findDetalle,
  list,
  findResumenParaAvisos,
  findContextoParaCorreo,
  findUltimasEntradasDeEstado,
  findIdEstadoActual,
  findSituacion,
  setResponsable,
  setAnalista,
  contarAbiertosPorResponsable,
  exists,
  findConEstado,
  insert,
  insertItem,
  setEstado,
  setMontoEstimado,
  setCostoUnitarioDeRenglonUnico,
  setEstadoExacto,
};
