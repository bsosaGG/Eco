/**
 * Mensaje de error para mostrar al usuario: el `message` que devuelve el API (reglas de negocio
 * del módulo) o, si la petición ni siquiera llegó, el texto de respaldo.
 */
export const errorMessage = (err, fallback) => err.response?.data?.message || fallback;
