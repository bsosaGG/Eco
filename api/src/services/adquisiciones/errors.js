// api/src/services/adquisiciones/errors.js
// Errores de dominio del módulo. Llevan `statusCode`, que el errorHandler global del core
// (middleware/errorHandler.js) ya usa para armar la respuesta HTTP, de modo que ningún
// controlador necesita mapear códigos a mano.

class AdquisicionesError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

/** Datos de entrada incorrectos o referencias que no existen (400). */
class ValidationError extends AdquisicionesError {
  constructor(message) {
    super(message, 400);
  }
}

/** El recurso pedido no existe (404). */
class NotFoundError extends AdquisicionesError {
  constructor(message) {
    super(message, 404);
  }
}

/** El expediente (o el documento) no está en el estado que exige la operación (409). */
class ConflictError extends AdquisicionesError {
  constructor(message) {
    super(message, 409);
  }
}

/** Falta una dependencia o configuración del servidor (500). */
class ConfigurationError extends AdquisicionesError {}

module.exports = { AdquisicionesError, ValidationError, NotFoundError, ConflictError, ConfigurationError };
