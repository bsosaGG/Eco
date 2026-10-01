// Constantes del formulario de Plan de Medios (numeración oficial del Brief).

export const STAGES = [
    { number: 1, title: 'Campaña y Brief' },
    { number: 2, title: 'Prioridades de campaña' },
    { number: 3, title: 'Planificación de medios' },
    { number: 4, title: 'Solicitudes de Compra' },
];
export const MIN_STAGE = 1;
export const MAX_STAGE = 4;

/** Campos de la Etapa 1 que se editan en un área de texto (el resto, en una línea). */
export const TEXTAREA_FIELDS = new Set([
    '1.2', '1.3', '1.5', '1.7', '2.1', '2.2', '3.1', '3.2', '3.3', '3.4', '3.5', '5.2',
]);

/** Públicos que además tienen un campo "Territorio". */
export const AUDIENCE_FIELDS = new Set(['3.3', '3.4', '3.5']);

/** Encabezado de sección que se muestra antes de cada grupo de campos. */
export const SECTION_HEADINGS = {
    '1.1': '1. Resumen general',
    '2.1': '2. Contexto y consideraciones',
    '3.1': '3. Objetivos de comunicación',
    '5.1': '5. Calendario de campaña',
};

export const MEDIA_FIELD_NAMES = {
    '6.1': 'Finalidad del medio en la campaña',
    '6.2': 'Público objetivo al que contribuye',
    '6.3': 'Especificaciones técnicas del medio',
    '6.4': 'Indicador principal del medio',
    '6.5': 'Formato del material',
    '6.6': 'Periodo y presión',
    '6.7': 'Cantidad de materiales',
};

export const PRIORITY_ITEMS = [
    { key: 'audience', label: 'Audiencia objetivo', description: 'Coincidencia con el grupo objetivo, edades y nivel socioeconómico de la campaña.' },
    { key: 'geography', label: 'Ubicación / cobertura', description: 'Adecuación territorial del medio a departamentos, municipios o zonas priorizadas.' },
    { key: 'reach', label: 'Alcance', description: 'Volumen potencial de exposición. La confianza dependerá de la disponibilidad real de datos por categoría.' },
    { key: 'cost', label: 'Costo / eficiencia', description: 'Conveniencia económica entre opciones comparables según su modelo de tarifa.' },
    { key: 'affinity', label: 'Afinidad del medio', description: 'Adecuación del tipo de medio, formato y programación al propósito de comunicación.' },
];

export const PRIORITY_PRESETS = {
    balanced: { label: 'Equilibrada', weights: { audience: 25, geography: 25, reach: 20, cost: 15, affinity: 15 } },
    territorial: { label: 'Territorial', weights: { audience: 20, geography: 40, reach: 10, cost: 15, affinity: 15 } },
    audience: { label: 'Audiencia', weights: { audience: 40, geography: 20, reach: 15, cost: 10, affinity: 15 } },
    efficiency: { label: 'Eficiencia', weights: { audience: 20, geography: 20, reach: 15, cost: 35, affinity: 10 } },
};

export const COMPATIBILITY_LABELS = {
    muy_alta: 'Muy alta',
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
    muy_baja: 'Muy baja',
    condicionada: 'Condicionada',
};

export const STATUS_LABELS = {
    created: 'Creado',
    documentos_cargados: 'Documentos cargados',
    resumen_extraido: 'Resumen extraído',
    borrador: 'Borrador',
    resumen_revisado: 'Resumen revisado',
    plan_medios_generado: 'Plan de Medios generado',
};

export const AUDIT_EVENT_LABELS = {
    selected: 'Seleccionado',
    removed: 'Removido',
    updated: 'Actualizado',
};

/** Retardo antes de revisar la ortografía de un campo tras dejar de escribir. */
export const REVIEW_DELAY_MS = 900;
