// api/src/services/pac.service.js

const { pacPool } = require("../config/db-pac");

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

      const query = `
        INSERT INTO pac_solicitudes (
          codigo_solicitud, id_unidad_solicitante, id_modalidad_compra, id_renglon, 
          id_estado, descripcion, unidad_medida, es_baja_cuantia, responsable_usuario_id,
          monto_enero, monto_febrero, monto_marzo, monto_abril, monto_mayo, monto_junio,
          monto_julio, monto_agosto, monto_septiembre, monto_octubre, monto_noviembre, monto_diciembre,
          cantidad_enero, cantidad_febrero, cantidad_marzo, cantidad_abril, cantidad_mayo, cantidad_junio,
          cantidad_julio, cantidad_agosto, cantidad_septiembre, cantidad_octubre, cantidad_noviembre, cantidad_diciembre
        )
        VALUES (
          $1, $2, $3, $4, 
          (SELECT id_estado FROM pac_estados WHERE nombre='Vigente'), $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
        )
        RETURNING *;
      `;

      const values = [
        nuevoCodigo,
        solicitudData.id_unidad_solicitante,
        solicitudData.id_modalidad_compra,
        solicitudData.id_renglon,
        solicitudData.descripcion,
        solicitudData.unidad_medida,
        solicitudData.es_baja_cuantia || false,
        responsableUsuarioId,
        solicitudData.monto_enero || 0,
        solicitudData.monto_febrero || 0,
        solicitudData.monto_marzo || 0,
        solicitudData.monto_abril || 0,
        solicitudData.monto_mayo || 0,
        solicitudData.monto_junio || 0,
        solicitudData.monto_julio || 0,
        solicitudData.monto_agosto || 0,
        solicitudData.monto_septiembre || 0,
        solicitudData.monto_octubre || 0,
        solicitudData.monto_noviembre || 0,
        solicitudData.monto_diciembre || 0,
        solicitudData.cantidad_enero || 0,
        solicitudData.cantidad_febrero || 0,
        solicitudData.cantidad_marzo || 0,
        solicitudData.cantidad_abril || 0,
        solicitudData.cantidad_mayo || 0,
        solicitudData.cantidad_junio || 0,
        solicitudData.cantidad_julio || 0,
        solicitudData.cantidad_agosto || 0,
        solicitudData.cantidad_septiembre || 0,
        solicitudData.cantidad_octubre || 0,
        solicitudData.cantidad_noviembre || 0,
        solicitudData.cantidad_diciembre || 0,
      ];

      const result = await client.query(query, values);
      await client.query("COMMIT"); // Finalizar transacción con éxito
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK"); // Revertir transacción en caso de error
      throw error;
    } finally {
      client.release(); // Liberar el cliente de la pool
    }
  }

  // ... Aquí agregaremos los métodos para obtener, actualizar y eliminar.
}

module.exports = new PacService();
