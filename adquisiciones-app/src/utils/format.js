// Formato de montos y fechas para toda la app (es-GT). Un valor vacío se muestra como "—".

/** Monto en quetzales: "Q 1,234.50". */
export const formatMonto = (m) =>
    m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

/** Solo la fecha. */
export const formatFecha = (f) => (f ? new Date(f).toLocaleDateString('es-GT') : '—');

/** Fecha y hora. */
export const formatFechaHora = (f) => (f ? new Date(f).toLocaleString('es-GT') : '—');
