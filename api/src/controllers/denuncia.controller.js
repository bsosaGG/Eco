const denunciaService = require("../services/denuncia.service");
const { validationResult } = require("express-validator");

const crearNuevaDenuncia = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // req.body contiene los campos del formulario
    // req.files contiene los archivos subidos por multer (si los hay)
    const denunciaData = req.body;
    const archivos = req.files; // Array de archivos

    const nuevaDenuncia = await denunciaService.createDenuncia(
      denunciaData,
      archivos
    );
    res.status(201).json({
      message: "Denuncia creada exitosamente.",
      denuncia: {
        folio_denuncia: nuevaDenuncia.folio_denuncia,
        id_denuncia: nuevaDenuncia.id_denuncia,
        estado: nuevaDenuncia.estado,
        fecha_creacion: nuevaDenuncia.fecha_creacion,
      },
    });
  } catch (error) {
    console.error("Error en controller al crear denuncia:", error);
    // Eliminar archivos subidos si la transacción de DB falló (esto es complejo de manejar perfectamente aquí)
    // Idealmente, multer guardaría en un tmp y solo se moverían a 'uploads' al final de una transacción exitosa.
    // Por simplicidad, no se implementa limpieza automática de archivos en caso de error post-subida.
    next(error); // Pasa al manejador de errores global
  }
};

const obtenerTodasLasDenuncias = async (req, res, next) => {
  try {
    // Aquí se debería implementar autenticación y autorización para asegurar que solo admins accedan
    const denuncias = await denunciaService.getAllDenuncias();
    res.status(200).json(denuncias);
  } catch (error) {
    next(error);
  }
};

const obtenerDenunciaPorId = async (req, res, next) => {
  try {
    // Autenticación y autorización
    const { id } = req.params;
    const denuncia = await denunciaService.getDenunciaById(id);
    if (!denuncia) {
      return res.status(404).json({ message: "Denuncia no encontrada." });
    }
    res.status(200).json(denuncia);
  } catch (error) {
    next(error);
  }
};

const actualizarEstadoDenuncia = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Aquí se debería implementar autenticación y autorización para asegurar que solo admins accedan
    const { id } = req.params;
    const { estado } = req.body; // El nuevo estado viene en el body

    const denunciaActualizada = await denunciaService.updateDenunciaEstado(
      id,
      estado
    );
    res.status(200).json({
      message: "Estado de la denuncia actualizado.",
      denuncia: denunciaActualizada,
    });
  } catch (error) {
    if (
      error.message.includes("Estado") &&
      error.message.includes("no es válido")
    ) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Denuncia no encontrada")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
  crearNuevaDenuncia,
  obtenerTodasLasDenuncias,
  obtenerDenunciaPorId,
  actualizarEstadoDenuncia,
};
