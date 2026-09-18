// api/src/services/adquisiciones.service.js
// Módulo: SICOMPRAS - Adquisiciones (Baja Cuantía)
// Mismo patrón de 3 capas que pac.service.js / juridica (controller -> service -> pool)

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
   * Genera el siguiente código correlativo para la unidad y año actual.
   * NOTA: cuenta expedientes existentes con el mismo prefijo dentro de la
   * misma transacción; para volúmenes altos con alta concurrencia conviene
   * migrar a una tabla `adquisiciones_correlativos` como la de PAC
   * (pac_correlativos) — no bloquea el MVP.
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
    const prefijo = `ADQ-${codigoUnidad}-${anio}-`;

    const resConteo = await client.query(
      "SELECT COUNT(*)::int AS total FROM expedientes WHERE codigo_expediente LIKE $1",
      [`${prefijo}%`]
    );
    const siguienteNumero = resConteo.rows[0].total + 1;

    return `${prefijo}${String(siguienteNumero).padStart(3, "0")}`;
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

      const insertExpediente = await client.query(
        `INSERT INTO expedientes
           (codigo_expediente, id_unidad_solicitante, usuario_solicitante_id, funcionario_responsable,
            objeto_compra, justificacion, monto_estimado, modalidad, id_estado_actual, documento_especificaciones_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        ]
      );
      const { id_expediente, codigo_expediente } = insertExpediente.rows[0];

      const items = Array.isArray(data.items) ? data.items : [];
      for (const item of items) {
        await client.query(
          `INSERT INTO expediente_items
             (id_expediente, descripcion, cantidad, unidad_medida, costo_unitario_estimado)
           VALUES ($1, $2, $3, $4, $5)`,
          [id_expediente, item.descripcion, item.cantidad, item.unidad_medida, item.costo_unitario_estimado]
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
          SELECT json_agg(i.* ORDER BY i.id_item)
          FROM expediente_items i
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
        ) AS cotizaciones
      FROM expedientes e
      JOIN unidades_solicitantes u ON e.id_unidad_solicitante = u.id_unidad
      JOIN estados_expediente est ON e.id_estado_actual = est.id_estado
      WHERE e.id_expediente = $1 OR e.codigo_expediente = $1::text;
    `;
    // Permite buscar tanto por id numérico como por código (igual que pac.service.js hace por código)
    const result = await adquisicionesPool.query(query, [id]);
    if (result.rows.length === 0) return undefined;

    const expediente = result.rows[0];

    const usersResult = await usersDb.query(
      "SELECT nombre_completo FROM usuarios WHERE id_usuario = $1",
      [expediente.usuario_solicitante_id]
    );
    expediente.usuario_solicitante_nombre =
      usersResult.rows[0]?.nombre_completo || `Usuario #${expediente.usuario_solicitante_id}`;

    return expediente;
  }

  /** CU-01 (paso 2): recibir la solicitud y asignarla a un Analista. */
  async asignarExpediente(idExpediente, funcionarioResponsable, usuarioIdActor) {
    const client = await adquisicionesPool.connect();
    try {
      await client.query("BEGIN");

      const estadoRes = await client.query(
        "SELECT id_estado FROM estados_expediente WHERE nombre = 'Pendiente Cotización'"
      );
      const idNuevoEstado = estadoRes.rows[0]?.id_estado;

      const result = await client.query(
        `UPDATE expedientes
         SET funcionario_responsable = $1, id_estado_actual = COALESCE($2, id_estado_actual),
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_expediente = $3
         RETURNING id_expediente`,
        [funcionarioResponsable, idNuevoEstado, idExpediente]
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
          observacion: `Asignado a: ${funcionarioResponsable}`,
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
}

module.exports = new AdquisicionesService();
