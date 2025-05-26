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
            INSERT INTO denunciantes (primer_apellido, segundo_apellido, primer_nombre, segundo_nombre, telefono, correo_electronico)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_denunciante;
        `;
    const denuncianteValues = [
      denunciaData.denunciante_primer_apellido,
      denunciaData.denunciante_segundo_apellido,
      denunciaData.denunciante_primer_nombre,
      denunciaData.denunciante_segundo_nombre,
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
                id_denunciante_fk, conoce_nombre_denunciado, nombre_denunciado, puesto_cargo_denunciado,
                municipio_denunciado, ubicacion_denunciado, tiene_pruebas_adjuntas,
                descripcion_hechos, denunciado_antes_otra_institucion, folio_denuncia, estado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Recibida')
            RETURNING *;
        `;
    const denunciaValues = [
      idDenunciante,
      denunciaData.conoce_nombre_denunciado,
      denunciaData.conoce_nombre_denunciado
        ? denunciaData.nombre_denunciado
        : null,
      denunciaData.puesto_cargo_denunciado,
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

const updateDenunciaEstado = async (idDenuncia, nuevoEstado) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    const query = `
            UPDATE denuncias
            SET estado = $1, fecha_actualizacion_estado = CURRENT_TIMESTAMP
            WHERE id_denuncia = $2
            RETURNING *;
        `;
    // Validar que nuevoEstado sea uno de los valores permitidos por el ENUM
    // (La DB lo hará, pero una validación previa es buena práctica)
    const result = await client.query(query, [nuevoEstado, idDenuncia]);

    if (result.rowCount === 0) {
      throw new Error("Denuncia no encontrada para actualizar estado.");
    }
    const denunciaActualizada = result.rows[0];

    await client.query("COMMIT");

    // Enviar correo de notificación de cambio de estado
    await sendEstadoDenunciaActualizadoEmail(denunciaActualizada);

    return denunciaActualizada;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en updateDenunciaEstado service:", error);
    // Si el error es por valor de ENUM inválido
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

module.exports = {
  createDenuncia,
  getAllDenuncias,
  getDenunciaById,
  updateDenunciaEstado,
};
