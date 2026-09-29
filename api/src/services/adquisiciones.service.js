// api/src/services/adquisiciones.service.js
// Módulo: SICOMPRAS - Adquisiciones (Baja Cuantía)
// Mismo patrón de 3 capas que pac.service.js / juridica (controller -> service -> pool)

const crypto = require("crypto");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
let puppeteer = null;
try {
  // eslint-disable-next-line global-require
  puppeteer = require("puppeteer-core");
} catch (err) {
  // Se valida al usarlo -- si falta la dependencia, generarSolicitudPdf lanza un error claro.
}
const { buildSolicitudCompraHtml } = require("../templates/adquisiciones/solicitud-compra-html.template");
const { adquisicionesPool } = require("../config/db-adquisiciones");
const usersDb = require("../config/db-users"); // Para enriquecer usuario_id con nombre_completo (mismo truco que pac.service.js)

class AdquisicionesService {
  // ---------------------------------------------------------------------
  // CATÁLOGOS
  // ---------------------------------------------------------------------

  async getUnidades() {
    const result = await adquisicionesPool.query(
      "SELECT id_unidad AS value, nombre AS text, codigo_unidad FROM unidades_solicitantes WHERE activo = TRUE ORDER BY nombre"
    );
    return result.rows;
  }

  // ---------------------------------------------------------------------
  // UNIDADES SOLICITANTES (catálogo administrable, mismo patrón que
  // Proveedores: getUnidades() arriba sigue sirviendo solo el combo activo)
  // ---------------------------------------------------------------------

  async getAllUnidadesSolicitantes(searchQuery = "") {
    let query = "SELECT * FROM unidades_solicitantes";
    const params = [];
    if (searchQuery) {
      query += " WHERE nombre ILIKE $1 OR codigo_unidad ILIKE $1";
      params.push(`%${searchQuery}%`);
    }
    query += " ORDER BY nombre ASC";
    const result = await adquisicionesPool.query(query, params);
    return result.rows;
  }

  async getUnidadSolicitanteById(id) {
    const result = await adquisicionesPool.query(
      "SELECT * FROM unidades_solicitantes WHERE id_unidad = $1",
      [id]
    );
    return result.rows[0];
  }

  async createUnidadSolicitante(data) {
    const { nombre, codigo_unidad } = data;
    const result = await adquisicionesPool.query(
      `INSERT INTO unidades_solicitantes (nombre, codigo_unidad)
       VALUES ($1, $2) RETURNING *`,
      [nombre, codigo_unidad]
    );
    return result.rows[0];
  }

  async updateUnidadSolicitante(id, data) {
    const { nombre, codigo_unidad, activo } = data;
    const result = await adquisicionesPool.query(
      `UPDATE unidades_solicitantes SET
         nombre = COALESCE($1, nombre),
         codigo_unidad = COALESCE($2, codigo_unidad),
         activo = COALESCE($3, activo)
       WHERE id_unidad = $4 RETURNING *`,
      [nombre, codigo_unidad, activo, id]
    );
    return result.rows[0];
  }

  async getRenglones() {
    const result = await adquisicionesPool.query(
      "SELECT id_renglon AS value, nombre AS text, numero_renglon FROM renglones_presupuestarios WHERE activo = TRUE ORDER BY numero_renglon"
    );
    return result.rows;
  }

  async getPartidas() {
    const result = await adquisicionesPool.query(
      `SELECT p.id_partida AS value,
              p.programa || '-' || p.actividad || ' / ' || r.nombre || ' (' || p.fuente_financiamiento || ')' AS text,
              p.monto_disponible
       FROM partidas_presupuestarias p
       JOIN renglones_presupuestarios r ON p.id_renglon = r.id_renglon
       ORDER BY p.ejercicio_fiscal DESC, p.programa, p.actividad`
    );
    return result.rows;
  }

  async getEstados() {
    const result = await adquisicionesPool.query(
      "SELECT id_estado AS value, nombre AS text, etapa, color, es_final FROM estados_expediente ORDER BY id_estado"
    );
    return result.rows;
  }

  // ---------------------------------------------------------------------
  // PROVEEDORES (catálogo propio de Adquisiciones, mismo patrón que
  // proveedores.service.js del módulo Inventario, pero sobre su propia BD)
  // ---------------------------------------------------------------------

