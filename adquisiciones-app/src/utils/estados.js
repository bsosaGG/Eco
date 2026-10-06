// Colores y orden de los estados del trámite.

// El catálogo `estados_expediente` define un color semántico por estado (columna `color`).
const BADGE_POR_COLOR = {
    secondary: 'bg-gray-100 text-gray-600',
    primary: 'bg-blue-100 text-blue-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-sky-100 text-sky-700',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    dark: 'bg-slate-200 text-slate-700',
};

const BARRA_POR_COLOR = {
    secondary: 'bg-gray-400',
    primary: 'bg-blue-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    dark: 'bg-slate-500',
};

/** Clases de la etiqueta del estado del expediente según el color del catálogo. */
export const badgeClass = (color) => BADGE_POR_COLOR[color] || BADGE_POR_COLOR.secondary;

/** Clase del color de una barra (resumen por estado). */
export const barColor = (color) => BARRA_POR_COLOR[color] || BARRA_POR_COLOR.secondary;

const ESTADOS_DOCUMENTO_FINALES = ['Aprobado', 'Emitida', 'Tramitado'];
const ESTADOS_DOCUMENTO_INTERMEDIOS = ['Aprobado Técnicamente', 'Aprobada Jefatura'];

/**
 * Etiqueta del estado de un documento del trámite (CDP, Orden de Compra, solicitud de pago):
 * verde cuando quedó en firme, azul en un paso intermedio y ámbar mientras es borrador/pendiente.
 */
export const estadoDocumentoBadge = (estado) => {
    if (ESTADOS_DOCUMENTO_FINALES.includes(estado)) return 'bg-green-100 text-green-700';
    if (ESTADOS_DOCUMENTO_INTERMEDIOS.includes(estado)) return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
};

const ETAPA_LABEL = {
    Solicitud: 'Solicitud',
    Cotizacion: 'Cotizaciones',
    CDP: 'CDP',
    OrdenCompra: 'Orden de compra',
    Recepcion: 'Recepción',
    Financiero: 'Fase financiera',
    Cierre: 'Cierre',
    Devolucion: 'Devuelto',
};

/** Nombre legible de la etapa de un expediente (columna `etapa` de estados_expediente). */
export const etapaLabel = (etapa) => ETAPA_LABEL[etapa] || '';

/** Etapas macro del expediente, en el orden en que ocurren (columna `etapa` de estados_expediente). */
export const ETAPAS = ['Solicitud', 'Cotizacion', 'CDP', 'OrdenCompra', 'Recepcion', 'Financiero', 'Cierre'];
