// Consulta del detalle de un expediente: la fila del expediente con todo su trámite embebido
// como JSON (renglones, cotizaciones, CDP, orden de compra, recepción, documentos de soporte,
// compromiso, devengado y solicitud de pago). Una sola consulta evita N+1 en la pantalla de
// detalle. Los usuarios se guardan como id; los nombres se agregan después (ver
// domain/expediente-actores.js) porque viven en otra base de datos.
//
// `condicion` filtra por el parámetro $1: por id numérico o por código del expediente (ver
// expedientes.repository.findDetalle).
module.exports = (condicion) => `
      SELECT
        e.*,
        CURRENT_TIMESTAMP AS servidor_ahora,
        u.nombre AS unidad_solicitante, u.codigo_unidad,
        est.nombre AS estado, est.color AS estado_color, est.etapa AS estado_etapa, est.es_final,
        (
          SELECT json_agg(
            (to_jsonb(i.*) || jsonb_build_object(
              'renglon_numero', r.numero_renglon,
              'renglon_nombre', r.nombre
            ))
            ORDER BY i.id_item
          )
          FROM expediente_items i
          LEFT JOIN renglones_presupuestarios r ON r.id_renglon = i.id_renglon
          WHERE i.id_expediente = e.id_expediente
        ) AS items,
        (
          SELECT json_agg(
            json_build_object(
              'id_cotizacion', c.id_cotizacion,
              'id_proveedor', c.id_proveedor,
              'proveedor_nombre', p.razon_social,
              'monto_ofertado', c.monto_ofertado,
              'plazo_entrega_dias', c.plazo_entrega_dias,
              'garantia_meses', c.garantia_meses,
              'cumple_especificaciones', c.cumple_especificaciones,
              'archivo_pdf_url', c.archivo_pdf_url,
              'es_adjudicada', c.es_adjudicada,
              'fecha_registro', c.fecha_registro
            ) ORDER BY c.monto_ofertado ASC
          )
          FROM cotizaciones c
          JOIN proveedores p ON c.id_proveedor = p.id_proveedor
          WHERE c.id_expediente = e.id_expediente
        ) AS cotizaciones,
        (
          SELECT json_build_object(
            'id_cdp', cd.id_cdp,
            'numero_cdp', cd.numero_cdp,
            'monto_reservado', cd.monto_reservado,
            'estado', cd.estado,
            'id_partida', cd.id_partida,
            'partida_texto', pa.programa || '-' || pa.actividad || ' / ' || r.nombre || ' (' || pa.fuente_financiamiento || ')',
            'elaborado_por_usuario_id', cd.elaborado_por_usuario_id,
            'fecha_elaboracion', cd.fecha_elaboracion,
            'aprobado_presupuesto_usuario_id', cd.aprobado_presupuesto_usuario_id,
            'fecha_aprobacion_presupuesto', cd.fecha_aprobacion_presupuesto,
            'vobo_udaf_usuario_id', cd.vobo_udaf_usuario_id,
            'fecha_vobo_udaf', cd.fecha_vobo_udaf
          )
          FROM cdp cd
          JOIN partidas_presupuestarias pa ON cd.id_partida = pa.id_partida
          JOIN renglones_presupuestarios r ON pa.id_renglon = r.id_renglon
          WHERE cd.id_expediente = e.id_expediente
        ) AS cdp,
        (
          SELECT json_build_object(
            'id_orden_compra', oc.id_orden_compra,
            'numero_oc', oc.numero_oc,
            'monto_total', oc.monto_total,
            'plazo_entrega', oc.plazo_entrega,
            'lugar_entrega', oc.lugar_entrega,
            'estado', oc.estado,
            'proveedor_nombre', p.razon_social,
            'elaborado_por_usuario_id', oc.elaborado_por_usuario_id,
            'aprobado_jefe_usuario_id', oc.aprobado_jefe_usuario_id,
            'fecha_aprobacion_jefe', oc.fecha_aprobacion_jefe,
            'autorizado_directora_usuario_id', oc.autorizado_directora_usuario_id,
            'fecha_autorizacion_directora', oc.fecha_autorizacion_directora,
            'fecha_notificacion_proveedor', oc.fecha_notificacion_proveedor
          )
          FROM ordenes_compra oc
          JOIN proveedores p ON oc.id_proveedor_adjudicado = p.id_proveedor
          WHERE oc.id_expediente = e.id_expediente
        ) AS orden_compra,
        (
          SELECT json_build_object(
            'id_recepcion', rc.id_recepcion,
            'fecha_hora_recepcion', rc.fecha_hora_recepcion,
            'recibido_conforme', rc.recibido_conforme,
            'dictamen_fisico', rc.dictamen_fisico,
            'tecnico_receptor_usuario_id', rc.tecnico_receptor_usuario_id,
            'custodio_almacen_usuario_id', rc.custodio_almacen_usuario_id,
            'observaciones', rc.observaciones
          )
          FROM recepciones rc
          JOIN ordenes_compra oc_r ON rc.id_orden_compra = oc_r.id_orden_compra
          WHERE oc_r.id_expediente = e.id_expediente
        ) AS recepcion,
        (
          SELECT json_agg(
            json_build_object(
              'id_documento', ds.id_documento,
              'tipo_documento', ds.tipo_documento,
              'numero_documento', ds.numero_documento,
              'archivo_url', ds.archivo_url,
              'fecha_documento', ds.fecha_documento,
              'subido_por_usuario_id', ds.subido_por_usuario_id,
              'fecha_carga', ds.fecha_carga
            ) ORDER BY ds.fecha_carga DESC
          )
          FROM documentos_soporte ds
          WHERE ds.id_expediente = e.id_expediente
        ) AS documentos_soporte,
        (
          SELECT json_build_object(
            'id_compromiso', cp.id_compromiso,
            'numero_comp', cp.numero_comp,
            'monto_comprometido', cp.monto_comprometido,
            'estado', cp.estado,
            'registrado_por_usuario_id', cp.registrado_por_usuario_id,
            'fecha_registro', cp.fecha_registro
          )
          FROM compromisos_presupuestarios cp
          WHERE cp.id_expediente = e.id_expediente
        ) AS compromiso,
        (
          SELECT json_build_object(
            'id_devengado', dv.id_devengado,
            'numero_dev', dv.numero_dev,
            'monto_devengado', dv.monto_devengado,
            'retencion_isr', dv.retencion_isr,
            'estado', dv.estado,
            'registrado_por_usuario_id', dv.registrado_por_usuario_id,
            'fecha_registro', dv.fecha_registro
          )
          FROM devengados dv
          JOIN compromisos_presupuestarios cp_d ON dv.id_compromiso = cp_d.id_compromiso
          WHERE cp_d.id_expediente = e.id_expediente
        ) AS devengado,
        (
          SELECT json_build_object(
            'id_solicitud_pago', sp.id_solicitud_pago,
            'entidad_bancaria', sp.entidad_bancaria,
            'tipo_cuenta', sp.tipo_cuenta,
            'numero_cuenta', sp.numero_cuenta,
            'numero_transferencia_cheque', sp.numero_transferencia_cheque,
            'estado', sp.estado,
            'solicitado_por_usuario_id', sp.solicitado_por_usuario_id,
            'fecha_solicitud', sp.fecha_solicitud,
            'tramitado_por_usuario_id', sp.tramitado_por_usuario_id,
            'fecha_tramite', sp.fecha_tramite,
            'fecha_archivo', sp.fecha_archivo
          )
          FROM solicitudes_pago sp
          JOIN devengados dv_s ON sp.id_devengado = dv_s.id_devengado
          JOIN compromisos_presupuestarios cp_s ON dv_s.id_compromiso = cp_s.id_compromiso
          WHERE cp_s.id_expediente = e.id_expediente
        ) AS solicitud_pago,
        (
          SELECT json_agg(
            json_build_object(
              'id_estado', h.id_estado,
              'estado', es.nombre,
              'etapa', es.etapa,
              'color', es.color,
              'es_final', es.es_final,
              'fecha_entrada', h.fecha_entrada
            ) ORDER BY h.fecha_entrada, h.id_historial
          )
          FROM historial_estados h
          JOIN estados_expediente es ON es.id_estado = h.id_estado
          WHERE h.id_expediente = e.id_expediente
        ) AS historial_estados
      FROM expedientes e
      JOIN unidades_solicitantes u ON e.id_unidad_solicitante = u.id_unidad
      JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
      WHERE ${condicion};
`;
