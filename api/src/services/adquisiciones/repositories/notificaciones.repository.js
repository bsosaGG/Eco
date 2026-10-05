// Tabla `notificaciones`: avisos dentro del sistema (la "campana") y estado del correo asociado.

async function insert(db, { idUsuario, idExpediente, tipo, titulo, mensaje }) {
  const { rows } = await db.query(
    `INSERT INTO notificaciones (id_usuario, id_expediente, tipo, titulo, mensaje)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_notificacion, id_usuario, id_expediente, tipo, titulo, mensaje`,
    [idUsuario, idExpediente, tipo, titulo, mensaje]
  );
  return rows[0];
}

/** Avisos del usuario, los más recientes primero. */
async function listByUsuario(db, idUsuario, { soloNoLeidas = false, limite = 30 } = {}) {
  const { rows } = await db.query(
    `SELECT n.id_notificacion, n.id_expediente, e.codigo_expediente, n.tipo, n.titulo, n.mensaje,
            n.leida, n.fecha_creacion, n.fecha_lectura
     FROM notificaciones n
     LEFT JOIN expedientes e ON e.id_expediente = n.id_expediente
     WHERE n.id_usuario = $1${soloNoLeidas ? " AND n.leida = FALSE" : ""}
     ORDER BY n.id_notificacion DESC
     LIMIT $2`,
    [idUsuario, limite]
  );
  return rows;
}

async function contarNoLeidas(db, idUsuario) {
  const { rows } = await db.query(
    "SELECT COUNT(*)::int AS total FROM notificaciones WHERE id_usuario = $1 AND leida = FALSE",
    [idUsuario]
  );
  return rows[0].total;
}

/** Marca un aviso como leído; solo si es del usuario. Devuelve false si no existe o es de otra persona. */
async function marcarLeida(db, idNotificacion, idUsuario) {
  const { rows } = await db.query(
    `UPDATE notificaciones
     SET leida = TRUE, fecha_lectura = COALESCE(fecha_lectura, CURRENT_TIMESTAMP)
     WHERE id_notificacion = $1 AND id_usuario = $2
     RETURNING id_notificacion`,
    [idNotificacion, idUsuario]
  );
  return rows.length > 0;
}

async function marcarTodasLeidas(db, idUsuario) {
  const { rows } = await db.query(
    `UPDATE notificaciones
     SET leida = TRUE, fecha_lectura = CURRENT_TIMESTAMP
     WHERE id_usuario = $1 AND leida = FALSE
     RETURNING id_notificacion`,
    [idUsuario]
  );
  return rows.length;
}

async function setCorreoEstado(db, idNotificacion, estado) {
  await db.query("UPDATE notificaciones SET correo_estado = $1 WHERE id_notificacion = $2", [estado, idNotificacion]);
}

module.exports = { insert, listByUsuario, contarNoLeidas, marcarLeida, marcarTodasLeidas, setCorreoEstado };
