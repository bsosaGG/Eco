const db = require("../config/db");
const generateFolio = require("../utils/generateFolio");
const {
  sendDenunciaCreadaEmail,
  sendEstadoDenunciaActualizadoEmail,
} = require("./email.service");
const path = require("path");

const UPLOAD_FOLDER_RELATIVE_PATH = "uploads"; // Relativa a la raíz del proyecto API

const createDenuncia = async (denunciaData, archivos) => {
  const client = await db.getClient(); // Para transacciones

  // Normalizar valores booleanos que vienen como string del form-data
  [
    "conoce_nombre_denunciado",
    "tiene_pruebas_adjuntas",
    "denunciado_antes_otra_institucion",
  ].forEach((key) => {
    if (typeof denunciaData[key] === "string") {
      denunciaData[key] = denunciaData[key].toLowerCase() === "true";
    }
  });

  try {
    await client.query("BEGIN");

    // 1. Insertar denunciante
    const denuncianteQuery = `
      INSERT INTO denunciantes (primer_apellido, segundo_apellido, primer_nombre, segundo_nombre, 
                                tipo_documento_identificacion, numero_documento_identificacion, sexo,
                                telefono, correo_electronico)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id_denunciante;
    `;
    const denuncianteValues = [
      denunciaData.denunciante_primer_apellido,
      denunciaData.denunciante_segundo_apellido,
      denunciaData.denunciante_primer_nombre,
      denunciaData.denunciante_segundo_nombre,
      denunciaData.denunciante_tipo_documento, // nuevo
      denunciaData.denunciante_numero_documento, // nuevo
      denunciaData.denunciante_sexo, // nuevo
      denunciaData.denunciante_telefono,
      denunciaData.denunciante_correo_electronico,
    ];
    const denuncianteResult = await client.query(
      denuncianteQuery,
      denuncianteValues
    );
    const idDenunciante = denuncianteResult.rows[0].id_denunciante;

    // 2. Generar folio único para la denuncia
    let folioUnico = false;
    let folioDenuncia;
    while (!folioUnico) {
      folioDenuncia = generateFolio();
      const checkFolio = await client.query(
        "SELECT 1 FROM denuncias WHERE folio_denuncia = $1",
        [folioDenuncia]
      );
      if (checkFolio.rowCount === 0) {
        folioUnico = true;
      }
    }

    // 3. Insertar denuncia
    const denunciaQuery = `
      INSERT INTO denuncias (
          id_denunciante_fk, conoce_nombre_denunciado, 
          denunciado_primer_apellido, denunciado_segundo_apellido, denunciado_primer_nombre, denunciado_segundo_nombre,
          denunciado_descripcion_fisica,
          puesto_cargo_denunciado, departamento_denunciado, municipio_denunciado, ubicacion_denunciado, 
          tiene_pruebas_adjuntas, descripcion_hechos, denunciado_antes_otra_institucion, 
          folio_denuncia, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'Recibida')
      RETURNING *;
    `;
    const denunciaValues = [
      idDenunciante,
      denunciaData.conoce_nombre_denunciado,
      // Campos condicionales para el denunciado
      denunciaData.conoce_nombre_denunciado
        ? denunciaData.denunciado_primer_apellido
        : null,
      denunciaData.conoce_nombre_denunciado
        ? denunciaData.denunciado_segundo_apellido
        : null,
      denunciaData.conoce_nombre_denunciado
        ? denunciaData.denunciado_primer_nombre
        : null,
      denunciaData.conoce_nombre_denunciado
        ? denunciaData.denunciado_segundo_nombre
        : null,
      !denunciaData.conoce_nombre_denunciado
        ? denunciaData.denunciado_descripcion_fisica
        : null,

      denunciaData.puesto_cargo_denunciado,
      denunciaData.departamento_denunciado, // nuevo
      denunciaData.municipio_denunciado,
      denunciaData.ubicacion_denunciado,
      denunciaData.tiene_pruebas_adjuntas,
      denunciaData.descripcion_hechos,
      denunciaData.denunciado_antes_otra_institucion,
      folioDenuncia,
    ];
    const denunciaResult = await client.query(denunciaQuery, denunciaValues);
    const nuevaDenuncia = denunciaResult.rows[0];

    // 4. Insertar archivos adjuntos (si los hay y tiene_pruebas_adjuntas es true)
    if (
      denunciaData.tiene_pruebas_adjuntas &&
      archivos &&
      archivos.length > 0
    ) {
      const archivoQuery = `
                INSERT INTO archivos_adjuntos (id_denuncia_fk, nombre_original_archivo, nombre_guardado_archivo, tipo_mime_archivo, ruta_archivo)
                VALUES ($1, $2, $3, $4, $5);
            `;
      for (const archivo of archivos) {
        const rutaRelativa = path.join(
          UPLOAD_FOLDER_RELATIVE_PATH,
          archivo.filename
        );
        await client.query(archivoQuery, [
          nuevaDenuncia.id_denuncia,
          archivo.originalname,
          archivo.filename,
          archivo.mimetype,
          rutaRelativa, // Guardamos la ruta relativa
        ]);
      }
    } else if (
      denunciaData.tiene_pruebas_adjuntas &&
      (!archivos || archivos.length === 0)
    ) {
      // Si marcó que tiene pruebas pero no adjuntó, podría ser un error o una omisión.
      // Podrías lanzar un error o simplemente registrarlo. Por ahora, lo dejamos pasar.
      // Opcionalmente, actualizar `tiene_pruebas_adjuntas` a false en la DB.
      await client.query(
        "UPDATE denuncias SET tiene_pruebas_adjuntas = false WHERE id_denuncia = $1",
        [nuevaDenuncia.id_denuncia]
      );
      nuevaDenuncia.tiene_pruebas_adjuntas = false; // Actualizar el objeto también
    }

    await client.query("COMMIT");

    // 5. Enviar correo de notificación
    await sendDenunciaCreadaEmail(nuevaDenuncia);

    return nuevaDenuncia;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en createDenuncia service:", error);
    throw error;
  } finally {
    client.release();
  }
};

