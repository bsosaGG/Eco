// api/src/services/pac.service.js

const { pacPool } = require("../config/db-pac");
const usersDb = require("../config/db-users"); // <-- 1. Importar la conexión a la BD de usuarios

class PacService {
  /**
   * Genera el siguiente código correlativo para una unidad y año específicos.
   * Esta es una función interna y requiere ser llamada dentro de una transacción.
   * @private
   */
  async _generarSiguienteCodigo(idUnidad, anio, client) {
    const anioActual = anio || new Date().getFullYear();

    // 1. Obtener el prefijo de la unidad (ej. 'DIP', 'USG')
    const resUnidad = await client.query(
      "SELECT codigo_unidad FROM pac_unidades_solicitantes WHERE id_unidad = $1",
      [idUnidad]
    );
    if (resUnidad.rows.length === 0) {
      throw new Error("La unidad solicitante especificada no existe.");
    }
    const codigoUnidad = resUnidad.rows[0].codigo_unidad;

    // 2. Inserta o actualiza el correlativo para el año actual y obtiene el nuevo número.
    // La cláusula ON CONFLICT maneja de forma segura la creación del primer registro del año.
    const resCorr = await client.query(
      `INSERT INTO pac_correlativos (id_unidad, anio, ultimo_numero)
       VALUES ($1, $2, 1)
       ON CONFLICT (id_unidad, anio)
       DO UPDATE SET ultimo_numero = pac_correlativos.ultimo_numero + 1
       RETURNING ultimo_numero;`,
      [idUnidad, anioActual]
    );
    const nuevoNumero = resCorr.rows[0].ultimo_numero;

    // 3. Formatea el código final (ej. 'USG-001/2025')
    return `${codigoUnidad}-${String(nuevoNumero).padStart(
      3,
      "0"
    )}/${anioActual}`;
  }

