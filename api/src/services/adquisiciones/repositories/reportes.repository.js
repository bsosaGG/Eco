// Listados cross-expediente para las secciones de reportes (admin). NO filtran por expediente:
// juntan la información de TODOS los expedientes. De momento no llevan paginación ni filtros en
// el backend: el volumen de Baja Cuantía no lo justifica y los filtros/búsqueda se resuelven en el
// frontend sobre el arreglo ya cargado. Si el volumen crece, migrar a limit/offset como
// expedientes.repository.list().

async function cotizaciones(db) {
  const { rows } = await db.query(
    `SELECT
       c.id_cotizacion, c.monto_ofertado, c.plazo_entrega_dias, c.garantia_meses,
       c.cumple_especificaciones, c.es_adjudicada, c.fecha_registro,
       p.razon_social AS proveedor_nombre, p.nit AS proveedor_nit,
       e.id_expediente, e.codigo_expediente, e.objeto_compra,
       est.nombre AS expediente_estado, est.color AS expediente_estado_color
     FROM cotizaciones c
     JOIN proveedores p ON c.id_proveedor = p.id_proveedor
     JOIN expedientes e ON c.id_expediente = e.id_expediente
     JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
     ORDER BY c.fecha_registro DESC`
  );
  return rows;
}

async function cdp(db) {
  const { rows } = await db.query(
    `SELECT
       cd.id_cdp, cd.numero_cdp, cd.monto_reservado, cd.estado,
       cd.fecha_elaboracion, cd.fecha_aprobacion_presupuesto, cd.fecha_vobo_udaf,
       e.id_expediente, e.codigo_expediente, e.objeto_compra,
       est.nombre AS expediente_estado, est.color AS expediente_estado_color
     FROM cdp cd
     JOIN expedientes e ON cd.id_expediente = e.id_expediente
     JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
     ORDER BY cd.id_cdp DESC`
  );
  return rows;
}

async function ordenesCompra(db) {
  const { rows } = await db.query(
    `SELECT
       oc.id_orden_compra, oc.numero_oc, oc.monto_total, oc.estado,
       oc.plazo_entrega, oc.lugar_entrega, oc.fecha_notificacion_proveedor,
       pr.razon_social AS proveedor_nombre,
       e.id_expediente, e.codigo_expediente, e.objeto_compra,
       est.nombre AS expediente_estado, est.color AS expediente_estado_color
     FROM ordenes_compra oc
     JOIN proveedores pr ON oc.id_proveedor_adjudicado = pr.id_proveedor
     JOIN expedientes e ON oc.id_expediente = e.id_expediente
     JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
     ORDER BY oc.id_orden_compra DESC`
  );
  return rows;
}

async function compromisos(db) {
  const { rows } = await db.query(
    `SELECT
       co.id_compromiso, co.numero_comp, co.monto_comprometido, co.estado, co.fecha_registro,
       e.id_expediente, e.codigo_expediente, e.objeto_compra
     FROM compromisos_presupuestarios co
     JOIN expedientes e ON co.id_expediente = e.id_expediente
     ORDER BY co.id_compromiso DESC`
  );
  return rows;
}

async function devengados(db) {
  const { rows } = await db.query(
    `SELECT
       d.id_devengado, d.numero_dev, d.monto_devengado, d.retencion_isr, d.estado, d.fecha_registro,
       co.id_compromiso, co.numero_comp,
       e.id_expediente, e.codigo_expediente, e.objeto_compra
     FROM devengados d
     JOIN compromisos_presupuestarios co ON d.id_compromiso = co.id_compromiso
     JOIN expedientes e ON co.id_expediente = e.id_expediente
     ORDER BY d.id_devengado DESC`
  );
  return rows;
}

async function solicitudesPago(db) {
  const { rows } = await db.query(
    `SELECT
       sp.id_solicitud_pago, sp.entidad_bancaria, sp.tipo_cuenta, sp.numero_cuenta,
       sp.numero_transferencia_cheque, sp.estado, sp.fecha_solicitud, sp.fecha_tramite, sp.fecha_archivo,
       d.monto_devengado,
       e.id_expediente, e.codigo_expediente, e.objeto_compra
     FROM solicitudes_pago sp
     JOIN devengados d ON sp.id_devengado = d.id_devengado
     JOIN compromisos_presupuestarios co ON d.id_compromiso = co.id_compromiso
     JOIN expedientes e ON co.id_expediente = e.id_expediente
     ORDER BY sp.id_solicitud_pago DESC`
  );
  return rows;
}

/** Cantidad de expedientes por estado (incluye los estados sin expedientes). */
async function expedientesPorEstado(db) {
  const { rows } = await db.query(
    `SELECT est.id_estado, est.nombre AS estado, est.color, COUNT(e.id_expediente)::int AS cantidad
     FROM estados_expediente est
     LEFT JOIN expedientes e ON e.id_estado_actual = est.id_estado
     GROUP BY est.id_estado, est.nombre, est.color
     ORDER BY est.id_estado`
  );
  return rows;
}

/** Totales en quetzales: estimado, reservado en CDP, comprometido, devengado y pagado. */
async function montosTotales(db) {
  const { rows } = await db.query(
    `SELECT
       COALESCE((SELECT SUM(monto_estimado) FROM expedientes), 0)::numeric AS monto_estimado_total,
       COALESCE((SELECT SUM(monto_reservado) FROM cdp), 0)::numeric AS monto_reservado_cdp,
       COALESCE((SELECT SUM(monto_comprometido) FROM compromisos_presupuestarios), 0)::numeric AS monto_comprometido,
       COALESCE((SELECT SUM(monto_devengado) FROM devengados), 0)::numeric AS monto_devengado,
       COALESCE(
         (SELECT SUM(d.monto_devengado)
          FROM solicitudes_pago sp
          JOIN devengados d ON sp.id_devengado = d.id_devengado
          WHERE sp.estado = 'Tramitado'), 0
       )::numeric AS monto_pagado`
  );
  return rows[0];
}

/** Conteos generales para las tarjetas del resumen. */
async function conteosGenerales(db) {
  const { rows } = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM expedientes)::int AS total_expedientes,
       (SELECT COUNT(*) FROM expedientes e JOIN estados_expediente est ON e.id_estado_actual = est.id_estado WHERE est.es_final = FALSE)::int AS expedientes_activos,
       (SELECT COUNT(*) FROM cotizaciones)::int AS total_cotizaciones,
       (SELECT COUNT(*) FROM cdp)::int AS total_cdp,
       (SELECT COUNT(*) FROM ordenes_compra)::int AS total_ordenes_compra,
       (SELECT COUNT(*) FROM devoluciones_observaciones WHERE estado = 'Pendiente')::int AS devoluciones_pendientes`
  );
  return rows[0];
}

module.exports = {
  cotizaciones,
  cdp,
  ordenesCompra,
  compromisos,
  devengados,
  solicitudesPago,
  expedientesPorEstado,
  montosTotales,
  conteosGenerales,
};
