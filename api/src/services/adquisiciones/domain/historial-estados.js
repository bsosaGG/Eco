// Historial de estados de un expediente: cada entrada es el momento en que entró a un estado. Lógica
// pura, sin I/O. Los instantes se manejan tal como llegan de la BD (texto ISO) para no alterarlos.

/**
 * Agrega a cada entrada `fecha_salida` (el momento en que entró la siguiente, o null si es el estado
 * vigente) y `actual` (true solo en la última). El tiempo en cada estado sale de restar
 * `fecha_entrada` a `fecha_salida` (o a la hora del servidor si es el vigente).
 * @param {Array<{fecha_entrada: string}>|null} historial en orden cronológico
 */
function conSalidas(historial) {
  const entradas = Array.isArray(historial) ? historial : [];
  return entradas.map((entrada, i) => {
    const siguiente = entradas[i + 1];
    return { ...entrada, fecha_salida: siguiente ? siguiente.fecha_entrada : null, actual: !siguiente };
  });
}

module.exports = { conSalidas };
