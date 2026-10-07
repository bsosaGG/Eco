// Fase financiera (CU-07/08/09): `compromisos_presupuestarios`, `devengados` y `solicitudes_pago`.
// Cada etapa es 1:1 con la anterior (expediente -> compromiso -> devengado -> solicitud de pago).

// --- Compromiso presupuestario (CU-07) ---

async function existsCompromisoPorExpediente(db, idExpediente) {
  const { rows } = await db.query("SELECT id_compromiso FROM compromisos_presupuestarios WHERE id_expediente = $1", [
    idExpediente,
  ]);
  return rows.length > 0;
}

async function findCompromiso(db, idCompromiso) {
  const { rows } = await db.query(
    "SELECT id_compromiso, id_expediente, monto_comprometido FROM compromisos_presupuestarios WHERE id_compromiso = $1",
    [idCompromiso]
  );
  return rows[0];
}

async function insertCompromiso(db, { idExpediente, numeroComp, montoComprometido, usuarioId, estado }) {
  await db.query(
    `INSERT INTO compromisos_presupuestarios
       (id_expediente, numero_comp, monto_comprometido, estado, registrado_por_usuario_id, fecha_registro)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
    [idExpediente, numeroComp, montoComprometido, estado, usuarioId]
  );
}

// --- Devengado (CU-08) ---

async function existsDevengadoPorCompromiso(db, idCompromiso) {
  const { rows } = await db.query("SELECT id_devengado FROM devengados WHERE id_compromiso = $1", [idCompromiso]);
  return rows.length > 0;
}

/** El devengado con el expediente al que pertenece (por su compromiso); undefined si no existe. */
async function findDevengadoConExpediente(db, idDevengado) {
  const { rows } = await db.query(
    `SELECT dv.id_devengado, cp.id_expediente
     FROM devengados dv
     JOIN compromisos_presupuestarios cp ON dv.id_compromiso = cp.id_compromiso
     WHERE dv.id_devengado = $1`,
    [idDevengado]
  );
  return rows[0];
}

async function insertDevengado(db, { idCompromiso, numeroDev, montoDevengado, retencionIsr, usuarioId, estado }) {
  await db.query(
    `INSERT INTO devengados
       (id_compromiso, numero_dev, monto_devengado, retencion_isr, estado, registrado_por_usuario_id, fecha_registro)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
    [idCompromiso, numeroDev, montoDevengado, retencionIsr, estado, usuarioId]
  );
}

// --- Solicitud de pago (CU-09) ---

async function existsSolicitudPagoPorDevengado(db, idDevengado) {
  const { rows } = await db.query("SELECT id_solicitud_pago FROM solicitudes_pago WHERE id_devengado = $1", [idDevengado]);
  return rows.length > 0;
}

/** La solicitud de pago con el expediente al que pertenece; undefined si no existe. */
async function findSolicitudPagoConExpediente(db, idSolicitudPago) {
  const { rows } = await db.query(
    `SELECT sp.id_solicitud_pago, sp.estado, cp.id_expediente
     FROM solicitudes_pago sp
     JOIN devengados dv ON sp.id_devengado = dv.id_devengado
     JOIN compromisos_presupuestarios cp ON dv.id_compromiso = cp.id_compromiso
     WHERE sp.id_solicitud_pago = $1`,
    [idSolicitudPago]
  );
  return rows[0];
}

async function insertSolicitudPago(db, { idDevengado, entidadBancaria, tipoCuenta, numeroCuenta, numeroTransferenciaCheque, usuarioId, estado }) {
  await db.query(
    `INSERT INTO solicitudes_pago
       (id_devengado, entidad_bancaria, tipo_cuenta, numero_cuenta, numero_transferencia_cheque,
        estado, solicitado_por_usuario_id, fecha_solicitud)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
    [idDevengado, entidadBancaria, tipoCuenta, numeroCuenta, numeroTransferenciaCheque || null, estado, usuarioId]
  );
}

/** Sub Despacho tramita el pago: la solicitud queda tramitada y archivada. */
async function marcarSolicitudPagoTramitada(db, { idSolicitudPago, usuarioId, estado }) {
  await db.query(
    `UPDATE solicitudes_pago
     SET estado = $3, tramitado_por_usuario_id = $1,
         fecha_tramite = CURRENT_TIMESTAMP, fecha_archivo = CURRENT_TIMESTAMP
     WHERE id_solicitud_pago = $2`,
    [usuarioId, idSolicitudPago, estado]
  );
}

module.exports = {
  existsCompromisoPorExpediente,
  findCompromiso,
  insertCompromiso,
  existsDevengadoPorCompromiso,
  findDevengadoConExpediente,
  insertDevengado,
  existsSolicitudPagoPorDevengado,
  findSolicitudPagoConExpediente,
  insertSolicitudPago,
  marcarSolicitudPagoTramitada,
};
