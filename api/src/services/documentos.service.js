// api/src/services/documentos.service.js
const dbDocumentos = require("../config/db-documentos");
const { TemplateHandler } = require("easy-template-x");

/**
 * Función de utilidad para aplanar un objeto anidado.
 * Transforma: { a: { b: 'c' } } en { a_b: 'c' }
 * @param {object} obj - El objeto a aplanar.
 * @param {string} parentKey - Clave base para la recursión.
 * @param {object} result - El objeto plano resultante.
 * @returns {object} El objeto aplanado.
 */
const flattenObject = (obj, parentKey = "", result = {}) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (
        typeof obj[key] === "object" &&
        !Array.isArray(obj[key]) &&
        obj[key] !== null
      ) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
};

class DocumentosService {
  /**
   * Guarda una nueva plantilla en la base de datos.
   * @param {object} file - El objeto de archivo de Multer (req.file).
   * @param {object} metadata - Metadatos como { nombre, descripcion }.
   * @returns {object} La plantilla creada (sin el contenido binario).
   */
  async crearPlantilla(file, metadata) {
    const { originalname, mimetype, size, buffer } = file;
    // Usa el nombre proporcionado en los metadatos, o el nombre original del archivo si no se especifica.
    const nombrePlantilla = metadata.nombre || originalname;

    const query = `
      INSERT INTO plantillas_documentos 
        (nombre, descripcion, contenido_plantilla, nombre_archivo_original, mimetype, tamano_archivo)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING id_plantilla, nombre, descripcion, fecha_creacion;
    `;
    const values = [
      nombrePlantilla,
      metadata.descripcion,
      buffer,
      originalname,
      mimetype,
      size,
    ];

    try {
      const { rows } = await dbDocumentos.query(query, values);
      return rows[0];
    } catch (error) {
      if (error.code === "23505" && error.constraint.includes("nombre")) {
        throw new Error("Ya existe una plantilla con ese nombre.");
      }
      throw error;
    }
  }

  /**
   * Obtiene una lista de todas las plantillas sin su contenido binario.
   * @returns {Array<object>} Un arreglo de objetos de plantilla.
   */
  async obtenerTodasLasPlantillas() {
    const query = `
      SELECT id_plantilla, nombre, descripcion, nombre_archivo_original, tamano_archivo, fecha_creacion 
      FROM plantillas_documentos 
      ORDER BY nombre ASC;
    `;
    const { rows } = await dbDocumentos.query(query);
    return rows;
  }

  /**
   * Actualiza los metadatos (nombre, descripción) de una plantilla.
   * @param {number} id - El ID de la plantilla.
   * @param {object} data - Los datos a actualizar { nombre, descripcion }.
   * @returns {object|null} La plantilla actualizada o null si no se encuentra.
   */
  async actualizarMetadatosPlantilla(id, data) {
    const query = `
      UPDATE plantillas_documentos
      SET nombre = $1, descripcion = $2
      WHERE id_plantilla = $3
      RETURNING id_plantilla, nombre, descripcion, fecha_actualizacion;
    `;
    const { rows } = await dbDocumentos.query(query, [
      data.nombre,
      data.descripcion,
      id,
    ]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Elimina una plantilla de la base de datos.
   * @param {number} id - El ID de la plantilla.
   * @returns {boolean} True si se eliminó, false en caso contrario.
   */
  async eliminarPlantilla(id) {
    const query = "DELETE FROM plantillas_documentos WHERE id_plantilla = $1;";
    const { rowCount } = await dbDocumentos.query(query, [id]);
    return rowCount > 0;
  }

  /**
   * Genera un documento .docx a partir de una plantilla y datos.
   * @param {number} id - El ID de la plantilla a usar.
   * @param {object} datos - El objeto JSON con los datos para rellenar la plantilla.
   * @returns {object} Un objeto con { buffer, nombreArchivo }.
   */
  async generarDocumento(id, datos) {
    const query =
      "SELECT contenido_plantilla, nombre_archivo_original FROM plantillas_documentos WHERE id_plantilla = $1;";
    const { rows } = await dbDocumentos.query(query, [id]);

    if (rows.length === 0) {
      throw new Error("Plantilla no encontrada.");
    }

    const plantillaBuffer = rows[0].contenido_plantilla;
    const nombreOriginal = rows[0].nombre_archivo_original;

    // CORRECCIÓN: Aplanamos el objeto de datos ANTES de pasarlo a la librería.
    const datosPlanos = flattenObject(datos);

    // Mantenemos los datos originales para bucles y condicionales que sí funcionan con la estructura original.
    const datosFinales = { ...datos, ...datosPlanos };

    const handler = new TemplateHandler();
    const docGeneradoBuffer = await handler.process(
      plantillaBuffer,
      datosFinales
    );

    return {
      buffer: docGeneradoBuffer,
      nombreArchivo: `Generado - ${nombreOriginal}`,
    };
  }
}

module.exports = new DocumentosService();
