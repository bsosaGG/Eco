const denunciaService = require("../services/denuncia.service");
const { validationResult } = require("express-validator");
const fs = require("fs").promises; // Usar la versión de promesas de fs
const path = require("path");

// Función helper para eliminar archivos
const limpiarArchivosSubidos = async (archivos) => {
  if (archivos && archivos.length > 0) {
    console.log(
      `Intentando limpiar ${archivos.length} archivo(s) subido(s) debido a un error.`
    );
    for (const archivo of archivos) {
      try {
        // 'archivo.path' es la ruta completa donde Multer guardó el archivo
        await fs.unlink(archivo.path);
        console.log(`Archivo eliminado: ${archivo.path}`);
      } catch (unlinkError) {
        console.error(
          `Error al intentar eliminar el archivo ${archivo.path}:`,
          unlinkError
        );
        // Continuar con los demás archivos, no detener el proceso por un fallo de eliminación
      }
    }
  }
};

const crearNuevaDenuncia = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Si hay errores de validación ANTES de intentar crear la denuncia,
    // y Multer ya subió archivos, los limpiamos.
    if (req.files && req.files.length > 0) {
      await limpiarArchivosSubidos(req.files);
    }
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
    // Si ocurre un error DURANTE la creación de la denuncia en el servicio
    // (ej. error de base de datos después de que los archivos ya fueron procesados por Multer),
    // intentamos limpiar los archivos.
    if (req.files && req.files.length > 0) {
      await limpiarArchivosSubidos(req.files);
    }
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
    const { id } = req.params; // ID de la denuncia
    const { estado, comentario_admin } = req.body; // El nuevo estado y el comentario (opcional)

    // req.user es añadido por el middleware verifyToken y contiene { userId, username, role }
    const idUsuarioAdmin = req.user.userId;

    if (!idUsuarioAdmin) {
      // Esto no debería pasar si verifyToken funcionó, pero es una salvaguarda
      return res
        .status(401)
        .json({ message: "No se pudo identificar al usuario administrador." });
    }

    const denunciaActualizada = await denunciaService.updateDenunciaEstado(
      parseInt(id, 10),
      estado,
      idUsuarioAdmin,
      comentario_admin // Puede ser undefined/null si no se envía desde el frontend
    );

    res.status(200).json({
      message:
        "Estado de la denuncia actualizado y registrado en el historial.",
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

const descargarAdjuntoPorId = async (req, res, next) => {
  try {
    const { id_archivo } = req.params;
    // Validar que id_archivo sea un número, etc. (express-validator podría hacerlo en la ruta)

    // Obtener información del archivo de la base de datos
    const archivoQuery =
      "SELECT nombre_original_archivo, nombre_guardado_archivo, ruta_archivo, tipo_mime_archivo FROM archivos_adjuntos WHERE id_archivo = $1";
    const archivoResult = await denunciaService.dbQuery(archivoQuery, [
      id_archivo,
    ]); // Necesitamos un método genérico dbQuery en el service o acceder a db directamente

    if (archivoResult.rows.length === 0) {
      return res.status(404).json({ message: "Archivo no encontrado." });
    }

    const archivoInfo = archivoResult.rows[0];

    // La 'ruta_archivo' guardada es relativa al directorio de la API (ej: 'uploads/nombre_guardado.ext')
    // Necesitamos construir la ruta absoluta en el servidor.
    // __dirname en un controller va a ser api/src/controllers
    // El volumen 'uploads_scspr' se monta en '/usr/src/app/uploads' dentro del contenedor
    // y la ruta guardada es algo como 'uploads/filename.ext'
    // Así que la ruta base es '../uploads' si UPLOAD_FOLDER_RELATIVE_PATH = 'uploads'
    // o usar directamente la ruta que pusimos en el Dockerfile para el volumen: /usr/src/app/uploads
    // Y la ruta_archivo en la BD es 'uploads/nombre_guardado.ext'
    // Lo más simple es usar la ruta absoluta que configuramos para multer.
    // En multer: const UPLOAD_DIR = path.join(__dirname, '../../uploads'); // Esto es relativo al archivo upload.js
    // Si `ruta_archivo` en la DB es `uploads/xxxx.pdf`
    // y la base del proyecto API es `/usr/src/app`, entonces la ruta completa es `/usr/src/app/uploads/xxxx.pdf`
    // La `ruta_archivo` que guardamos ya es `uploads/nombre_guardado.ext`, asumiendo que `uploads` está en la raíz del proyecto API.

    const rutaAbsolutaArchivo = path.resolve(
      process.cwd(),
      archivoInfo.ruta_archivo
    );
    // process.cwd() dentro del contenedor de la API será /usr/src/app si WORKDIR es /usr/src/app

    // Verificar que el archivo exista en el sistema de archivos
    if (!fs.existsSync(rutaAbsolutaArchivo)) {
      console.error(
        `Archivo no encontrado en el sistema de archivos: ${rutaAbsolutaArchivo}`
      );
      return res
        .status(404)
        .json({ message: "Archivo físico no encontrado en el servidor." });
    }

    // Configurar cabeceras para la descarga
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(
        archivoInfo.nombre_original_archivo
      )}"`
    );
    res.setHeader(
      "Content-Type",
      archivoInfo.tipo_mime_archivo || "application/octet-stream"
    );

    // Enviar el archivo
    res.sendFile(rutaAbsolutaArchivo, (err) => {
      if (err) {
        console.error("Error al enviar archivo:", err);
        // No enviar otra respuesta aquí si las cabeceras ya se enviaron
        // next(err); // Podría causar "Error: Can't set headers after they are sent."
        // Si el error ocurre después de enviar parte del archivo, es difícil de manejar
        // Si ocurre antes, res.status(500).send(...) podría funcionar si no se han enviado headers
        if (!res.headersSent) {
          res
            .status(500)
            .json({ message: "Error interno al intentar enviar el archivo." });
        }
      }
    });
  } catch (error) {
    console.error("Error en descargarAdjuntoPorId controller:", error);
    next(error);
  }
};

module.exports = {
  crearNuevaDenuncia,
  obtenerTodasLasDenuncias,
  obtenerDenunciaPorId,
  actualizarEstadoDenuncia,
  descargarAdjuntoPorId,
};
