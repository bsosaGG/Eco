import {
    FileSignature,
    Gavel,
    Scale,
    ShieldAlert,
    Calculator,
    FileWarning,
    FileCheck,
    Handshake,
    CheckCircle,
    Archive,
    FileText
} from 'lucide-vue-next';

export const CASE_STATUSES = {
    'Demanda Ordinaria Laboral': {
        label: 'Demanda Ordinaria Laboral',
        color: 'bg-[rgb(255,192,0)] text-black border-[rgb(255,192,0)]',
        icon: FileSignature,
        description: 'Inicio del proceso laboral ordinario.'
    },
    'Sentencia de Primera Instancia': {
        label: 'Sentencia de Primera Instancia',
        color: 'bg-[rgb(255,192,0)] text-black border-[rgb(255,192,0)]',
        icon: Gavel,
        description: 'Resolución dictada por el juez de primera instancia.'
    },
    'Apelación': {
        label: 'Apelación',
        color: 'bg-[rgb(180,198,231)] text-black border-[rgb(180,198,231)]',
        icon: Scale,
        description: 'Recurso interpuesto contra la resolución.'
    },
    'Sentencia de Segunda Instancia': {
        label: 'Sentencia de Segunda Instancia',
        color: 'bg-[rgb(180,198,231)] text-black border-[rgb(180,198,231)]',
        icon: Gavel,
        description: 'Resolución definitiva del proceso de apelación.'
    },
    'Amparo': {
        label: 'Amparo',
        color: 'bg-[rgb(46,116,181)] text-white border-[rgb(46,116,181)]',
        icon: ShieldAlert,
        description: 'Acción de protección constitucional.'
    },
    'Auto de Liquidación': {
        label: 'Auto de Liquidación',
        color: 'bg-[rgb(244,176,131)] text-black border-[rgb(244,176,131)]',
        icon: Calculator,
        description: 'Cálculo de montos y prestaciones a pagar.'
    },
    'Acta de Requerimiento de Pago': {
        label: 'Acta de Requerimiento de Pago',
        color: 'bg-[rgb(244,176,131)] text-black border-[rgb(244,176,131)]',
        icon: FileWarning,
        description: 'Requerimiento formal de cumplimiento de pago.'
    },
    'Acta de Verificación de Requerimiento de Pago': {
        label: 'Acta de Verificación de Requerimiento de Pago',
        color: 'bg-[rgb(238,0,0)] text-white border-[rgb(238,0,0)]',
        icon: FileCheck,
        description: 'Constancia de la verificación del estado de pago.'
    },
    'Resolución para realizar Gestiones de Pago': {
        label: 'Resolución para realizar Gestiones de Pago',
        color: 'bg-[rgb(146,208,80)] text-black border-[rgb(146,208,80)]',
        icon: Handshake,
        description: 'Procedimiento interno para efectuar los pagos.'
    },
    'Pagado': {
        label: 'Pagado',
        color: 'bg-[rgb(0,176,80)] text-black border-[rgb(0,176,80)]',
        icon: CheckCircle,
        description: 'Obligación económica cumplida.'
    },
    'Fenecido (Archivado)': {
        label: 'Fenecido (Archivado)',
        color: 'bg-[rgb(191,191,191)] text-black border-[rgb(191,191,191)]',
        icon: Archive,
        description: 'Caso concluido y cerrado definitivamente.'
    }
};

export const getStatusConfig = (statusName) => {
    return CASE_STATUSES[statusName] || {
        label: statusName || 'Desconocido',
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: FileText
    };
};
