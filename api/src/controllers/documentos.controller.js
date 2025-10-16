// api/src/controllers/documentos.controller.js
const documentosService = require("../services/documentos.service");
const { validationResult } = require("express-validator");

const crearPlantilla = async (req, res, next) => {
  // 1. Validar que se haya subido un archivo.
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No se proporcionó ningún archivo de plantilla." });
  }

  // 2. Extraer nombre y descripción del cuerpo de la solicitud (si existen).
  const { nombre, descripcion } = req.body;

  // 3. El middleware 'upload.single' pone la información del archivo en req.file.
  //    Pasamos esta información al servicio, que se encargará de la lógica.
  try {
    const nuevaPlantilla = await documentosService.crearPlantilla(req.file, {
      nombre,
      descripcion,
    });
    res.status(201).json(nuevaPlantilla);
  } catch (error) {
    // Si ocurre un error (ej: nombre duplicado), lo pasamos al errorHandler.
    next(error);
  }
};

const obtenerPlantillas = async (req, res, next) => {
  try {
    const plantillas = await documentosService.obtenerTodasLasPlantillas();
    res.json(plantillas);
  } catch (error) {
    next(error);
  }
};

const actualizarPlantilla = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const plantillaActualizada =
      await documentosService.actualizarMetadatosPlantilla(id, {
        nombre,
        descripcion,
      });

    if (!plantillaActualizada) {
      return res.status(404).json({ message: "Plantilla no encontrada." });
    }
    res.json(plantillaActualizada);
  } catch (error) {
    next(error);
  }
};

const eliminarPlantilla = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const exito = await documentosService.eliminarPlantilla(id);
    if (!exito) {
      return res.status(404).json({ message: "Plantilla no encontrada." });
    }
    // Éxito, sin contenido que devolver.
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const generarDocumento = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { datos } = req.body;

    const { buffer, nombreArchivo } = await documentosService.generarDocumento(
      id,
      datos
    );

    // 4. Configurar las cabeceras de la respuesta para la descarga del archivo.
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`
    );

    // 5. Enviar el buffer del archivo generado como respuesta.
    res.send(buffer);
  } catch (error) {
    // Si la plantilla no existe, el servicio lanzará un error que capturamos aquí.
    if (error.message.includes("no encontrada")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
  crearPlantilla,
  obtenerPlantillas,
  actualizarPlantilla,
  eliminarPlantilla,
  generarDocumento,
};
