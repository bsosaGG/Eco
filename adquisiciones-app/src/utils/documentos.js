// Tipos de documento de soporte del expediente (columna `tipo_documento` de documentos_soporte).
export const TIPOS_DOCUMENTO = {
    FACTURA: 'Factura',
    HOJA_1H_INGRESO: 'Hoja 1-H de ingreso',
    EGRESO_ALMACEN: 'Egreso de almacén',
    CERTIFICADO_SATISFACCION: 'Certificado de satisfacción',
    OTRO: 'Otro',
};

export const tipoDocumentoLabel = (tipo) => TIPOS_DOCUMENTO[tipo] || tipo;
