<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
    isOpen: Boolean,
    event: Object // Datos del evento seleccionado
})

const emit = defineEmits(['close'])

const formData = ref({
    title: '',
    numero_proceso: '',
    descripcion: '',
    sala_corte: '',
    estado_recurso: '',
    realizado: false,
    fecha_realizado: '',
    start_date: ''
})

// Inicializar el formulario cuando cambia el evento prop o se abre
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        if (props.event) {
            const startStr = props.event.startStr || props.event.start;
            const start = startStr ? new Date(startStr) : new Date();

            const fechaRealizado = props.event.extendedProps?.fecha_realizado || '';
            const fechaRealizadoFormateada = fechaRealizado ? toLocalDateString(new Date(fechaRealizado.replace('Z', '-06:00'))) : '';

            formData.value = {
                title: props.event.title || '',
                numero_proceso: props.event.extendedProps?.numero_proceso || '',
                descripcion: props.event.extendedProps?.descripcion || '',
                sala_corte: props.event.extendedProps?.sala_corte || '',
                estado_recurso: props.event.extendedProps?.estado_recurso || '',
                realizado: props.event.extendedProps?.realizado || false,
                fecha_realizado: fechaRealizadoFormateada,
                start_date: `${toLocalDateString(start)} a las ${toLocalTimeString(start)}`
            }
        }
    }
})

// Función auxiliar para formatear localmente
const toLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
};

const toLocalTimeString = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="overflow-y-auto h-screen flex py-4">
            <div class="bg-white rounded-lg shadow-xl max-w-lg mx-4 my-auto md:m-auto overflow-hidden">
                <!-- Header -->
                <div class="bg-[#0D1B46] px-6 py-4 flex justify-between items-center border-b-[3px] border-[#42ABFF]">
                    <h3 class="text-white text-lg font-bold">
                        Detalle del Evento Procesal
                    </h3>
                    <button @click="$emit('close')" class="text-white hover:text-gray-300">
                        <svg xmlns="http://w3.org" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-5">
                    <div>
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Evento</p>
                        <p class="text-lg font-semibold text-gray-800">{{ formData.title }}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">No. Proceso</p>
                            <p class="text-md font-medium text-gray-800">{{ formData.numero_proceso || 'N/A' }}</p>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha Interposición</p>
                            <p class="text-md font-medium text-gray-800">{{ formData.start_date }}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Sala / Corte / Instancia
                            </p>
                            <p class="text-md text-gray-800">{{ formData.sala_corte || 'N/A' }}</p>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Estado Recurso</p>
                            <p class="text-md text-gray-800">{{ formData.estado_recurso || 'N/A' }}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Estado General</p>
                            <span v-if="formData.realizado"
                                class="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Realizado
                            </span>
                            <span v-else
                                class="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Pendiente
                            </span>
                        </div>

                        <div v-if="formData.realizado">
                            <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Fecha Realizado</p>
                            <p class="text-md text-gray-800">{{ formData.fecha_realizado || 'N/A' }}</p>
                        </div>

                    </div>

                    <div>
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Descripción</p>
                        <div
                            class="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap min-h-[5rem]">
                            {{ formData.descripcion || 'No hay descripción disponible para este evento.' }}
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
                    <button @click="$emit('close')"
                        class="bg-white text-gray-700 border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm active:scale-95">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