  /**
   * Crea una nueva solicitud de compra en la base de datos.
   */
  async crearSolicitud(solicitudData, responsableUsuarioId) {
    const client = await pacPool.connect();
    try {
      await client.query("BEGIN"); // Iniciar transacción

      const nuevoCodigo = await this._generarSiguienteCodigo(
        solicitudData.id_unidad_solicitante,
        null,
        client
      );

      const estadoInicialRes = await client.query(
        "SELECT id_estado FROM pac_estados WHERE es_inicial = TRUE LIMIT 1"
      );
      if (estadoInicialRes.rows.length === 0) {
        throw new Error(
          "No se ha configurado un estado inicial en la base de datos."
        );
      }
      const estadoInicialId = estadoInicialRes.rows[0].id_estado;

      const querySolicitud = `
        INSERT INTO pac_solicitudes (
          codigo_solicitud, id_unidad_solicitante, id_modalidad_compra, id_renglon, 
          id_estado, descripcion, unidad_medida, es_baja_cuantia, responsable_usuario_id,
          cantidad_enero, monto_enero, cantidad_febrero, monto_febrero, cantidad_marzo, monto_marzo,
          cantidad_abril, monto_abril, cantidad_mayo, monto_mayo, cantidad_junio, monto_junio,
          cantidad_julio, monto_julio, cantidad_agosto, monto_agosto, cantidad_septiembre, monto_septiembre,
          cantidad_octubre, monto_octubre, cantidad_noviembre, monto_noviembre, cantidad_diciembre, monto_diciembre
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
                $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
        RETURNING id_solicitud, codigo_solicitud;
      `;

      const valuesSolicitud = [
        nuevoCodigo,
        solicitudData.id_unidad_solicitante,
        solicitudData.id_modalidad_compra,
        solicitudData.id_renglon,
        estadoInicialId, // Usamos el ID obtenido
        solicitudData.descripcion,
        solicitudData.unidad_medida,
        solicitudData.es_baja_cuantia || false,
        responsableUsuarioId,
        // ... (el resto de los 24 campos de cantidad y monto)
        solicitudData.cantidad_enero || 0,
        solicitudData.monto_enero || 0,
        solicitudData.cantidad_febrero || 0,
        solicitudData.monto_febrero || 0,
        solicitudData.cantidad_marzo || 0,
        solicitudData.monto_marzo || 0,
        solicitudData.cantidad_abril || 0,
        solicitudData.monto_abril || 0,
        solicitudData.cantidad_mayo || 0,
        solicitudData.monto_mayo || 0,
        solicitudData.cantidad_junio || 0,
        solicitudData.monto_junio || 0,
        solicitudData.cantidad_julio || 0,
        solicitudData.monto_julio || 0,
        solicitudData.cantidad_agosto || 0,
        solicitudData.monto_agosto || 0,
        solicitudData.cantidad_septiembre || 0,
        solicitudData.monto_septiembre || 0,
        solicitudData.cantidad_octubre || 0,
        solicitudData.monto_octubre || 0,
        solicitudData.cantidad_noviembre || 0,
        solicitudData.monto_noviembre || 0,
        solicitudData.cantidad_diciembre || 0,
        solicitudData.monto_diciembre || 0,
      ];

      const result = await client.query(querySolicitud, valuesSolicitud);
      const nuevaSolicitud = result.rows[0];

      // *** PASO CLAVE: INSERTAR EL PRIMER REGISTRO EN EL HISTORIAL ***
      await client.query(
        "INSERT INTO pac_historial_estados (id_solicitud, id_estado_nuevo, comentario, usuario_id_cambio) VALUES ($1, $2, $3, $4)",
        [
          nuevaSolicitud.id_solicitud,
          estadoInicialId,
          "Solicitud creada.",
          responsableUsuarioId,
        ]
      );

      await client.query("COMMIT");
      // Devolvemos el código para consistencia con los otros métodos
      return this.getSolicitudPorCodigo(nuevaSolicitud.codigo_solicitud);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateSolicitud(codigo, solicitudData) {
    // Construimos la query dinámicamente para actualizar solo los campos que vienen
    const fields = [
      "id_unidad_solicitante",
      "id_modalidad_compra",
      "id_renglon",
      "descripcion",
      "unidad_medida",
      "es_baja_cuantia",
      "cantidad_enero",
      "monto_enero",
      "cantidad_febrero",
      "monto_febrero",
      "cantidad_marzo",
      "monto_marzo",
      "cantidad_abril",
      "monto_abril",
      "cantidad_mayo",
      "monto_mayo",
      "cantidad_junio",
      "monto_junio",
      "cantidad_julio",
      "monto_julio",
      "cantidad_agosto",
      "monto_agosto",
      "cantidad_septiembre",
      "monto_septiembre",
      "cantidad_octubre",
      "monto_octubre",
      "cantidad_noviembre",
      "monto_noviembre",
      "cantidad_diciembre",
      "monto_diciembre",
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const field of fields) {
      if (solicitudData[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        values.push(solicitudData[field]);
      }
    }

    // Si no hay campos para actualizar, no hacemos nada.
    if (setClauses.length === 0) {
      // Opcional: podrías devolver la data existente o un mensaje.
      return this.getSolicitudPorCodigo(codigo);
    }

    values.push(codigo); // El último parámetro es el código para el WHERE

    const query = `
    UPDATE pac_solicitudes SET
      ${setClauses.join(", ")},
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE codigo_solicitud = $${paramIndex}
    RETURNING *;
  `;

    const result = await pacPool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtiene todas las solicitudes con filtros y paginación.
   */
  async getAllSolicitudes(queryParams) {
    const { limit = 10, offset = 0, unidad, estado, search } = queryParams;

    let baseQuery = `
      SELECT 
        s.id_solicitud, s.codigo_solicitud, s.descripcion, s.monto_total,
        u.nombre AS unidad_solicitante,
        e.nombre AS estado, e.color AS estado_color
      FROM pac_solicitudes s
      JOIN pac_unidades_solicitantes u ON s.id_unidad_solicitante = u.id_unidad
      JOIN pac_estados e ON s.id_estado = e.id_estado
    `;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (unidad) {
      conditions.push(`s.id_unidad_solicitante = $${paramIndex++}`);
      values.push(unidad);
    }
    if (estado) {
      conditions.push(`s.id_estado = $${paramIndex++}`);
      values.push(estado);
    }
    if (search) {
      conditions.push(
        `(s.descripcion ILIKE $${paramIndex++} OR s.codigo_solicitud ILIKE $${paramIndex++})`
      );
      values.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      baseQuery += " WHERE " + conditions.join(" AND ");
    }

    baseQuery += ` ORDER BY s.id_solicitud DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(limit, offset);

    const result = await pacPool.query(baseQuery, values);
    return result.rows;
  }

  /**
   * Obtiene una solicitud específica y enriquece los datos del historial con
   * nombres de la base de datos de usuarios.
   */
  async getSolicitudPorCodigo(codigo) {
    // Consulta 1: Obtener los datos principales de la base de datos del PAC
    const query = `
      SELECT 
        s.*,
        u.nombre AS unidad_solicitante,
        e.nombre AS estado,
        e.color AS estado_color,
        m.nombre AS modalidad_compra,
        r.numero_renglon,
        r.nombre AS nombre_renglon,
        (
          SELECT json_agg(
            json_build_object(
              'estado', he.nombre,
              'comentario', h.comentario,
              'fecha_cambio', h.fecha_cambio,
              'usuario_id_cambio', h.usuario_id_cambio -- Obtenemos el ID del usuario
            ) ORDER BY h.fecha_cambio DESC
          )
          FROM pac_historial_estados h
          JOIN pac_estados he ON h.id_estado_nuevo = he.id_estado
          WHERE h.id_solicitud = s.id_solicitud
        ) as historial
      FROM pac_solicitudes s
      JOIN pac_unidades_solicitantes u ON s.id_unidad_solicitante = u.id_unidad
      JOIN pac_estados e ON s.id_estado = e.id_estado
      JOIN pac_modalidades_compra m ON s.id_modalidad_compra = m.id_modalidad
      JOIN pac_renglones r ON s.id_renglon = r.id_renglon
      WHERE s.codigo_solicitud = $1;
    `;
    const result = await pacPool.query(query, [codigo]);

    if (result.rows.length === 0) {
      return undefined;
    }

    const solicitud = result.rows[0];

    // 2. Si no hay historial, devolver la solicitud tal como está.
    if (!solicitud.historial || solicitud.historial.length === 0) {
      return solicitud;
    }

    // 3. Recolectar todos los IDs de usuario únicos del historial
    const userIds = [
      ...new Set(solicitud.historial.map((h) => h.usuario_id_cambio)),
    ];

    // Consulta 2: Obtener los nombres de los usuarios de la base de datos de usuarios
    const usersQuery =
      "SELECT id_usuario, nombre_completo FROM usuarios WHERE id_usuario = ANY($1::int[])";
    const usersResult = await usersDb.query(usersQuery, [userIds]);

    // 4. Crear un mapa para buscar nombres de usuario por ID fácilmente (ej: { 1: 'Hugo Gatica' })
    const userMap = usersResult.rows.reduce((map, user) => {
      map[user.id_usuario] = user.nombre_completo;
      return map;
    }, {});

    // 5. "Unir" los datos en la aplicación: reemplazar el ID por el nombre en el historial
    solicitud.historial = solicitud.historial.map((log) => ({
      ...log,
      usuario_cambio: userMap[log.usuario_id_cambio] || "Usuario Desconocido",
    }));

    return solicitud;
  }

  async cambiarEstadoSolicitud(codigo, nuevoEstadoId, comentario, usuarioId) {
    const client = await pacPool.connect();
    try {
      await client.query("BEGIN");

      // 1. Obtener el ID de la solicitud a partir de su código
      const solicitudRes = await client.query(
        "SELECT id_solicitud FROM pac_solicitudes WHERE codigo_solicitud = $1",
        [codigo]
      );
      if (solicitudRes.rows.length === 0) {
        throw new Error("Solicitud no encontrada.");
      }
      const solicitudId = solicitudRes.rows[0].id_solicitud;

      // 2. Actualizar el estado en la tabla principal
      await client.query(
        "UPDATE pac_solicitudes SET id_estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_solicitud = $2",
        [nuevoEstadoId, solicitudId]
      );

      // 3. Insertar el registro en el historial
      await client.query(
        "INSERT INTO pac_historial_estados (id_solicitud, id_estado_nuevo, comentario, usuario_id_cambio) VALUES ($1, $2, $3, $4)",
        [solicitudId, nuevoEstadoId, comentario, usuarioId]
      );

      await client.query("COMMIT");
      return { message: "Estado actualizado exitosamente." };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllUnidades() {
    const result = await pacPool.query(
      "SELECT id_unidad as value, nombre as text FROM pac_unidades_solicitantes WHERE activo = TRUE ORDER BY nombre"
    );
    return result.rows;
  }

  async getAllModalidades() {
    const result = await pacPool.query(
      "SELECT id_modalidad as value, nombre as text FROM pac_modalidades_compra WHERE activo = TRUE ORDER BY nombre"
    );
    return result.rows;
  }

  async getAllRenglones() {
    const result = await pacPool.query(
      "SELECT id_renglon as value, nombre as text FROM pac_renglones WHERE activo = TRUE ORDER BY numero_renglon"
    );
    return result.rows;
  }

  async getAllEstados() {
    const result = await pacPool.query(
      "SELECT id_estado as value, nombre as text FROM pac_estados ORDER BY id_estado"
    );
    return result.rows;
  }

  async getReportePorRenglon() {
    const query = `
        SELECT 
            r.nombre AS renglon_nombre,
            COUNT(s.id_solicitud) AS numero_solicitudes,
            SUM(s.monto_total) AS monto_total_sum
        FROM pac_solicitudes s
        JOIN pac_renglones r ON s.id_renglon = r.id_renglon
        GROUP BY r.nombre
        ORDER BY monto_total_sum DESC;
    `;
    const result = await pacPool.query(query);
    return result.rows;
  }
}

module.exports = new PacService();
