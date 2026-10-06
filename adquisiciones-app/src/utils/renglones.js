// Renglón solicitado (SCR-02): la línea de la solicitud con lo que se pide, cuánto y en qué unidad.

/**
 * Renglón vacío para el formulario de la Solicitud de Compra. Los campos que empiezan con "_" son
 * solo del autocompletado del catálogo MAGA/SIGES y no se envían al API.
 *
 * El precio no se captura en esta etapa (CU-01): todavía no hay proveedor ni cotización. Se manda en
 * 0 al backend, que lo actualiza más adelante con la cotización adjudicada (CU-02).
 */
export const nuevoRenglon = () => ({
    descripcion: '',
    cantidad: 1,
    unidad_medida: '',
    codigo_insumo: '',
    id_renglon: '',
    _sugerencias: [],
    _mostrarSugerencias: false,
    _buscando: false,
    _errorBusqueda: false,
});
