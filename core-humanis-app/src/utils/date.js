/**
 * Utilidad Centralizada de Formateo de Fechas Humanas (SCSPR / Guatemala)
 * Regla Obligatoria del Sistema (AGENTS.md):
 * Ninguna fecha debe mostrarse en formato ISO crudo (YYYY-MM-DDTHH:mm:ss.sssZ).
 * Todas las fechas presentadas al usuario deben ser legibles por humanos en español (es-GT).
 */

/**
 * Formatea una fecha a formato legible por humanos.
 * Maneja cadenas ISO de forma segura y evita desfases de zona horaria (UTC vs Local).
 *
 * @param {string|Date|number|null|undefined} dateVal - Fecha a formatear
 * @param {Object} [options]
 * @param {string} [options.format='short'] - 'short' ('DD/MM/YYYY') | 'long' ('19 de septiembre de 1993') | 'month-year' ('septiembre 2026')
 * @param {string} [options.fallback='No registrada'] - Texto de retorno si la fecha es nula o inválida
 * @param {boolean} [options.includeTime=false] - Si incluye hora (HH:mm)
 * @returns {string} Fecha formateada legible
 */
export function formatDate(dateVal, options = {}) {
  const {
    format = 'short',
    fallback = 'No registrada',
    includeTime = false,
  } = options;

  if (!dateVal || dateVal === 'N/A' || dateVal === '-' || dateVal === 'null' || dateVal === 'undefined') {
    return fallback;
  }

  // Si es una cadena de texto
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return fallback;

    // Detectar patrón ISO YYYY-MM-DD
    const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateMatch) {
      const year = parseInt(isoDateMatch[1], 10);
      const month = parseInt(isoDateMatch[2], 10) - 1; // 0-indexed en JS Date
      const day = parseInt(isoDateMatch[3], 10);

      // Si incluye hora y tiene un timestamp con hora real (no medianoche 00:00:00)
      if (includeTime && trimmed.includes('T') && !trimmed.includes('T00:00:00')) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
        }
      }

      const d = new Date(year, month, day);

      if (format === 'long') {
        return d.toLocaleDateString('es-GT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } else if (format === 'month-year') {
        return d.toLocaleDateString('es-GT', {
          month: 'long',
          year: 'numeric',
        });
      }

      // Por defecto 'short': DD/MM/YYYY
      const dd = String(day).padStart(2, '0');
      const mm = String(month + 1).padStart(2, '0');
      return `${dd}/${mm}/${year}`;
    }
  }

  // Objeto Date o timestamp numérico
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return fallback;

  if (includeTime) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  if (format === 'long') {
    return d.toLocaleDateString('es-GT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formatea una fecha en formato formal largo humano (ej. "19 de septiembre de 1993")
 */
export function formatHumanDate(dateVal, fallback = 'No registrada') {
  return formatDate(dateVal, { format: 'long', fallback });
}

/**
 * Formatea fecha y hora (ej. "19/09/1993 14:30")
 */
export function formatDateTime(dateVal, fallback = 'No registrada') {
  return formatDate(dateVal, { includeTime: true, fallback });
}

/**
 * Formatea un rango de fechas (ej. "01/01/2026 al 31/12/2026" o "01/01/2026 al Vigente")
 */
export function formatDateRange(startDate, endDate, fallbackEnd = 'Vigente') {
  if (!startDate) return 'Fecha no definida';
  const startStr = formatDate(startDate, { fallback: 'Inicio no definido' });
  const endStr = endDate ? formatDate(endDate, { fallback: fallbackEnd }) : fallbackEnd;
  return `${startStr} al ${endStr}`;
}
