// api/src/services/plan-medios/errors.js
// Errores de dominio del módulo. Llevan `statusCode`, que el errorHandler global
// del core (middleware/errorHandler.js) ya usa para armar la respuesta HTTP, de modo
// que ningún controlador necesita mapear códigos a mano.

class PlanMediosError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    if (details !== undefined) this.details = details;
  }
}

/** Datos de entrada o regla de negocio incumplida (400). */
class ValidationError extends PlanMediosError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

/** El recurso no existe (404). */
class NotFoundError extends PlanMediosError {
  constructor(message) {
    super(message, 404);
  }
}

/** El expediente cambió desde la última lectura (409, bloqueo optimista). */
class ConflictError extends PlanMediosError {
  constructor(message) {
    super(message, 409);
  }
}

/** Un servicio externo opcional (LanguageTool, Ollama) no respondió (502). */
class ExternalServiceError extends PlanMediosError {
  constructor(message) {
    super(message, 502);
  }
}

/** Fallo al leer o generar un documento Word/Excel (422). */
class DocumentError extends PlanMediosError {
  constructor(message) {
    super(message, 422);
  }
}

module.exports = {
  PlanMediosError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
  DocumentError,
};