  async getAllProveedores(limit = 100, offset = 0, searchQuery = "") {
    let query = "SELECT * FROM proveedores";
    const params = [];
    let paramIndex = 1;

    if (searchQuery) {
      query += ` WHERE razon_social ILIKE $${paramIndex++} OR nit ILIKE $${paramIndex++}`;
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    query += ` ORDER BY razon_social ASC LIMIT $${paramIndex++}`;
    params.push(limit);
    query += ` OFFSET $${paramIndex++}`;
    params.push(offset);

    const result = await adquisicionesPool.query(query, params);
    return result.rows;
  }

  async getProveedorById(id) {
    const result = await adquisicionesPool.query(
      "SELECT * FROM proveedores WHERE id_proveedor = $1",
      [id]
    );
    return result.rows[0];
  }

  async createProveedor(data) {
    const { razon_social, nit, constancia_rtu_vigente, email_contacto, telefono } = data;
    const result = await adquisicionesPool.query(
      `INSERT INTO proveedores (razon_social, nit, constancia_rtu_vigente, email_contacto, telefono)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [razon_social, nit, constancia_rtu_vigente || false, email_contacto || null, telefono || null]
    );
    return result.rows[0];
  }

  async updateProveedor(id, data) {
    const { razon_social, nit, constancia_rtu_vigente, email_contacto, telefono, activo } = data;
    const result = await adquisicionesPool.query(
      `UPDATE proveedores SET
         razon_social = COALESCE($1, razon_social),
         nit = COALESCE($2, nit),
         constancia_rtu_vigente = COALESCE($3, constancia_rtu_vigente),
         email_contacto = COALESCE($4, email_contacto),
         telefono = COALESCE($5, telefono),
         activo = COALESCE($6, activo)
       WHERE id_proveedor = $7 RETURNING *`,
      [razon_social, nit, constancia_rtu_vigente, email_contacto, telefono, activo, id]
    );
    return result.rows[0];
  }

  // ---------------------------------------------------------------------
  // BITÁCORA (log inmutable — nunca exponer UPDATE/DELETE sobre esto)
  // ---------------------------------------------------------------------

  /**
   * Inserta una fila en la bitácora. Pensada para llamarse dentro de la
   * misma transacción que el cambio que registra (recibe `client` opcional).
   */
  async _registrarBitacora(
    { idExpediente, usuarioId, accion, entidadRelacionada, observacion, ipOrigen },
    client = adquisicionesPool
  ) {
    await client.query(
      `INSERT INTO bitacora_trazabilidad
         (id_expediente, usuario_id, accion, entidad_relacionada, observacion, ip_origen)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [idExpediente, usuarioId, accion, entidadRelacionada || null, observacion || null, ipOrigen || null]
    );
  }

  async getBitacora(idExpediente) {
    const result = await adquisicionesPool.query(
      `SELECT id_bitacora, usuario_id, accion, entidad_relacionada, observacion, fecha_hora
       FROM bitacora_trazabilidad
       WHERE id_expediente = $1
       ORDER BY fecha_hora DESC`,
      [idExpediente]
    );
    const filas = result.rows;
    if (filas.length === 0) return filas;

    // Enriquecer usuario_id -> nombre_completo consultando db_global_users
    // (mismo mecanismo cross-DB que ya usa pac.service.js:getSolicitudPorCodigo)
    const userIds = [...new Set(filas.map((f) => f.usuario_id))];
    const usersResult = await usersDb.query(
      "SELECT id_usuario, nombre_completo FROM usuarios WHERE id_usuario = ANY($1::int[])",
      [userIds]
    );
    const userMap = usersResult.rows.reduce((map, u) => {
      map[u.id_usuario] = u.nombre_completo;
      return map;
    }, {});

    return filas.map((f) => ({
      ...f,
      usuario_nombre: userMap[f.usuario_id] || `Usuario #${f.usuario_id}`,
    }));
  }

  // ---------------------------------------------------------------------
  // EXPEDIENTES (CU-01)
  // ---------------------------------------------------------------------

  /**
   * Genera el siguiente código correlativo para la unidad y año actual, con la
   * nomenclatura oficial: ABREVIATURA-CORRELATIVO-AÑO (p.ej. "UA-1-2026").
   * El correlativo es independiente por unidad y por año (no llevan cero relleno:
   * 1, 2, 3... como se pidió), y arranca en 1 otra vez cada año nuevo.
   * NOTA: cuenta expedientes existentes con el mismo patrón dentro de la misma
   * transacción; para volúmenes altos con alta concurrencia conviene migrar a una
   * tabla `adquisiciones_correlativos` como la de PAC (pac_correlativos) — no
   * bloquea el MVP.
   */
  async _generarSiguienteCodigo(idUnidad, client) {
    const anio = new Date().getFullYear();

    const resUnidad = await client.query(
      "SELECT codigo_unidad FROM unidades_solicitantes WHERE id_unidad = $1",
      [idUnidad]
    );
    if (resUnidad.rows.length === 0) {
      throw new Error("La unidad solicitante especificada no existe.");
    }
    const codigoUnidad = resUnidad.rows[0].codigo_unidad;

    // El correlativo va en medio (ABREV-CORRELATIVO-AÑO), así que no se puede contar
    // con un prefijo simple con LIKE 'algo%' — se cuenta con el patrón completo,
    // con el correlativo como comodín: 'UA-%-2026'.
    const patronConteo = `${codigoUnidad}-%-${anio}`;
    const resConteo = await client.query(
      "SELECT COUNT(*)::int AS total FROM expedientes WHERE codigo_expediente LIKE $1",
      [patronConteo]
    );
    const siguienteNumero = resConteo.rows[0].total + 1;

    return `${codigoUnidad}-${siguienteNumero}-${anio}`;
  }

  /**
   * CU-01: Crear y enviar una Solicitud de Compra (SCR-02).
   * Recibe los datos del expediente + un arreglo `items` (renglones solicitados).
   */
  async crearExpediente(data, usuarioSolicitanteId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const estadoInicialRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'Recibida por Adquisiciones'"
      );
      if (estadoInicialRes.rows.length === 0) {
        throw new Error(
          "No se ha configurado el estado inicial 'Recibida por Adquisiciones'."
        );
      }
      const idEstadoInicial = estadoInicialRes.rows[0].id_estado;

      const codigoExpediente = await this._generarSiguienteCodigo(
        data.id_unidad_solicitante,
        client
      );

      // Firma 2 (FOR-DG-UA-00-01): puede ser cualquier usuario real del módulo -- NO
      // se restringe a quien esté "asignado" a la unidad solicitante, porque en la
      // práctica quien firma no siempre es el/la jefe de esa unidad. El frontend ya
      // solo ofrece usuarios reales del módulo, pero el backend valida de todas
      // formas (mismo patrón que asignarExpediente).
      let firma2Cargo = null;
      if (data.firma2_usuario_id) {
        const firma2Res = await usersDb.query(
          `SELECT u.id_usuario
           FROM usuarios u
           WHERE u.id_usuario = $1
             AND u.activo = TRUE
             AND (
               u.rol = 'admin'
               OR EXISTS (
                 SELECT 1 FROM usuario_perfiles up
                 JOIN perfiles p ON p.id_perfil = up.id_perfil
                 WHERE up.id_usuario = u.id_usuario AND p.nombre_perfil = ANY($2)
               )
             )`,
          [data.firma2_usuario_id, AdquisicionesService.PERFILES_MODULO]
        );
        if (firma2Res.rows.length === 0) {
          throw new Error(
            "El usuario seleccionado para la segunda firma no existe o no pertenece al módulo de Adquisiciones."
          );
        }
      }

      const tieneAnexo = !!data.tiene_anexo;

      const insertExpediente = await client.query(
        `INSERT INTO expedientes
           (codigo_expediente, id_unidad_solicitante, usuario_solicitante_id, funcionario_responsable,
            objeto_compra, justificacion, monto_estimado, modalidad, id_estado_actual, documento_especificaciones_url,
            tipo_compra, tiene_anexo, anexo_caracteristicas_tecnicas, anexo_especificaciones_especiales,
            firma2_usuario_id, firma2_cargo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING id_expediente, codigo_expediente`,
        [
          codigoExpediente,
          data.id_unidad_solicitante,
          usuarioSolicitanteId,
          data.funcionario_responsable || null,
          data.objeto_compra,
          data.justificacion,
          data.monto_estimado || null,
          data.modalidad || "Baja Cuantía",
          idEstadoInicial,
          data.documento_especificaciones_url || null,
          data.tipo_compra || null,
          tieneAnexo,
          tieneAnexo ? data.anexo_caracteristicas_tecnicas || null : null,
          tieneAnexo ? data.anexo_especificaciones_especiales || null : null,
          data.firma2_usuario_id || null,
          firma2Cargo,
        ]
      );
      const { id_expediente, codigo_expediente } = insertExpediente.rows[0];

      const items = Array.isArray(data.items) ? data.items : [];
      for (const item of items) {
        // El precio no se captura en la solicitud inicial (CU-01): a esta altura del
        // proceso todavía no hay proveedor ni cotización. La columna es NOT NULL, así
        // que se guarda en 0 por ahora. NOTA: adjudicarCotizacion() (CU-02) todavía NO
        // actualiza este valor con el precio de la cotización ganadora — es un pendiente
        // real, documentado en el proyecto, no algo ya resuelto.
        const costoUnitario = item.costo_unitario_estimado ?? 0;
        await client.query(
          `INSERT INTO expediente_items
             (id_expediente, descripcion, cantidad, unidad_medida, costo_unitario_estimado,
              codigo_insumo, id_renglon)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id_expediente,
            item.descripcion,
            item.cantidad,
            item.unidad_medida,
            costoUnitario,
            item.codigo_insumo || null,
            item.id_renglon || null,
          ]
        );
      }

      await this._registrarBitacora(
        {
          idExpediente: id_expediente,
          usuarioId: usuarioSolicitanteId,
          accion: "Expediente creado",
          entidadRelacionada: "expedientes",
          observacion: `Solicitud de compra registrada con código ${codigo_expediente}.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(id_expediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getExpedientes(queryParams) {
    const { limit = 20, offset = 0, estado, unidad, search } = queryParams;

    let baseQuery = `
      SELECT
        e.id_expediente, e.codigo_expediente, e.objeto_compra, e.monto_estimado,
        e.fecha_creacion, e.fecha_actualizacion,
        u.nombre AS unidad_solicitante,
        est.nombre AS estado, est.color AS estado_color, est.es_final
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
    if (search) {
      conditions.push(
        `(e.objeto_compra ILIKE $${paramIndex++} OR e.codigo_expediente ILIKE $${paramIndex++})`
      );
      values.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      baseQuery += " WHERE " + conditions.join(" AND ");
    }

    baseQuery += ` ORDER BY e.id_expediente DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(limit, offset);

    const result = await adquisicionesPool.query(baseQuery, values);
    return result.rows;
  }

  async getExpedienteById(id) {
    const query = `
      SELECT
        e.*,
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
        ) AS solicitud_pago
      FROM expedientes e
      JOIN unidades_solicitantes u ON e.id_unidad_solicitante = u.id_unidad
      JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
      WHERE e.id_expediente = $1 OR e.codigo_expediente = $1::text;
    `;
    // Permite buscar tanto por id numérico como por código (igual que pac.service.js hace por código)
    const result = await adquisicionesPool.query(query, [id]);
    if (result.rows.length === 0) return undefined;

    const expediente = result.rows[0];

    // Enriquecer todos los usuario_id referenciados (solicitante + actores del CDP y la OC) en una sola consulta.
    const idsAEnriquecer = [expediente.usuario_solicitante_id];
    if (expediente.firma2_usuario_id) idsAEnriquecer.push(expediente.firma2_usuario_id);
    if (expediente.cdp) {
      ["elaborado_por_usuario_id", "aprobado_presupuesto_usuario_id", "vobo_udaf_usuario_id"].forEach((campo) => {
        if (expediente.cdp[campo]) idsAEnriquecer.push(expediente.cdp[campo]);
      });
    }
    if (expediente.orden_compra) {
      ["elaborado_por_usuario_id", "aprobado_jefe_usuario_id", "autorizado_directora_usuario_id"].forEach((campo) => {
        if (expediente.orden_compra[campo]) idsAEnriquecer.push(expediente.orden_compra[campo]);
      });
    }
    if (expediente.recepcion) {
      ["tecnico_receptor_usuario_id", "custodio_almacen_usuario_id"].forEach((campo) => {
        if (expediente.recepcion[campo]) idsAEnriquecer.push(expediente.recepcion[campo]);
      });
    }
    if (expediente.documentos_soporte) {
      expediente.documentos_soporte.forEach((doc) => {
        if (doc.subido_por_usuario_id) idsAEnriquecer.push(doc.subido_por_usuario_id);
      });
    }
    if (expediente.compromiso?.registrado_por_usuario_id) idsAEnriquecer.push(expediente.compromiso.registrado_por_usuario_id);
    if (expediente.devengado?.registrado_por_usuario_id) idsAEnriquecer.push(expediente.devengado.registrado_por_usuario_id);
    if (expediente.solicitud_pago) {
      ["solicitado_por_usuario_id", "tramitado_por_usuario_id"].forEach((campo) => {
        if (expediente.solicitud_pago[campo]) idsAEnriquecer.push(expediente.solicitud_pago[campo]);
      });
    }
    const usersResult = await usersDb.query(
      "SELECT id_usuario, nombre_completo FROM usuarios WHERE id_usuario = ANY($1::int[])",
      [[...new Set(idsAEnriquecer)]]
    );
    const nombrePorId = usersResult.rows.reduce((map, u) => {
      map[u.id_usuario] = u.nombre_completo;
      return map;
    }, {});

    expediente.usuario_solicitante_nombre =
      nombrePorId[expediente.usuario_solicitante_id] || `Usuario #${expediente.usuario_solicitante_id}`;
    expediente.firma2_usuario_nombre = expediente.firma2_usuario_id
      ? nombrePorId[expediente.firma2_usuario_id] || `Usuario #${expediente.firma2_usuario_id}`
      : null;

    if (expediente.cdp) {
      expediente.cdp.elaborado_por_nombre = expediente.cdp.elaborado_por_usuario_id
        ? nombrePorId[expediente.cdp.elaborado_por_usuario_id] || `Usuario #${expediente.cdp.elaborado_por_usuario_id}`
        : null;
      expediente.cdp.aprobado_presupuesto_nombre = expediente.cdp.aprobado_presupuesto_usuario_id
        ? nombrePorId[expediente.cdp.aprobado_presupuesto_usuario_id] || `Usuario #${expediente.cdp.aprobado_presupuesto_usuario_id}`
        : null;
      expediente.cdp.vobo_udaf_nombre = expediente.cdp.vobo_udaf_usuario_id
        ? nombrePorId[expediente.cdp.vobo_udaf_usuario_id] || `Usuario #${expediente.cdp.vobo_udaf_usuario_id}`
        : null;
    }

    if (expediente.orden_compra) {
      expediente.orden_compra.elaborado_por_nombre = expediente.orden_compra.elaborado_por_usuario_id
        ? nombrePorId[expediente.orden_compra.elaborado_por_usuario_id] || `Usuario #${expediente.orden_compra.elaborado_por_usuario_id}`
        : null;
      expediente.orden_compra.aprobado_jefe_nombre = expediente.orden_compra.aprobado_jefe_usuario_id
        ? nombrePorId[expediente.orden_compra.aprobado_jefe_usuario_id] || `Usuario #${expediente.orden_compra.aprobado_jefe_usuario_id}`
        : null;
      expediente.orden_compra.autorizado_directora_nombre = expediente.orden_compra.autorizado_directora_usuario_id
        ? nombrePorId[expediente.orden_compra.autorizado_directora_usuario_id] || `Usuario #${expediente.orden_compra.autorizado_directora_usuario_id}`
        : null;
    }

    if (expediente.recepcion) {
      expediente.recepcion.tecnico_receptor_nombre = expediente.recepcion.tecnico_receptor_usuario_id
        ? nombrePorId[expediente.recepcion.tecnico_receptor_usuario_id] || `Usuario #${expediente.recepcion.tecnico_receptor_usuario_id}`
        : null;
      expediente.recepcion.custodio_almacen_nombre = expediente.recepcion.custodio_almacen_usuario_id
        ? nombrePorId[expediente.recepcion.custodio_almacen_usuario_id] || `Usuario #${expediente.recepcion.custodio_almacen_usuario_id}`
        : null;
    }

    if (expediente.documentos_soporte) {
      expediente.documentos_soporte.forEach((doc) => {
        doc.subido_por_nombre = doc.subido_por_usuario_id
          ? nombrePorId[doc.subido_por_usuario_id] || `Usuario #${doc.subido_por_usuario_id}`
          : null;
      });
    }

    if (expediente.compromiso) {
      expediente.compromiso.registrado_por_nombre = expediente.compromiso.registrado_por_usuario_id
        ? nombrePorId[expediente.compromiso.registrado_por_usuario_id] || `Usuario #${expediente.compromiso.registrado_por_usuario_id}`
        : null;
    }
    if (expediente.devengado) {
      expediente.devengado.registrado_por_nombre = expediente.devengado.registrado_por_usuario_id
        ? nombrePorId[expediente.devengado.registrado_por_usuario_id] || `Usuario #${expediente.devengado.registrado_por_usuario_id}`
        : null;
    }
    if (expediente.solicitud_pago) {
      expediente.solicitud_pago.solicitado_por_nombre = expediente.solicitud_pago.solicitado_por_usuario_id
        ? nombrePorId[expediente.solicitud_pago.solicitado_por_usuario_id] || `Usuario #${expediente.solicitud_pago.solicitado_por_usuario_id}`
        : null;
      expediente.solicitud_pago.tramitado_por_nombre = expediente.solicitud_pago.tramitado_por_usuario_id
        ? nombrePorId[expediente.solicitud_pago.tramitado_por_usuario_id] || `Usuario #${expediente.solicitud_pago.tramitado_por_usuario_id}`
        : null;
    }

    return expediente;
  }

  /**
   * Perfiles/etapas del módulo de Adquisiciones (matriz de
   * claude/diseno-db-adquisiciones.md). Se usa para acotar el selector de
   * "Asignar a" a gente que de verdad pertenece al módulo, en vez de listar
   * a toda la plataforma (eso ya lo hace GET /api/user, pero solo para admins).
   */
  static PERFILES_MODULO = [
    "Unidad Solicitante",
    "Unidad de Adquisiciones",
    "Analista de Adquisiciones",
    "Asistente de Presupuesto",
    "Encargado de Presupuesto",
    "Jefe UDAF",
    "Jefe de Adquisiciones",
    "Directora General",
    "Encargado de Contabilidad",
    "Sub Despacho",
    "Administrador de Sistema / TI",
    "Auditoría Interna",
  ];

  // ---------------------------------------------------------------------
  // CATÁLOGO PÚBLICO DE INSUMOS MAGA/SIGES (búsqueda de apoyo para "Renglones
  // Solicitados", CU-01). No hay API JSON oficial: apps.maga.gob.gt/compras/Insumos
  // es una vista MVC server-rendered, así que se hace GET a la misma URL pública
  // que usa un navegador (?SearchString=...) y se parsea la tabla HTML. No expone
  // precios (solo nomenclatura/renglón/presentación) — el precio sigue siendo
  // captura manual. Cualquier falla (sitio caído, cambio de markup, red bloqueada
  // en el ambiente del backend) se traga aquí: la búsqueda es un apoyo opcional,
  // nunca debe romper la creación de la solicitud.
  static _decodeHtmlEntities(str) {
    return str
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&middot;/g, "·");
  }

  static _stripTags(html) {
    return AdquisicionesService._decodeHtmlEntities(html.replace(/<[^>]*>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
  }

  async buscarInsumosMaga(searchString) {
    const query = (searchString || "").trim();
    if (query.length < 2) return [];

    try {
      const response = await axios.get("https://apps.maga.gob.gt/compras/Insumos", {
        params: { SearchString: query, itemsPerPage: 100 },
        timeout: 8000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-GT,es;q=0.9",
        },
        validateStatus: () => true,
      });

      if (response.status !== 200 || typeof response.data !== "string") return [];

      const tbodyMatch = response.data.match(/<tbody>([\s\S]*?)<\/tbody>/);
      if (!tbodyMatch) return [];

      const filas = tbodyMatch[1].match(/<tr>[\s\S]*?<\/tr>/g) || [];
      const resultados = [];

      for (const fila of filas) {
        const celdas = fila.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [];
        if (celdas.length < 7) continue;

        const renglon = AdquisicionesService._stripTags(celdas[0]);
        const codigoInsumo = AdquisicionesService._stripTags(celdas[1]);
        const insumo = AdquisicionesService._stripTags(celdas[2]);
        const caracteristicas = AdquisicionesService._stripTags(celdas[3]);
        const presentacion = AdquisicionesService._stripTags(celdas[4]);
        const cantidadYUnidad = AdquisicionesService._stripTags(celdas[5]);
        const codigoPresentacion = AdquisicionesService._stripTags(celdas[6]);

        // "1 Mililitro" -> cantidad "1", unidad "Mililitro" (para autollenar tanto la
        // cantidad como la unidad de medida del renglón en el formulario)
        const partesCantidadUnidad = cantidadYUnidad.match(/^([\d.,]+)\s*(.*)$/);
        const unidadMedida = partesCantidadUnidad ? partesCantidadUnidad[2].trim() : cantidadYUnidad;
        const cantidad = partesCantidadUnidad ? partesCantidadUnidad[1].replace(",", "") : "";

        if (!insumo) continue;

        resultados.push({
          renglon,
          codigo_insumo: codigoInsumo,
          insumo,
          caracteristicas,
          presentacion,
          cantidad_y_unidad: cantidadYUnidad,
          cantidad,
          unidad_medida: unidadMedida,
          codigo_presentacion: codigoPresentacion,
        });
      }

      return resultados;
    } catch (error) {
      console.error("No se pudo consultar el catálogo de insumos MAGA/SIGES:", error.message);
      return [];
    }
  }

  /**
   * Usuarios "de Adquisiciones": cualquiera con al menos uno de los 12 perfiles
   * del módulo, o con rol='admin' (que ya puede actuar en todo el proceso sin
   * necesitar perfil). Es la fuente del selector de "Asignar a" — reemplaza
   * el campo de texto libre por una búsqueda real sobre personas que sí
   * pueden tomar el expediente.
   */
  async getUsuariosModulo() {
    const result = await usersDb.query(
      `SELECT u.id_usuario, u.email, u.nombre_completo, u.rol,
              COALESCE(
                array_agg(p.nombre_perfil) FILTER (WHERE p.nombre_perfil IS NOT NULL),
                ARRAY[]::text[]
              ) AS perfiles
       FROM usuarios u
       LEFT JOIN usuario_perfiles up ON up.id_usuario = u.id_usuario
       LEFT JOIN perfiles p ON p.id_perfil = up.id_perfil AND p.nombre_perfil = ANY($1)
       WHERE u.activo = TRUE
         AND (
           u.rol = 'admin'
           OR EXISTS (
             SELECT 1 FROM usuario_perfiles up2
             JOIN perfiles p2 ON p2.id_perfil = up2.id_perfil
             WHERE up2.id_usuario = u.id_usuario AND p2.nombre_perfil = ANY($1)
           )
         )
       GROUP BY u.id_usuario, u.email, u.nombre_completo, u.rol
       ORDER BY u.nombre_completo`,
      [AdquisicionesService.PERFILES_MODULO]
    );
    return result.rows;
  }

  /**
   * Usuarios asignados a una unidad solicitante (para el dropdown de la "firma 2" de
   * la Solicitud de Compra -- la firma 1 siempre es el usuario que solicita, la firma 2
   * varía según quién esté a cargo de esa unidad). Se apoya en usuarios_unidad_solicitante
   * (tabla propia del módulo, ver scripts/adquisiciones/20260928_create_usuarios_unidad_solicitante.sql)
   * en vez del catálogo de unidades de core-humanis, porque ese catálogo tiene una
   * organización distinta (8 unidades de RRHH que no corresponden a las 16 unidades
   * oficiales de Adquisiciones). Devuelve solo los usuarios que ya existan asignados de
   * momento -- la tabla se puebla a mano según se vayan confirmando las asignaciones reales.
   */
  async getUsuariosPorUnidad(idUnidadSolicitante) {
    const asignaciones = await adquisicionesPool.query(
      `SELECT id_usuario, cargo
       FROM usuarios_unidad_solicitante
       WHERE id_unidad_solicitante = $1 AND activo = TRUE`,
      [idUnidadSolicitante]
    );
    if (asignaciones.rows.length === 0) return [];

    const cargoPorUsuario = asignaciones.rows.reduce((map, a) => {
      map[a.id_usuario] = a.cargo;
      return map;
    }, {});
    const idsUsuario = asignaciones.rows.map((a) => a.id_usuario);

    const usersResult = await usersDb.query(
      "SELECT id_usuario, email, nombre_completo FROM usuarios WHERE id_usuario = ANY($1::int[]) AND activo = TRUE",
      [idsUsuario]
    );

    return usersResult.rows.map((u) => ({
      ...u,
      cargo: cargoPorUsuario[u.id_usuario] || null,
    }));
  }

  /**
   * Administración de usuarios_unidad_solicitante (pantalla "Firmantes por Unidad"):
   * lista TODAS las asignaciones de una unidad (activas e inactivas, para poder
   * reactivar), enriquecidas con el nombre/email real de db_global_users.
   */
  async getAsignacionesUnidad(idUnidadSolicitante) {
    const asignaciones = await adquisicionesPool.query(
      `SELECT id_asignacion, id_usuario, cargo, activo
       FROM usuarios_unidad_solicitante
       WHERE id_unidad_solicitante = $1
       ORDER BY id_asignacion`,
      [idUnidadSolicitante]
    );
    if (asignaciones.rows.length === 0) return [];

    const idsUsuario = [...new Set(asignaciones.rows.map((a) => a.id_usuario))];
    const usersResult = await usersDb.query(
      "SELECT id_usuario, email, nombre_completo FROM usuarios WHERE id_usuario = ANY($1::int[])",
      [idsUsuario]
    );
    const usuarioPorId = usersResult.rows.reduce((map, u) => {
      map[u.id_usuario] = u;
      return map;
    }, {});

    return asignaciones.rows.map((a) => ({
      ...a,
      email: usuarioPorId[a.id_usuario]?.email || null,
      nombre_completo: usuarioPorId[a.id_usuario]?.nombre_completo || `Usuario #${a.id_usuario}`,
    }));
  }

  /**
   * Asigna (o reactiva) a un usuario real del módulo como firmante de una unidad
   * solicitante. Valida contra db_global_users que el usuario sí exista y sí
   * pertenezca al módulo -- el frontend ya solo ofrece esas personas, pero el
   * backend no confía únicamente en eso (mismo patrón que asignarExpediente).
   */
  async asignarUsuarioUnidad(idUnidadSolicitante, idUsuario, cargo) {
    const usuarioRes = await usersDb.query(
      `SELECT u.id_usuario, u.nombre_completo, u.email
       FROM usuarios u
       WHERE u.id_usuario = $1
         AND u.activo = TRUE
         AND (
           u.rol = 'admin'
           OR EXISTS (
             SELECT 1 FROM usuario_perfiles up
             JOIN perfiles p ON p.id_perfil = up.id_perfil
             WHERE up.id_usuario = u.id_usuario AND p.nombre_perfil = ANY($2)
           )
         )`,
      [idUsuario, AdquisicionesService.PERFILES_MODULO]
    );
    if (usuarioRes.rows.length === 0) {
      throw new Error("El usuario seleccionado no existe o no pertenece al módulo de Adquisiciones.");
    }

    const result = await adquisicionesPool.query(
      `INSERT INTO usuarios_unidad_solicitante (id_usuario, id_unidad_solicitante, cargo, activo)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (id_usuario, id_unidad_solicitante)
       DO UPDATE SET cargo = EXCLUDED.cargo, activo = TRUE
       RETURNING id_asignacion, id_usuario, cargo, activo`,
      [idUsuario, idUnidadSolicitante, cargo || null]
    );
    return { ...result.rows[0], ...usuarioRes.rows[0] };
  }

  /** Quita a un usuario como firmante de una unidad (desactiva, no borra la fila). */
  async quitarAsignacionUnidad(idUnidadSolicitante, idUsuario) {
    const result = await adquisicionesPool.query(
      `UPDATE usuarios_unidad_solicitante
       SET activo = FALSE
       WHERE id_unidad_solicitante = $1 AND id_usuario = $2
       RETURNING id_asignacion`,
      [idUnidadSolicitante, idUsuario]
    );
    if (result.rows.length === 0) {
      throw new Error("Esa asignación no existe.");
    }
    return { ok: true };
  }

  /** CU-01 (paso 2): recibir la solicitud y asignarla a un Analista real (por id_usuario, no por nombre escrito a mano). */
  async asignarExpediente(idExpediente, idUsuarioAsignado, usuarioIdActor) {
    // Verificamos que el id recibido sea de verdad alguien de Adquisiciones antes de
    // guardarlo — el selector del frontend ya solo ofrece estas personas, pero el
    // backend no confía únicamente en eso.
    const usuarioRes = await usersDb.query(
      `SELECT u.id_usuario, u.nombre_completo, u.email
       FROM usuarios u
       WHERE u.id_usuario = $1
         AND u.activo = TRUE
         AND (
           u.rol = 'admin'
           OR EXISTS (
             SELECT 1 FROM usuario_perfiles up
             JOIN perfiles p ON p.id_perfil = up.id_perfil
             WHERE up.id_usuario = u.id_usuario AND p.nombre_perfil = ANY($2)
           )
         )`,
      [idUsuarioAsignado, AdquisicionesService.PERFILES_MODULO]
    );
    if (usuarioRes.rows.length === 0) {
      throw new Error("El usuario seleccionado no pertenece al módulo de Adquisiciones.");
    }
    const usuarioAsignado = usuarioRes.rows[0];
    const nombreAsignado = usuarioAsignado.nombre_completo || usuarioAsignado.email;

    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const estadoRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'Pendiente Cotización'"
      );
      const idNuevoEstado = estadoRes.rows[0]?.id_estado;

      const result = await client.query(
        `UPDATE expedientes
         SET funcionario_responsable_id = $1, funcionario_responsable = $2,
             id_estado_actual = COALESCE($3, id_estado_actual),
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $4
         RETURNING id_expediente`,
        [usuarioAsignado.id_usuario, nombreAsignado, idNuevoEstado, idExpediente]
      );
      if (result.rows.length === 0) {
        throw new Error("Expediente no encontrado.");
      }

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId: usuarioIdActor,
          accion: "Expediente asignado",
          entidadRelacionada: "expedientes",
          observacion: `Asignado a: ${nombreAsignado}`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /** Transición de estado genérica, con registro en bitácora. */
  async cambiarEstado(idExpediente, nuevoEstadoId, comentario, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const estadoRes = await client.query(
        "SELECT nombre FROM estados_expediente WHERE id_estado = $1",
        [nuevoEstadoId]
      );
      if (estadoRes.rows.length === 0) {
        throw new Error("El estado especificado no existe.");
      }

      const result = await client.query(
        `UPDATE expedientes SET id_estado_actual = $1, fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $2 RETURNING id_expediente`,
        [nuevoEstadoId, idExpediente]
      );
      if (result.rows.length === 0) {
        throw new Error("Expediente no encontrado.");
      }

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: `Cambio de estado a "${estadoRes.rows[0].nombre}"`,
          entidadRelacionada: "expedientes",
          observacion: comentario || null,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /** Flujos A1/A2 (SCR-10): devolución con observaciones y reingreso. */
  async devolverExpediente(idExpediente, data, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const estadoRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'Devuelto con Observaciones'"
      );
      const idEstadoDevuelto = estadoRes.rows[0]?.id_estado;

      await client.query(
        `UPDATE expedientes SET id_estado_actual = COALESCE($1, id_estado_actual), fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $2`,
        [idEstadoDevuelto, idExpediente]
      );

      const fechaLimite = data.plazo_subsanacion_dias
        ? `CURRENT_TIMESTAMP + INTERVAL '${parseInt(data.plazo_subsanacion_dias, 10)} days'`
        : "NULL";

      await client.query(
        `INSERT INTO devoluciones_observaciones
           (id_expediente, etapa_origen, motivo, descripcion, usuario_revisor_id, plazo_subsanacion_dias, fecha_limite)
         VALUES ($1, $2, $3, $4, $5, $6, ${fechaLimite})`,
        [
          idExpediente,
          data.etapa_origen,
          data.motivo,
          data.descripcion || null,
          usuarioId,
          data.plazo_subsanacion_dias || null,
        ]
      );

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: "Expediente devuelto con observaciones",
          entidadRelacionada: "devoluciones_observaciones",
          observacion: data.motivo,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------
  // COTIZACIONES (CU-02)
  // ---------------------------------------------------------------------

  /** CU-02: registrar la oferta de un proveedor para un expediente. */
  async registrarCotizacion(idExpediente, data, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const proveedorRes = await client.query(
        "SELECT razon_social FROM proveedores WHERE id_proveedor = $1",
        [data.id_proveedor]
      );
      if (proveedorRes.rows.length === 0) {
        throw new Error("El proveedor especificado no existe.");
      }

      await client.query(
        `INSERT INTO cotizaciones
           (id_expediente, id_proveedor, monto_ofertado, plazo_entrega_dias, garantia_meses,
            cumple_especificaciones, archivo_pdf_url, registrado_por_usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          idExpediente,
          data.id_proveedor,
          data.monto_ofertado,
          data.plazo_entrega_dias || null,
          data.garantia_meses || null,
          data.cumple_especificaciones ?? null,
          data.archivo_pdf_url || null,
          usuarioId,
        ]
      );

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: "Cotización registrada",
          entidadRelacionada: "cotizaciones",
          observacion: `Oferta de ${proveedorRes.rows[0].razon_social} por ${data.monto_ofertado}.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /** CU-02: adjudicar una de las cotizaciones registradas y avanzar el expediente a CDP. */
  async adjudicarCotizacion(idExpediente, idCotizacion, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const cotRes = await client.query(
        `SELECT c.id_cotizacion, p.razon_social
         FROM cotizaciones c
         JOIN proveedores p ON c.id_proveedor = p.id_proveedor
         WHERE c.id_cotizacion = $1 AND c.id_expediente = $2`,
        [idCotizacion, idExpediente]
      );
      if (cotRes.rows.length === 0) {
        throw new Error("La cotización especificada no pertenece a este expediente.");
      }

      // Solo una cotización puede quedar adjudicada por expediente.
      await client.query(
        "UPDATE cotizaciones SET es_adjudicada = FALSE WHERE id_expediente = $1",
        [idExpediente]
      );
      await client.query(
        "UPDATE cotizaciones SET es_adjudicada = TRUE WHERE id_cotizacion = $1",
        [idCotizacion]
      );

      const estadoRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'En firma CDP'"
      );
      const idNuevoEstado = estadoRes.rows[0]?.id_estado;

      await client.query(
        `UPDATE expedientes
         SET id_estado_actual = COALESCE($1, id_estado_actual), fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $2`,
        [idNuevoEstado, idExpediente]
      );

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: "Cotización adjudicada",
          entidadRelacionada: "cotizaciones",
          observacion: `Adjudicada a ${cotRes.rows[0].razon_social}.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------
  // CDP - Certificado de Disponibilidad Presupuestaria (CU-03)
  // ---------------------------------------------------------------------

  _generarFirmaHash(payload) {
    // Placeholder de firma electrónica (ver decisión de diseño #6 del documento):
    // no hay integración real con FEA/token todavía, solo deja constancia
    // verificable de que la acción ocurrió con estos datos en este momento.
    return crypto.createHash("sha256").update(`${payload}|${Date.now()}`).digest("hex");
  }

  async _generarSiguienteNumeroCdp(client) {
    const anio = new Date().getFullYear();
    const prefijo = `CDP-${anio}-`;
    const res = await client.query("SELECT COUNT(*)::int AS total FROM cdp WHERE numero_cdp LIKE $1", [
      `${prefijo}%`,
    ]);
    const siguiente = res.rows[0].total + 1;
    return `${prefijo}${String(siguiente).padStart(4, "0")}`;
  }

  /**
   * CU-03 (paso 5): Asistente de Presupuesto elabora el borrador del CDP.
   * Valida techo/saldo disponible de la partida (decisión de diseño #3) pero
   * todavía NO descuenta el saldo — eso solo ocurre cuando UDAF da el Vo.Bo.
   * final (voboCdp), para no reservar presupuesto sobre un borrador que
   * puede quedar rechazado en el camino.
   */
  async elaborarCdp(idExpediente, data, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const expRes = await client.query("SELECT id_expediente FROM expedientes WHERE id_expediente = $1", [
        idExpediente,
      ]);
      if (expRes.rows.length === 0) {
        throw new Error("Expediente no encontrado.");
      }

      const existeRes = await client.query("SELECT id_cdp FROM cdp WHERE id_expediente = $1", [idExpediente]);
      if (existeRes.rows.length > 0) {
        throw new Error("Este expediente ya tiene un CDP elaborado.");
      }

      const partidaRes = await client.query(
        "SELECT monto_disponible FROM partidas_presupuestarias WHERE id_partida = $1 FOR UPDATE",
        [data.id_partida]
      );
      if (partidaRes.rows.length === 0) {
        throw new Error("La partida presupuestaria especificada no existe.");
      }
      const montoDisponible = parseFloat(partidaRes.rows[0].monto_disponible);
      const montoReservado = parseFloat(data.monto_reservado);
      if (montoReservado > montoDisponible) {
        throw new Error(
          `El monto solicitado (Q${montoReservado.toFixed(2)}) excede el saldo disponible de la partida (Q${montoDisponible.toFixed(2)}).`
        );
      }

      const numeroCdp = await this._generarSiguienteNumeroCdp(client);

      await client.query(
        `INSERT INTO cdp
           (id_expediente, id_partida, numero_cdp, monto_reservado, estado,
            elaborado_por_usuario_id, fecha_elaboracion)
         VALUES ($1, $2, $3, $4, 'Borrador', $5, CURRENT_TIMESTAMP)`,
        [idExpediente, data.id_partida, numeroCdp, montoReservado, usuarioId]
      );

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: "CDP elaborado",
          entidadRelacionada: "cdp",
          observacion: `Borrador ${numeroCdp} por Q${montoReservado.toFixed(2)}.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /** CU-03 (paso 6): Encargado de Presupuesto aprueba técnicamente el CDP. */
  async aprobarCdp(idCdp, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const cdpRes = await client.query(
        "SELECT id_expediente, estado, numero_cdp FROM cdp WHERE id_cdp = $1 FOR UPDATE",
        [idCdp]
      );
      if (cdpRes.rows.length === 0) {
        throw new Error("El CDP especificado no existe.");
      }
      const cdpActual = cdpRes.rows[0];
      if (cdpActual.estado !== "Borrador") {
        throw new Error(
          `El CDP debe estar en estado "Borrador" para aprobarse (estado actual: "${cdpActual.estado}").`
        );
      }

      const firmaHash = this._generarFirmaHash(`cdp:${idCdp}:aprobar:${usuarioId}`);

      await client.query(
        `UPDATE cdp SET
           estado = 'Aprobado Técnicamente',
           aprobado_presupuesto_usuario_id = $1,
           fecha_aprobacion_presupuesto = CURRENT_TIMESTAMP,
           firma_hash_presupuesto = $2
         WHERE id_cdp = $3`,
        [usuarioId, firmaHash, idCdp]
      );

      await this._registrarBitacora(
        {
          idExpediente: cdpActual.id_expediente,
          usuarioId,
          accion: "CDP aprobado técnicamente",
          entidadRelacionada: "cdp",
          observacion: `${cdpActual.numero_cdp} aprobado por Encargado de Presupuesto.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(cdpActual.id_expediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * CU-03 (cierre): Jefe UDAF da Vo.Bo. financiero final al CDP.
   * Aquí sí se descuenta en firme el saldo de la partida presupuestaria,
   * y el expediente avanza a la siguiente etapa macro ("Revisión Jurídica").
   */
  async voboCdp(idCdp, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const cdpRes = await client.query(
        "SELECT id_expediente, id_partida, monto_reservado, estado, numero_cdp FROM cdp WHERE id_cdp = $1 FOR UPDATE",
        [idCdp]
      );
      if (cdpRes.rows.length === 0) {
        throw new Error("El CDP especificado no existe.");
      }
      const cdpActual = cdpRes.rows[0];
      if (cdpActual.estado !== "Aprobado Técnicamente") {
        throw new Error(
          `El CDP debe tener aprobación técnica antes del Vo.Bo. financiero (estado actual: "${cdpActual.estado}").`
        );
      }

      const firmaHash = this._generarFirmaHash(`cdp:${idCdp}:vobo:${usuarioId}`);

      await client.query(
        `UPDATE cdp SET
           estado = 'Aprobado',
           vobo_udaf_usuario_id = $1,
           fecha_vobo_udaf = CURRENT_TIMESTAMP,
           firma_hash_udaf = $2
         WHERE id_cdp = $3`,
        [usuarioId, firmaHash, idCdp]
      );

      await client.query(
        `UPDATE partidas_presupuestarias
         SET monto_disponible = monto_disponible - $1
         WHERE id_partida = $2`,
        [cdpActual.monto_reservado, cdpActual.id_partida]
      );

      const estadoRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'Revisión Jurídica'"
      );
      const idNuevoEstado = estadoRes.rows[0]?.id_estado;

      await client.query(
        `UPDATE expedientes
         SET id_estado_actual = COALESCE($1, id_estado_actual), fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $2`,
        [idNuevoEstado, cdpActual.id_expediente]
      );

      await this._registrarBitacora(
        {
          idExpediente: cdpActual.id_expediente,
          usuarioId,
          accion: "Vo.Bo. financiero del CDP",
          entidadRelacionada: "cdp",
          observacion: `${cdpActual.numero_cdp} aprobado en firme por UDAF. Reservado Q${parseFloat(cdpActual.monto_reservado).toFixed(2)} de la partida.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(cdpActual.id_expediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------
  // ORDEN DE COMPRA (CU-04)
  // ---------------------------------------------------------------------

  async _generarSiguienteNumeroOc(client) {
    const anio = new Date().getFullYear();
    const prefijo = `OC-${anio}-`;
    const res = await client.query("SELECT COUNT(*)::int AS total FROM ordenes_compra WHERE numero_oc LIKE $1", [
      `${prefijo}%`,
    ]);
    const siguiente = res.rows[0].total + 1;
    return `${prefijo}${String(siguiente).padStart(4, "0")}`;
  }

  /**
   * CU-04 (paso 9): Analista de Adquisiciones elabora la Orden de Compra.
   * El CDP y el proveedor adjudicado NO se piden por body: se derivan del
   * propio expediente (el CDP debe estar "Aprobado" en firme, y el proveedor
   * es el de la cotización marcada `es_adjudicada`) para que no se puedan
   * falsificar desde el cliente. Al quedar el borrador listo, el expediente
   * avanza a "Aprobación Jefatura", quedando a la espera del paso 10.
   */
  async elaborarOrdenCompra(idExpediente, data, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const expRes = await client.query("SELECT id_expediente FROM expedientes WHERE id_expediente = $1", [
        idExpediente,
      ]);
      if (expRes.rows.length === 0) {
        throw new Error("Expediente no encontrado.");
      }

      const existeRes = await client.query("SELECT id_orden_compra FROM ordenes_compra WHERE id_expediente = $1", [
        idExpediente,
      ]);
      if (existeRes.rows.length > 0) {
        throw new Error("Este expediente ya tiene una Orden de Compra elaborada.");
      }

      const cdpRes = await client.query(
        "SELECT id_cdp, estado, monto_reservado FROM cdp WHERE id_expediente = $1",
        [idExpediente]
      );
      if (cdpRes.rows.length === 0 || cdpRes.rows[0].estado !== "Aprobado") {
        throw new Error("El expediente debe tener un CDP aprobado en firme antes de elaborar la Orden de Compra.");
      }
      const cdp = cdpRes.rows[0];

      const cotizacionRes = await client.query(
        "SELECT id_proveedor FROM cotizaciones WHERE id_expediente = $1 AND es_adjudicada = TRUE",
        [idExpediente]
      );
      if (cotizacionRes.rows.length === 0) {
        throw new Error("El expediente no tiene una cotización adjudicada para determinar el proveedor.");
      }
      const idProveedorAdjudicado = cotizacionRes.rows[0].id_proveedor;

      const montoTotal = parseFloat(data.monto_total);
      if (montoTotal > parseFloat(cdp.monto_reservado)) {
        throw new Error(
          `El monto de la Orden de Compra (Q${montoTotal.toFixed(2)}) no puede exceder el monto reservado en el CDP (Q${parseFloat(cdp.monto_reservado).toFixed(2)}).`
        );
      }

      const numeroOc = await this._generarSiguienteNumeroOc(client);

      await client.query(
        `INSERT INTO ordenes_compra
           (id_expediente, id_cdp, id_proveedor_adjudicado, numero_oc, monto_total,
            plazo_entrega, lugar_entrega, estado, elaborado_por_usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Borrador', $8)`,
        [
          idExpediente,
          cdp.id_cdp,
          idProveedorAdjudicado,
          numeroOc,
          montoTotal,
          data.plazo_entrega || null,
          data.lugar_entrega || null,
          usuarioId,
        ]
      );

      const estadoRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'Aprobación Jefatura'"
      );
      const idNuevoEstado = estadoRes.rows[0]?.id_estado;

      await client.query(
        `UPDATE expedientes
         SET id_estado_actual = COALESCE($1, id_estado_actual), fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $2`,
        [idNuevoEstado, idExpediente]
      );

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: "Orden de Compra elaborada",
          entidadRelacionada: "ordenes_compra",
          observacion: `Borrador ${numeroOc} por Q${montoTotal.toFixed(2)}.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /** CU-04 (paso 10): Jefe de Adquisiciones aprueba técnicamente la Orden de Compra. */
  async aprobarOrdenCompra(idOrdenCompra, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const ocRes = await client.query(
        "SELECT id_expediente, estado, numero_oc FROM ordenes_compra WHERE id_orden_compra = $1 FOR UPDATE",
        [idOrdenCompra]
      );
      if (ocRes.rows.length === 0) {
        throw new Error("La Orden de Compra especificada no existe.");
      }
      const ocActual = ocRes.rows[0];
      if (ocActual.estado !== "Borrador") {
        throw new Error(
          `La Orden de Compra debe estar en estado "Borrador" para aprobarse (estado actual: "${ocActual.estado}").`
        );
      }

      const firmaHash = this._generarFirmaHash(`oc:${idOrdenCompra}:aprobar:${usuarioId}`);

      await client.query(
        `UPDATE ordenes_compra SET
           estado = 'Aprobada Jefatura',
           aprobado_jefe_usuario_id = $1,
           fecha_aprobacion_jefe = CURRENT_TIMESTAMP,
           firma_hash_jefe = $2
         WHERE id_orden_compra = $3`,
        [usuarioId, firmaHash, idOrdenCompra]
      );

      const estadoRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'Pendiente Autorización Final'"
      );
      const idNuevoEstado = estadoRes.rows[0]?.id_estado;

      await client.query(
        `UPDATE expedientes
         SET id_estado_actual = COALESCE($1, id_estado_actual), fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $2`,
        [idNuevoEstado, ocActual.id_expediente]
      );

      await this._registrarBitacora(
        {
          idExpediente: ocActual.id_expediente,
          usuarioId,
          accion: "Orden de Compra aprobada por Jefatura",
          entidadRelacionada: "ordenes_compra",
          observacion: `${ocActual.numero_oc} aprobada técnicamente por Jefe de Adquisiciones.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(ocActual.id_expediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * CU-04 (paso 11): Directora General autoriza y emite la Orden de Compra en firme.
   * Se marca `fecha_notificacion_proveedor` en el mismo paso: el CU no define
   * un endpoint separado para notificar al proveedor, y este módulo no envía
   * correos todavía, así que se deja constancia de que la OC quedó lista para
   * notificarse en cuanto se autoriza.
   */
  async autorizarOrdenCompra(idOrdenCompra, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const ocRes = await client.query(
        "SELECT id_expediente, estado, numero_oc FROM ordenes_compra WHERE id_orden_compra = $1 FOR UPDATE",
        [idOrdenCompra]
      );
      if (ocRes.rows.length === 0) {
        throw new Error("La Orden de Compra especificada no existe.");
      }
      const ocActual = ocRes.rows[0];
      if (ocActual.estado !== "Aprobada Jefatura") {
        throw new Error(
          `La Orden de Compra debe tener aprobación de Jefatura antes de autorizarse (estado actual: "${ocActual.estado}").`
        );
      }

      const firmaHash = this._generarFirmaHash(`oc:${idOrdenCompra}:autorizar:${usuarioId}`);

      await client.query(
        `UPDATE ordenes_compra SET
           estado = 'Emitida',
           autorizado_directora_usuario_id = $1,
           fecha_autorizacion_directora = CURRENT_TIMESTAMP,
           firma_hash_directora = $2,
           fecha_notificacion_proveedor = CURRENT_TIMESTAMP
         WHERE id_orden_compra = $3`,
        [usuarioId, firmaHash, idOrdenCompra]
      );

      const estadoRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'Expediente en Conformación'"
      );
      const idNuevoEstado = estadoRes.rows[0]?.id_estado;

      await client.query(
        `UPDATE expedientes
         SET id_estado_actual = COALESCE($1, id_estado_actual), fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $2`,
        [idNuevoEstado, ocActual.id_expediente]
      );

      await this._registrarBitacora(
        {
          idExpediente: ocActual.id_expediente,
          usuarioId,
          accion: "Orden de Compra autorizada y emitida",
          entidadRelacionada: "ordenes_compra",
          observacion: `${ocActual.numero_oc} autorizada en firme por Directora General. Notificada al proveedor.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(ocActual.id_expediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------
  // RECEPCIÓN Y DOCUMENTOS DE SOPORTE (CU-05 / CU-06)
  // ---------------------------------------------------------------------

  /**
   * CU-05: el Analista de Adquisiciones confirma la compra con el proveedor
   * y registra la recepción del bien/servicio. La Orden de Compra debe estar
   * "Emitida" (CU-04 completo) y solo puede existir una recepción por OC.
   * No cambia el estado del expediente por sí sola: el traslado a Contabilidad
   * (CU-06) es el que avanza el trámite, y exige que la recepción esté conforme.
   */
  async registrarRecepcion(idOrdenCompra, data, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const ocRes = await client.query(
        "SELECT id_orden_compra, id_expediente, estado, numero_oc FROM ordenes_compra WHERE id_orden_compra = $1",
        [idOrdenCompra]
      );
      if (ocRes.rows.length === 0) {
        throw new Error("Orden de Compra no encontrada.");
      }
      const oc = ocRes.rows[0];
      if (oc.estado !== "Emitida") {
        throw new Error("La Orden de Compra debe estar emitida antes de registrar la recepción.");
      }

      const existeRes = await client.query("SELECT id_recepcion FROM recepciones WHERE id_orden_compra = $1", [
        idOrdenCompra,
      ]);
      if (existeRes.rows.length > 0) {
        throw new Error("Esta Orden de Compra ya tiene una recepción registrada.");
      }

      const recibidoConforme = data.recibido_conforme === true || data.recibido_conforme === "true";

      await client.query(
        `INSERT INTO recepciones
           (id_orden_compra, fecha_hora_recepcion, recibido_conforme, dictamen_fisico,
            tecnico_receptor_usuario_id, observaciones)
         VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5)`,
        [idOrdenCompra, recibidoConforme, data.dictamen_fisico || null, usuarioId, data.observaciones || null]
      );

      await this._registrarBitacora(
        {
          idExpediente: oc.id_expediente,
          usuarioId,
          accion: "Recepción registrada",
          entidadRelacionada: "recepciones",
          observacion: `Recepción de ${oc.numero_oc}: ${recibidoConforme ? "recibido conforme" : "recibido con observaciones"}.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(oc.id_expediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * CU-06 (primera parte): adjunta un documento de soporte (factura, Hoja 1H,
   * egreso de almacén, certificado de satisfacción u otro) al expediente.
   * Tabla genérica (decisión de diseño #7): se puede llamar varias veces para
   * ir completando el expediente antes de trasladarlo a Contabilidad.
   */
  async adjuntarDocumentoSoporte(idExpediente, data, archivoUrl, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const expRes = await client.query("SELECT id_expediente FROM expedientes WHERE id_expediente = $1", [
        idExpediente,
      ]);
      if (expRes.rows.length === 0) {
        throw new Error("Expediente no encontrado.");
      }

      const result = await client.query(
        `INSERT INTO documentos_soporte
           (id_expediente, tipo_documento, numero_documento, archivo_url, fecha_documento, subido_por_usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id_documento`,
        [
          idExpediente,
          data.tipo_documento,
          data.numero_documento || null,
          archivoUrl,
          data.fecha_documento || null,
          usuarioId,
        ]
      );

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: "Documento de soporte adjuntado",
          entidadRelacionada: "documentos_soporte",
          observacion: `${data.tipo_documento} adjuntado (documento #${result.rows[0].id_documento}).`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * CU-06 (segunda parte): traslada el expediente a Contabilidad para iniciar
   * la fase financiera (CU-07/08/09). Exige una recepción conforme y al menos
   * un documento de soporte adjuntado.
   */
  async trasladarAContabilidad(idExpediente, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const expRes = await client.query(
        `SELECT e.id_expediente, est.nombre AS estado
         FROM expedientes e
         JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
         WHERE e.id_expediente = $1
         FOR UPDATE OF e`,
        [idExpediente]
      );
      if (expRes.rows.length === 0) {
        throw new Error("Expediente no encontrado.");
      }
      if (expRes.rows[0].estado !== "Expediente en Conformación") {
        throw new Error(
          'El expediente debe estar en estado "Expediente en Conformación" para trasladarlo a Contabilidad.'
        );
      }

      const recepcionRes = await client.query(
        `SELECT rc.recibido_conforme
         FROM recepciones rc
         JOIN ordenes_compra oc ON rc.id_orden_compra = oc.id_orden_compra
         WHERE oc.id_expediente = $1`,
        [idExpediente]
      );
      if (recepcionRes.rows.length === 0) {
        throw new Error("Debe registrarse la recepción del bien/servicio antes de trasladar el expediente a Contabilidad.");
      }
      if (!recepcionRes.rows[0].recibido_conforme) {
        throw new Error(
          "La recepción no está conforme — resuelva las observaciones antes de trasladar el expediente a Contabilidad."
        );
      }

      const documentosRes = await client.query(
        "SELECT COUNT(*)::int AS total FROM documentos_soporte WHERE id_expediente = $1",
        [idExpediente]
      );
      if (documentosRes.rows[0].total === 0) {
        throw new Error("Debe adjuntar al menos un documento de soporte antes de trasladar el expediente a Contabilidad.");
      }

      const estadoRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'Fase Financiera / Liquidación'"
      );
      const idNuevoEstado = estadoRes.rows[0]?.id_estado;

      await client.query(
        `UPDATE expedientes
         SET id_estado_actual = COALESCE($1, id_estado_actual), fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $2`,
        [idNuevoEstado, idExpediente]
      );

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: "Expediente trasladado a Contabilidad",
          entidadRelacionada: "expedientes",
          observacion: "Inicia la fase financiera (compromiso, devengado y solicitud de pago).",
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------
  // FASE FINANCIERA: COMPROMISO, DEVENGADO, SOLICITUD DE PAGO (CU-07/08/09)
  // ---------------------------------------------------------------------

  async _generarSiguienteNumeroComp(client) {
    const anio = new Date().getFullYear();
    const prefijo = `COMP-${anio}-`;
    const res = await client.query(
      "SELECT COUNT(*)::int AS total FROM compromisos_presupuestarios WHERE numero_comp LIKE $1",
      [`${prefijo}%`]
    );
    const siguiente = res.rows[0].total + 1;
    return `${prefijo}${String(siguiente).padStart(4, "0")}`;
  }

  async _generarSiguienteNumeroDev(client) {
    const anio = new Date().getFullYear();
    const prefijo = `DEV-${anio}-`;
    const res = await client.query("SELECT COUNT(*)::int AS total FROM devengados WHERE numero_dev LIKE $1", [
      `${prefijo}%`,
    ]);
    const siguiente = res.rows[0].total + 1;
    return `${prefijo}${String(siguiente).padStart(4, "0")}`;
  }

  /**
   * CU-07 (paso 17): el Encargado de Presupuesto registra el compromiso
   * presupuestario. Exige el expediente en "Fase Financiera / Liquidación"
   * (CU-06 completo) y valida el monto contra el CDP, igual que CU-04 valida
   * la Orden de Compra contra el CDP (decisión de diseño #3).
   */
  async registrarCompromiso(idExpediente, data, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const expRes = await client.query(
        `SELECT e.id_expediente, est.nombre AS estado
         FROM expedientes e
         JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
         WHERE e.id_expediente = $1`,
        [idExpediente]
      );
      if (expRes.rows.length === 0) {
        throw new Error("Expediente no encontrado.");
      }
      if (expRes.rows[0].estado !== "Fase Financiera / Liquidación") {
        throw new Error(
          'El expediente debe estar en estado "Fase Financiera / Liquidación" para registrar el compromiso.'
        );
      }

      const existeRes = await client.query(
        "SELECT id_compromiso FROM compromisos_presupuestarios WHERE id_expediente = $1",
        [idExpediente]
      );
      if (existeRes.rows.length > 0) {
        throw new Error("Este expediente ya tiene un compromiso presupuestario registrado.");
      }

      const cdpRes = await client.query("SELECT monto_reservado FROM cdp WHERE id_expediente = $1", [idExpediente]);
      if (cdpRes.rows.length === 0) {
        throw new Error("El expediente no tiene un CDP asociado.");
      }
      const montoComprometido = parseFloat(data.monto_comprometido);
      if (montoComprometido > parseFloat(cdpRes.rows[0].monto_reservado)) {
        throw new Error(
          `El monto comprometido (Q${montoComprometido.toFixed(2)}) no puede exceder el monto reservado en el CDP (Q${parseFloat(cdpRes.rows[0].monto_reservado).toFixed(2)}).`
        );
      }

      const numeroComp = await this._generarSiguienteNumeroComp(client);

      await client.query(
        `INSERT INTO compromisos_presupuestarios
           (id_expediente, numero_comp, monto_comprometido, estado, registrado_por_usuario_id, fecha_registro)
         VALUES ($1, $2, $3, 'Registrado', $4, CURRENT_TIMESTAMP)`,
        [idExpediente, numeroComp, montoComprometido, usuarioId]
      );

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: "Compromiso presupuestario registrado",
          entidadRelacionada: "compromisos_presupuestarios",
          observacion: `${numeroComp} por Q${montoComprometido.toFixed(2)}.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * CU-08 (paso 19): el Encargado de Contabilidad registra el devengado.
   * 1:1 con el compromiso; el monto devengado no puede exceder lo comprometido.
   */
  async registrarDevengado(idCompromiso, data, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const compromisoRes = await client.query(
        "SELECT id_compromiso, id_expediente, monto_comprometido FROM compromisos_presupuestarios WHERE id_compromiso = $1",
        [idCompromiso]
      );
      if (compromisoRes.rows.length === 0) {
        throw new Error("Compromiso presupuestario no encontrado.");
      }
      const compromiso = compromisoRes.rows[0];

      const existeRes = await client.query("SELECT id_devengado FROM devengados WHERE id_compromiso = $1", [
        idCompromiso,
      ]);
      if (existeRes.rows.length > 0) {
        throw new Error("Este compromiso ya tiene un devengado registrado.");
      }

      const montoDevengado = parseFloat(data.monto_devengado);
      if (montoDevengado > parseFloat(compromiso.monto_comprometido)) {
        throw new Error(
          `El monto devengado (Q${montoDevengado.toFixed(2)}) no puede exceder el monto comprometido (Q${parseFloat(compromiso.monto_comprometido).toFixed(2)}).`
        );
      }
      const retencionIsr = data.retencion_isr != null ? parseFloat(data.retencion_isr) : 0;

      const numeroDev = await this._generarSiguienteNumeroDev(client);

      await client.query(
        `INSERT INTO devengados
           (id_compromiso, numero_dev, monto_devengado, retencion_isr, estado, registrado_por_usuario_id, fecha_registro)
         VALUES ($1, $2, $3, $4, 'Registrado', $5, CURRENT_TIMESTAMP)`,
        [idCompromiso, numeroDev, montoDevengado, retencionIsr, usuarioId]
      );

      await this._registrarBitacora(
        {
          idExpediente: compromiso.id_expediente,
          usuarioId,
          accion: "Devengado registrado",
          entidadRelacionada: "devengados",
          observacion: `${numeroDev} por Q${montoDevengado.toFixed(2)} (retención ISR Q${retencionIsr.toFixed(2)}).`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(compromiso.id_expediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * CU-09 (paso 21): el Encargado de Contabilidad traslada la solicitud de
   * pago con los datos bancarios del proveedor. 1:1 con el devengado.
   */
  async solicitarPago(idDevengado, data, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const devengadoRes = await client.query(
        `SELECT dv.id_devengado, cp.id_expediente
         FROM devengados dv
         JOIN compromisos_presupuestarios cp ON dv.id_compromiso = cp.id_compromiso
         WHERE dv.id_devengado = $1`,
        [idDevengado]
      );
      if (devengadoRes.rows.length === 0) {
        throw new Error("Devengado no encontrado.");
      }
      const { id_expediente: idExpediente } = devengadoRes.rows[0];

      const existeRes = await client.query("SELECT id_solicitud_pago FROM solicitudes_pago WHERE id_devengado = $1", [
        idDevengado,
      ]);
      if (existeRes.rows.length > 0) {
        throw new Error("Este devengado ya tiene una solicitud de pago registrada.");
      }

      await client.query(
        `INSERT INTO solicitudes_pago
           (id_devengado, entidad_bancaria, tipo_cuenta, numero_cuenta, numero_transferencia_cheque,
            estado, solicitado_por_usuario_id, fecha_solicitud)
         VALUES ($1, $2, $3, $4, $5, 'Pendiente', $6, CURRENT_TIMESTAMP)`,
        [
          idDevengado,
          data.entidad_bancaria,
          data.tipo_cuenta,
          data.numero_cuenta,
          data.numero_transferencia_cheque || null,
          usuarioId,
        ]
      );

      await this._registrarBitacora(
        {
          idExpediente,
          usuarioId,
          accion: "Solicitud de pago trasladada",
          entidadRelacionada: "solicitudes_pago",
          observacion: `Depósito a ${data.entidad_bancaria}, cuenta ${data.tipo_cuenta} #${data.numero_cuenta}.`,
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(idExpediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * CU-09 (pasos 22-23): Sub Despacho tramita y autoriza el pago, y el
   * expediente queda archivado — cierra el ciclo completo del proceso.
   */
  async autorizarPago(idSolicitudPago, usuarioId) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const solicitudRes = await client.query(
        `SELECT sp.id_solicitud_pago, sp.estado, cp.id_expediente
         FROM solicitudes_pago sp
         JOIN devengados dv ON sp.id_devengado = dv.id_devengado
         JOIN compromisos_presupuestarios cp ON dv.id_compromiso = cp.id_compromiso
         WHERE sp.id_solicitud_pago = $1`,
        [idSolicitudPago]
      );
      if (solicitudRes.rows.length === 0) {
        throw new Error("Solicitud de pago no encontrada.");
      }
      const solicitud = solicitudRes.rows[0];
      if (solicitud.estado !== "Pendiente") {
        throw new Error("La solicitud de pago ya fue tramitada.");
      }

      await client.query(
        `UPDATE solicitudes_pago
         SET estado = 'Tramitado', tramitado_por_usuario_id = $1,
             fecha_tramite = CURRENT_TIMESTAMP, fecha_archivo = CURRENT_TIMESTAMP
         WHERE id_solicitud_pago = $2`,
        [usuarioId, idSolicitudPago]
      );

      const estadoRes = await client.query("SELECT id_estado FROM estados_expediente WHERE nombre = 'Pagado y Archivado'");
      const idNuevoEstado = estadoRes.rows[0]?.id_estado;

      await client.query(
        `UPDATE expedientes
         SET id_estado_actual = COALESCE($1, id_estado_actual), fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $2`,
        [idNuevoEstado, solicitud.id_expediente]
      );

      await this._registrarBitacora(
        {
          idExpediente: solicitud.id_expediente,
          usuarioId,
          accion: "Pago autorizado y expediente archivado",
          entidadRelacionada: "solicitudes_pago",
          observacion: "Pago tramitado por Sub Despacho. Cierra el ciclo completo del proceso de adquisición (CU-01 a CU-09).",
        },
        client
      );

      await client.query("COMMIT");
      return this.getExpedienteById(solicitud.id_expediente);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------
  // REPORTES / VISTAS ADMINISTRATIVAS (listados cross-expediente)
  // ---------------------------------------------------------------------
  // Estos métodos NO filtran por expediente: juntan la información de TODOS
  // los expedientes para las secciones nuevas del sidebar (admin). De
  // momento no llevan paginación ni filtros en el backend -- el volumen de
  // Baja Cuantía no lo justifica todavía y los filtros/búsqueda se resuelven
  // en el frontend sobre el arreglo ya cargado. Si el volumen crece, migrar
  // a limit/offset como getExpedientes().

  async getReporteCotizaciones() {
    const result = await adquisicionesPool.query(
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
    return result.rows;
  }

  async getReporteCdp() {
    const result = await adquisicionesPool.query(
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
    return result.rows;
  }

  async getReporteOrdenesCompra() {
    const result = await adquisicionesPool.query(
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
    return result.rows;
  }

  async getReporteFinanciera() {
    const [compromisos, devengados, solicitudesPago] = await Promise.all([
      adquisicionesPool.query(
        `SELECT
           co.id_compromiso, co.numero_comp, co.monto_comprometido, co.estado, co.fecha_registro,
           e.id_expediente, e.codigo_expediente, e.objeto_compra
         FROM compromisos_presupuestarios co
         JOIN expedientes e ON co.id_expediente = e.id_expediente
         ORDER BY co.id_compromiso DESC`
      ),
      adquisicionesPool.query(
        `SELECT
           d.id_devengado, d.numero_dev, d.monto_devengado, d.retencion_isr, d.estado, d.fecha_registro,
           co.id_compromiso, co.numero_comp,
           e.id_expediente, e.codigo_expediente, e.objeto_compra
         FROM devengados d
         JOIN compromisos_presupuestarios co ON d.id_compromiso = co.id_compromiso
         JOIN expedientes e ON co.id_expediente = e.id_expediente
         ORDER BY d.id_devengado DESC`
      ),
      adquisicionesPool.query(
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
      ),
    ]);
    return {
      compromisos: compromisos.rows,
      devengados: devengados.rows,
      solicitudes_pago: solicitudesPago.rows,
    };
  }

  async getReporteResumen() {
    const [porEstado, montos, conteos] = await Promise.all([
      adquisicionesPool.query(
        `SELECT est.id_estado, est.nombre AS estado, est.color, COUNT(e.id_expediente)::int AS cantidad
         FROM estados_expediente est
         LEFT JOIN expedientes e ON e.id_estado_actual = est.id_estado
         GROUP BY est.id_estado, est.nombre, est.color
         ORDER BY est.id_estado`
      ),
      adquisicionesPool.query(
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
      ),
      adquisicionesPool.query(
        `SELECT
           (SELECT COUNT(*) FROM expedientes)::int AS total_expedientes,
           (SELECT COUNT(*) FROM expedientes e JOIN estados_expediente est ON e.id_estado_actual = est.id_estado WHERE est.es_final = FALSE)::int AS expedientes_activos,
           (SELECT COUNT(*) FROM cotizaciones)::int AS total_cotizaciones,
           (SELECT COUNT(*) FROM cdp)::int AS total_cdp,
           (SELECT COUNT(*) FROM ordenes_compra)::int AS total_ordenes_compra,
           (SELECT COUNT(*) FROM devoluciones_observaciones WHERE estado = 'Pendiente')::int AS devoluciones_pendientes`
      ),
    ]);
    return {
      por_estado: porEstado.rows,
      montos: montos.rows[0],
      conteos: conteos.rows[0],
    };
  }

  // ---------------------------------------------------------------------
  // PDF de la Solicitud de Compra (FOR-DG-UA-00-01)
  // ---------------------------------------------------------------------

  /**
   * Ubica el binario de Chromium instalado en la imagen Docker (paquete "chromium"
   * de Alpine). Se prueba primero la variable de entorno CHROMIUM_PATH (definida
   * en el Dockerfile) y luego las rutas típicas, por si el nombre del binario
   * cambia entre versiones de la imagen base.
   */
  _resolveChromiumPath() {
    const candidatos = [
      process.env.CHROMIUM_PATH,
      process.env.PUPPETEER_EXECUTABLE_PATH,
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/lib/chromium/chromium",
    ].filter(Boolean);
    const encontrado = candidatos.find((p) => fs.existsSync(p));
    if (!encontrado) {
      throw new Error(
        "No se encontró el binario de Chromium en el servidor (se probaron: " +
          candidatos.join(", ") +
          "). Revisa la instalación de 'chromium' en el Dockerfile."
      );
    }
    return encontrado;
  }

  /**
   * Genera el PDF de la Solicitud de Compra (FOR-DG-UA-00-01) renderizando una
   * plantilla HTML (api/src/templates/adquisiciones/solicitud-compra-html.template.js)
   * con Chromium headless vía puppeteer-core.
   *
   * Se abandonó el enfoque anterior de plantilla DOCX + easy-template-x porque el
   * formulario oficial real está construido en Word como una cuadrícula de celdas
   * (una letra por celda), lo que hacía imposible insertar tags de texto variable
   * sin romper el documento. El HTML replica el diseño visual del formulario real
   * (incluyendo el logo oficial) y la página de ANEXO solo se agrega cuando
   * expediente.tiene_anexo es verdadero.
   */
  async generarSolicitudPdf(idExpediente) {
    if (!puppeteer) {
      throw new Error(
        "Falta la dependencia 'puppeteer-core' en el servidor. Ejecuta 'npm install' en /api y reconstruye el contenedor."
      );
    }

    const expediente = await this.getExpedienteById(idExpediente);
    if (!expediente) {
      throw new Error("Expediente no encontrado.");
    }

    const items = Array.isArray(expediente.items) ? expediente.items : [];
    const dividirLineas = (texto) =>
      (texto || "")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const data = {
      codigo_formulario: expediente.codigo_formulario || "FOR-DG-UA-00-01",
      unidad_solicitante: expediente.unidad_solicitante || "",
      codigo_expediente: expediente.codigo_expediente || "",
      fecha_solicitud: expediente.fecha_creacion
        ? new Date(expediente.fecha_creacion).toLocaleDateString("es-GT")
        : "",
      tipo_compra: expediente.tipo_compra || "",
      tiene_anexo: !!expediente.tiene_anexo,
      justificacion: expediente.justificacion || "",
      firma1_nombre: expediente.usuario_solicitante_nombre || "",
      firma1_cargo: expediente.funcionario_responsable || "",
      firma2_nombre: expediente.firma2_usuario_nombre || "",
      firma2_cargo: expediente.firma2_cargo || "",
      items: items.map((item) => ({
        item_descripcion: item.descripcion || "",
        item_cantidad: item.cantidad || "",
        item_unidad: item.unidad_medida || "",
        item_codigo_insumo: item.codigo_insumo || "-",
        item_renglon: item.renglon_numero ? `${item.renglon_numero}` : "-",
      })),
      caracteristicasLineas: dividirLineas(expediente.anexo_caracteristicas_tecnicas),
      especificacionesLineas: dividirLineas(expediente.anexo_especificaciones_especiales),
    };

    const html = buildSolicitudCompraHtml(data);

    const browser = await puppeteer.launch({
      executablePath: this._resolveChromiumPath(),
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
      });
      return { buffer: pdfBuffer, codigoExpediente: expediente.codigo_expediente };
    } finally {
      await browser.close();
    }
  }
}

module.exports = new AdquisicionesService();
