import { STATUS_LABELS } from './constants.js';

export const statusLabel = (status) => STATUS_LABELS[status] || status || '—';

/** "2026-09-30T14:05:09.000Z" -> "2026-09-30 14:05" (como en las vistas originales). */
export function shortDateTime(iso, seconds = false) {
    if (!iso) return '—';
    return String(iso).slice(0, seconds ? 19 : 16).replace('T', ' ');
}

export const pluralize = (count, singular, plural) => (count === 1 ? singular : plural);

/** Guarda un Blob recibido de la API como descarga del navegador. */
export function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
