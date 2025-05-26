// Middleware para manejar errores
function errorHandler(err, req, res, next) {
  console.error("ERROR DETECTADO:", err.stack || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Error interno del servidor.";

  // Para errores de validación de express-validator que no se atraparon antes
  if (err.errors && Array.isArray(err.errors)) {
    return res.status(400).json({ errors: err.errors });
  }

  // Errores específicos que podríamos querer manejar
  if (err.name === "MulterError") {
    return res
      .status(400)
      .json({ message: `Error de subida de archivo: ${err.message}` });
  }

  // Para errores de pg (base de datos)
  if (err.code) {
    // Los errores de pg suelen tener un 'code'
    // Podrías mapear códigos de error de pg a mensajes más amigables si es necesario
    // Por ejemplo, '23505' es unique_violation
    if (err.code === "23505") {
      return res.status(409).json({
        message:
          "Conflicto de datos: ya existe un registro con algún valor único.",
        detail: err.detail,
      });
    }
    // error de FK no existente
    if (err.code === "23503") {
      return res.status(400).json({
        message: "Error de referencia: algún dato relacionado no existe.",
        detail: err.detail,
      });
    }
    // valor inválido para enum
    if (err.code === "22P02" && err.routine === "enum_in") {
      return res.status(400).json({
        message: "Valor inválido para un campo de tipo enumerado.",
        detail: err.detail,
      });
    }
  }

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    // En desarrollo, podrías querer enviar el stack trace
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = errorHandler;