const getAllDenuncias = async () => {
  // Implementar lógica para obtener todas las denuncias (para un panel de admin, por ejemplo)
  // Asegurarse de no exponer datos sensibles del denunciante sin control.
  const query = `
        SELECT 
            d.id_denuncia, d.folio_denuncia, d.estado, d.fecha_creacion, d.fecha_actualizacion_estado,
            d.municipio_denunciado, d.descripcion_hechos,
            -- No incluir datos del denunciante aquí por defecto para listados generales
            (SELECT COUNT(*) FROM archivos_adjuntos WHERE id_denuncia_fk = d.id_denuncia) as cantidad_adjuntos
        FROM denuncias d
        ORDER BY d.fecha_creacion DESC;
    `;
  const { rows } = await db.query(query);
  return rows;
};

const getDenunciaById = async (idDenuncia) => {
  // Obtener una denuncia específica, incluyendo datos del denunciante y adjuntos
  // Esta función sería para uso interno de administradores.
  const denunciaQuery = `
        SELECT d.*, 
               dn.primer_apellido as denunciante_pa, dn.primer_nombre as denunciante_pn, dn.correo_electronico as denunciante_email
        FROM denuncias d
        LEFT JOIN denunciantes dn ON d.id_denunciante_fk = dn.id_denunciante
        WHERE d.id_denuncia = $1;
    `;
  const archivosQuery = `
        SELECT id_archivo, nombre_original_archivo, nombre_guardado_archivo, tipo_mime_archivo, ruta_archivo
        FROM archivos_adjuntos 
        WHERE id_denuncia_fk = $1;
    `;

  const denunciaResult = await db.query(denunciaQuery, [idDenuncia]);
  if (denunciaResult.rows.length === 0) {
    return null;
  }
  const denuncia = denunciaResult.rows[0];

  const archivosResult = await db.query(archivosQuery, [idDenuncia]);
  denuncia.archivos_adjuntos = archivosResult.rows;

  return denuncia;
};

