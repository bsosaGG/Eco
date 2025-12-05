<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
    isOpen: Boolean,
    event: Object // Si es null, es creación. Si tiene datos, es edición.
})

const emit = defineEmits(['close', 'save', 'delete'])

const formData = ref({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: ''
})

const isEditing = computed(() => !!props.event?.id)

// Inicializar el formulario cuando cambia el evento prop o se abre
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        if (props.event) {
            // Asegurarse de manejar fechas correctamente
            const start = new Date(props.event.startStr || props.event.start)
            const end = props.event.endStr || props.event.end ? new Date(props.event.endStr || props.event.end) : new Date(start.getTime() + 60 * 60 * 1000)

            formData.value = {
                title: props.event.title || '',
                description: props.event.extendedProps?.description || '',
                location: props.event.extendedProps?.location || '',
                // Formato YYYY-MM-DD para input type="date"
                start_date: start.toISOString().split('T')[0],
                end_date: end.toISOString().split('T')[0],
                // Formato HH:mm para input type="time"
                start_time: start.toTimeString().slice(0, 5),
                end_time: end.toTimeString().slice(0, 5)
            }
        } else {
            // Reset para nuevo evento
            formData.value = {
                title: '', description: '', location: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '10:00'
            }
        }
    }
})

const handleSave = () => {
    // Combinar fecha y hora
    const startDateTime = `${formData.value.start_date}T${formData.value.start_time}:00`
    const endDateTime = `${formData.value.end_date}T${formData.value.end_time}:00`

    const payload = {
        title: formData.value.title,
        description: formData.value.description,
        location: formData.value.location,
        start_date: startDateTime,
        end_date: endDateTime
    }

    emit('save', payload)
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <!-- Header -->
            <div class="bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h3 class="text-white text-lg font-bold">
                    {{ isEditing ? 'Editar Evento' : 'Nuevo Evento' }}
                </h3>
                <button @click="$emit('close')" class="text-white hover:text-gray-200">
                    ✕
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-1">Título</label>
                    <input v-model="formData.title" type="text"
                        class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Reunión de equipo">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 text-sm font-bold mb-1">Inicio</label>
                        <div class="flex gap-2">
                            <input v-model="formData.start_date" type="date"
                                class="border rounded px-2 py-2 w-full text-sm">
                            <input v-model="formData.start_time" type="time"
                                class="border rounded px-2 py-2 w-full text-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-gray-700 text-sm font-bold mb-1">Fin</label>
                        <div class="flex gap-2">
                            <input v-model="formData.end_date" type="date"
                                class="border rounded px-2 py-2 w-full text-sm">
                            <input v-model="formData.end_time" type="time"
                                class="border rounded px-2 py-2 w-full text-sm">
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-1">Ubicación</label>
                    <input v-model="formData.location" type="text"
                        class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Sala de conferencias">
                </div>

                <div>
                    <label class="block text-gray-700 text-sm font-bold mb-1">Descripción</label>
                    <textarea v-model="formData.description" rows="3"
                        class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
            </div>

            <!-- Footer -->
            <div class="bg-gray-50 px-6 py-4 flex justify-between">
                <button v-if="isEditing" @click="$emit('delete')"
                    class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
                    Eliminar
                </button>
                <div v-else></div> <!-- Spacer -->

                <div class="flex gap-2">
                    <button @click="$emit('close')"
                        class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition">
                        Cancelar
                    </button>
                    <button @click="handleSave"
                        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
