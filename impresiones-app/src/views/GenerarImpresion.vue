<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Generar Documento</h1>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form @submit.prevent="handleSubmit" class="space-y-6 max-w-2xl">

                <!-- Selección de Plantilla -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Plantilla</label>
                    <select v-model="formData.id_plantilla" required
                        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border text-gray-900">
                        <option value="" disabled>Seleccione una plantilla...</option>
                        <option v-for="plantilla in plantillas" :key="plantilla.id" :value="plantilla.id">
                            {{ plantilla.nombre }} ({{ plantilla.codigo }})
                        </option>
                    </select>
                </div>

                <!-- Datos Dinámicos -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Enviado Por</label>
                        <input type="text" v-model="formData.enviado_por" required
                            class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            placeholder="Ej. Juan Pérez">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Unidad Remitente</label>
                        <input type="text" v-model="formData.unidad_remitente" required
                            class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            placeholder="Ej. Dirección de Informática">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Destinatario</label>
                        <input type="text" v-model="formData.destinatario" required
                            class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            placeholder="Ej. María López">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Unidad Destinatario</label>
                        <input type="text" v-model="formData.unidad_destinatario" required
                            class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            placeholder="Ej. Recursos Humanos">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Asunto / Descripción</label>
                    <textarea v-model="formData.descripcion" rows="3" required
                        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                        placeholder="Breve descripción del documento"></textarea>
                </div>

                <!-- Notificaciones -->
                <div v-if="errorMsg" class="rounded-md bg-red-50 p-4">
                    <div class="flex">
                        <div class="ml-3 text-sm text-red-700">{{ errorMsg }}</div>
                    </div>
                </div>

                <div class="flex justify-end pt-4">
                    <button type="submit" :disabled="loading"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 gap-2">
                        <DownloadIcon v-if="!loading" class="w-4 h-4" />
                        <Loader2Icon v-else class="w-4 h-4 animate-spin" />
                        {{ loading ? 'Generando...' : 'Generar y Descargar' }}
                    </button>
                </div>

            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { DownloadIcon, Loader2Icon } from 'lucide-vue-next';
import api from '../services/api';

const plantillas = ref([]);
const loading = ref(false);
const errorMsg = ref('');

const formData = ref({
    id_plantilla: '',
    enviado_por: '',
    unidad_remitente: '',
    destinatario: '',
    unidad_destinatario: '',
    descripcion: ''
});

const loadPlantillas = async () => {
    try {
        const response = await api.get('/impresiones/plantillas');
        plantillas.value = response.data;
    } catch (error) {
        console.error("Error cargando plantillas:", error);
        errorMsg.value = "Hubo un problema al cargar las plantillas disponibles.";
    }
};

const handleSubmit = async () => {
    loading.value = true;
    errorMsg.value = '';

    try {
        const payload = {
            id_plantilla: formData.value.id_plantilla,
            datos_formulario: {
                enviado_por: formData.value.enviado_por,
                unidad_remitente: formData.value.unidad_remitente,
                destinatario: formData.value.destinatario,
                unidad_destinatario: formData.value.unidad_destinatario,
                descripcion: formData.value.descripcion
            }
        };

        // Solicitar el archivo como blob
        const response = await api.post('/impresiones/generar', payload, {
            responseType: 'blob'
        });

        // Extraer nombre del archivo del header Content-Disposition si es posible
        let filename = 'documento_generado.xlsx';
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        // Crear enlace temporal de descarga y forzar clic
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);

        // Reset form parcial
        formData.value.descripcion = '';

    } catch (error) {
        console.error("Error generando documento:", error);
        // Intentar leer el mensaje de error si viene en JSON a pesar de responseType 'blob'
        if (error.response && error.response.data && error.response.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const errData = JSON.parse(reader.result);
                    errorMsg.value = errData.message || "Error al generar el documento.";
                } catch (e) {
                    errorMsg.value = "Error al generar el documento.";
                }
            };
            reader.readAsText(error.response.data);
        } else {
            errorMsg.value = error.response?.data?.message || "Ocurrió un error inesperado al generar el documento.";
        }
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadPlantillas();
});
</script>
