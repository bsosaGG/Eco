// api/src/services/documentos.service.js
const dbDocumentos = require("../config/db-documentos");
const { TemplateHandler } = require("easy-template-x");
const xlsx = require("xlsx");
const JSZip = require("jszip");

const conversiones = {
  "true": true,
  "false": false
};

/**
 * Función de utilidad para aplanar un objeto anidado de forma recursiva,
 * incluyendo objetos que se encuentren dentro de arrays.
 * Transforma: { a: { b: 'c' }, d: [{ e: { f: 'g' } }] }
 * En:         { 'a.b': 'c', d: [{ 'e.f': 'g' }] }
 * @param {object} obj - El objeto o valor a procesar.
 * @returns {any} El objeto, array o valor procesado.
 */
const flattenObjectRecursive = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => flattenObjectRecursive(item));
  }

  const result = {};
  const flatten = (currentObj, parentKey = "") => {
    for (const key in currentObj) {
      if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        const value = currentObj[key];

        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          flatten(value, newKey);
        } else {
          result[newKey] = flattenObjectRecursive(value);
        }
      }
    }
  };

  flatten(obj);
  return result;
};

/**
 * Aplica el algoritmo de conversión a un encabezado de hoja de cálculo.
 * @param {string} header - El encabezado original.
 * @returns {string} El encabezado convertido a formato de variable.
 */
const convertirEncabezadoAVariable = (header) => {
  if (!header) return '';
  return header
    .toString()
  //.toLowerCase() // 1. Convertir a Minúsculas
  //.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // 2. Normalizar Caracteres (quitar tildes)
  //.replace(/ñ/g, 'n') // Manejar la 'ñ' específicamente
  //.replace(/[^a-z0-9]+/g, '_') // 3. Reemplazar Espacios y Símbolos por Guion Bajo
  //.replace(/^_+|_+$/g, ''); // 4. Limpieza Final
};

class DocumentosService {
  /**
 * Genera múltiples documentos desde una hoja de cálculo y los devuelve en un archivo ZIP.
 * @param {number} idPlantilla - El ID de la plantilla a usar.
 * @param {object} file - El objeto de archivo de Multer (req.file) que contiene la hoja de cálculo.
 * @returns {object} Un objeto con { buffer, nombreArchivo } del ZIP.
 */
  async generarMasivoDesdeHojaCalculo(idPlantilla, file) {
    // 1. Obtener la plantilla de la base de datos
    const plantillaQuery = "SELECT contenido_plantilla FROM plantillas_documentos WHERE id_plantilla = $1;";
    const { rows: plantillaRows } = await dbDocumentos.query(plantillaQuery, [idPlantilla]);
    if (plantillaRows.length === 0) {
      throw new Error("Plantilla no encontrada.");
    }
    const plantillaBuffer = plantillaRows[0].contenido_plantilla;

    // 2. Procesar la hoja de cálculo
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const dataJson = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

    if (dataJson.length === 0) {
      throw new Error("La hoja de cálculo está vacía o no tiene un formato válido.");
    }

    // 3. Crear instancia del ZIP y del manejador de plantillas
    const zip = new JSZip();
    const handler = new TemplateHandler();

    // 4. Iterar sobre cada fila, generar documento y añadirlo al ZIP
    for (let i = 0; i < dataJson.length; i++) {
      const fila = dataJson[i];
      const datosParaPlantilla = {};

      // Aplicar el algoritmo de conversión a los encabezados
      for (const key in fila) {
        const nuevaClave = convertirEncabezadoAVariable(key);
        datosParaPlantilla[nuevaClave] = conversiones[fila[key]] ?? fila[key];
      }

      // Generar el documento para la fila actual
      const docGeneradoBuffer = await handler.process(plantillaBuffer, datosParaPlantilla);

      // Añadir el documento al ZIP con un nombre único
      zip.file(`documento_fila_${i + 2}.docx`, docGeneradoBuffer);
    }

    // 5. Generar el buffer final del archivo ZIP
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return {
      buffer: zipBuffer,
      nombreArchivo: `generacion_masiva_${Date.now()}.zip`,
    };
  }

  /**
   * Guarda una nueva plantilla en la base de datos.
   * @param {object} file - El objeto de archivo de Multer (req.file).
   * @param {object} metadata - Metadatos como { nombre, descripcion }.
   * @returns {object} La plantilla creada (sin el contenido binario).
   */
  async crearPlantilla(file, metadata) {
    const { originalname, mimetype, size, buffer } = file;
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

    const datosParaPlantilla = flattenObjectRecursive(datos);

    const handler = new TemplateHandler();
    const docGeneradoBuffer = await handler.process(
      plantillaBuffer,
      datosParaPlantilla
    );

    return {
      buffer: docGeneradoBuffer,
      nombreArchivo: `Generado - ${nombreOriginal}`,
    };
  }
}

module.exports = new DocumentosService();
