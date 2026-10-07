import { ETAPAS } from './estados';

// Etapa del catálogo a la que corresponde cada paso del stepper.
const ETAPA_DEL_PASO = { cotizacion: 'Cotizacion', cdp: 'CDP', oc: 'OrdenCompra', recepcion: 'Recepcion', financiera: 'Financiero' };

/**
 * Pasos del proceso de un expediente (los que muestra el stepper y el carrusel). Cada paso queda
 * "completado", "activo" o "pendiente" según dónde está el expediente.
 *
 * Manda el paso que el API dice que toca (`siguiente_paso.paso`) y solo si no hay se usa la etapa del
 * estado: hay estados cuya etapa en el catálogo va un paso atrás de lo que se hace en ellos (en
 * «Revisión Jurídica», de etapa CDP, se elabora la Orden de Compra).
 */
export const construirPasos = (expediente) => {
    if (!expediente) return [];

    const etapaActual = ETAPA_DEL_PASO[expediente.siguiente_paso?.paso] || expediente.estado_etapa;
    const currentIdx = ETAPAS.indexOf(etapaActual);
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
