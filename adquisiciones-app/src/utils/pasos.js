import { ETAPAS } from './estados';

/**
 * Pasos del proceso de un expediente (los que muestra el stepper y el carrusel). Cada paso queda
 * "completado", "activo" o "pendiente" según la etapa macro del estado actual del expediente.
 */
export const construirPasos = (expediente) => {
    if (!expediente) return [];

    const currentIdx = ETAPAS.indexOf(expediente.estado_etapa);
    const statusFor = (etapa) => {
        if (currentIdx === -1) return 'pendiente';
        const idx = ETAPAS.indexOf(etapa);
        if (idx < currentIdx) return 'completado';
        if (idx === currentIdx) return 'activo';
        return 'pendiente';
    };

    return [
        { key: 'cotizacion', label: 'Cotizaciones', status: statusFor('Cotizacion') },
        { key: 'cdp', label: 'CDP', status: statusFor('CDP') },
        { key: 'oc', label: 'Orden de Compra', status: statusFor('OrdenCompra') },
        { key: 'recepcion', label: 'Recepción y Docs.', status: statusFor('Recepcion') },
        {
            key: 'financiera',
            label: 'Fase Financiera',
            status: statusFor('Financiero'),
            subpasos: [
                { key: 'compromiso', done: !!expediente.compromiso },
                { key: 'devengado', done: !!expediente.devengado },
                { key: 'pago', done: expediente.solicitud_pago?.estado === 'Tramitado' },
            ],
        },
    ];
};
