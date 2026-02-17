import {
    Clock,
    Gavel,
    CheckCircle,
    Archive,
    AlertCircle,
    FileText
} from 'lucide-vue-next';

export const CASE_STATUSES = {
    'En Trámite': {
        label: 'En Trámite',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        description: 'Proceso activo en instancias judiciales.'
    },
    'Sentencia': {
        label: 'Sentencia',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: Gavel,
        description: 'Se ha dictado sentencia (condenatoria o absolutoria).'
    },
    'Favorable': {
        label: 'Favorable',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        description: 'Resolución favorable para la institución.'
    },
    'Archivado': {
        label: 'Archivado',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Archive,
        description: 'Caso cerrado o desestimado.'
    },
    'Suspendido': { // Optional extra status
        label: 'Suspendido',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertCircle,
        description: 'Proceso detenido temporalmente.'
    }
};

export const getStatusConfig = (statusName) => {
    return CASE_STATUSES[statusName] || {
        label: statusName || 'Desconocido',
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: FileText
    };
};