const updateDenunciaEstado = async (
  idDenuncia,
  nuevoEstado,
  idUsuarioAdmin,
  comentarioAdmin = null
) => {
  // Añadimos idUsuarioAdmin y comentarioAdmin
  const client = await db.getClient(); // Para transacciones
  try {
    await client.query("BEGIN");

    // 1. Obtener el estado actual/anterior de la denuncia
    const denunciaActualQuery =
      "SELECT estado FROM denuncias WHERE id_denuncia = $1 FOR UPDATE"; // FOR UPDATE para bloquear la fila
    const denunciaActualResult = await client.query(denunciaActualQuery, [
      idDenuncia,
    ]);

    if (denunciaActualResult.rowCount === 0) {
      throw new Error("Denuncia no encontrada para actualizar estado.");
    }
    const estadoAnterior = denunciaActualResult.rows[0].estado;

    // Si el nuevo estado es igual al anterior, no hacer nada (o manejar como prefieras)
    if (estadoAnterior === nuevoEstado) {
      // Podrías devolver la denuncia sin cambios o un mensaje específico
      // Por ahora, para simplificar, permitimos "actualizar" al mismo estado, lo cual creará una entrada en el historial.
      // Si quieres evitarlo, descomenta:
      // await client.query('ROLLBACK');
      // client.release();
      // const denunciaSinCambios = await getDenunciaById(idDenuncia); // Necesitarías esta función aquí o pasar los datos
      // return denunciaSinCambios;
      console.log(
        `Intento de actualizar al mismo estado: ${nuevoEstado} para denuncia ${idDenuncia}. Se registrará en historial.`
      );
    }

    // 2. Actualizar el estado en la tabla 'denuncias'
    const updateDenunciaQuery = `
            UPDATE denuncias
            SET estado = $1, fecha_actualizacion_estado = CURRENT_TIMESTAMP
            WHERE id_denuncia = $2
            RETURNING *;
        `;
    const updateResult = await client.query(updateDenunciaQuery, [
      nuevoEstado,
      idDenuncia,
    ]);
    const denunciaActualizada = updateResult.rows[0];

    // 3. Insertar en la tabla 'historial_estados_denuncia'
    const historialQuery = `
            INSERT INTO historial_estados_denuncia 
                (id_denuncia_fk, id_usuario_admin_fk, estado_anterior, estado_nuevo, comentario_admin, fecha_cambio)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP);
        `;
    await client.query(historialQuery, [
      idDenuncia,
      idUsuarioAdmin, // El ID del admin que realiza la acción
      estadoAnterior,
      nuevoEstado,
      comentarioAdmin, // El comentario del admin (puede ser null)
    ]);

    await client.query("COMMIT");

    // Enviar correo de notificación de cambio de estado
    await sendEstadoDenunciaActualizadoEmail(denunciaActualizada);

    return denunciaActualizada;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en updateDenunciaEstado service:", error);
    if (
      error.message &&
      error.message.includes(
        "invalid input value for enum estado_denuncia_enum"
      )
    ) {
      throw new Error(`Estado '${nuevoEstado}' no es válido.`);
    }
    throw error;
  } finally {
    client.release();
  }
};

const getDenunciaStatusByFolio = async (folio) => {
  // Consulta para obtener los datos públicos de la denuncia
  const denunciaQuery = `
        SELECT 
            folio_denuncia, 
            estado, 
            fecha_creacion, 
            fecha_actualizacion_estado
        FROM denuncias 
        WHERE folio_denuncia = $1;
    `;
  const denunciaResult = await db.query(denunciaQuery, [folio]);

  if (denunciaResult.rows.length === 0) {
    return null; // El servicio indica que no se encontró
  }

  const denunciaPublica = denunciaResult.rows[0];
  const idDenuncia = (
    await db.query(
      "SELECT id_denuncia FROM denuncias WHERE folio_denuncia = $1",
      [folio]
    )
  ).rows[0].id_denuncia;

  // Consulta para obtener el historial público de estados (sin comentarios ni datos de admin)
  const historialQuery = `
        SELECT 
            estado_anterior, 
            estado_nuevo, 
            fecha_cambio
        FROM historial_estados_denuncia 
        WHERE id_denuncia_fk = $1 
        ORDER BY fecha_cambio ASC;
    `;
  const historialResult = await db.query(historialQuery, [idDenuncia]);

  denunciaPublica.historial_estados = historialResult.rows;

  return denunciaPublica;
};

// Método genérico para consultas
const dbQuery = async (text, params) => {
  return db.query(text, params);
};

module.exports = {
  createDenuncia,
  getAllDenuncias,
  getDenunciaById,
  updateDenunciaEstado,
  getDenunciaStatusByFolio,
  dbQuery,
};
