<template>
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <!-- Sección: Generar Documento -->
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Generar Documento</h1>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form @submit.prevent="handleSubmit" class="space-y-6 w-full">

                    <!-- Datos Dinámicos -->
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-6">
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

        <!-- Sección: Registro de Recepción -->
        <div class="space-y-6">
            <div class="flex justify-between items-center mt-8 xl:mt-0">
                <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Registro de Recepción</h1>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form @submit.prevent="handleReceiveSubmit" class="space-y-6 w-full">
                    <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Correlativo (Número)</label>
                            <input type="number" v-model="receiveData.secuencia" required min="1"
                                class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                placeholder="Ej. 1">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Recibido Por (Nombre
                                Libre)</label>
                            <input type="text" v-model="receiveData.nombre_recibe" required
                                class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                placeholder="Ej. Oficial de Seguridad">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                            <input type="datetime-local" v-model="receiveData.fecha_recibido" required
                                class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border">
                        </div>
                    </div>

                    <div v-if="receiveSuccessMsg" class="rounded-md bg-green-50 p-4">
                        <div class="flex">
                            <div class="ml-3 text-sm text-green-700">{{ receiveSuccessMsg }}</div>
                        </div>
                    </div>

                    <div v-if="receiveErrorMsg" class="rounded-md bg-red-50 p-4">
                        <div class="flex">
                            <div class="ml-3 text-sm text-red-700">{{ receiveErrorMsg }}</div>
                        </div>
                    </div>

                    <div class="flex justify-end pt-4">
                        <button type="submit" :disabled="receiveLoading"
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 gap-2">
                            <Loader2Icon v-if="receiveLoading" class="w-4 h-4 animate-spin" />
                            {{ receiveLoading ? 'Guardando...' : 'Dar por Recibido' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { DownloadIcon, Loader2Icon } from 'lucide-vue-next';
import api from '../services/api';

const loading = ref(false);
const errorMsg = ref('');

const formData = ref({
    enviado_por: '',
    unidad_remitente: '',
    destinatario: '',
    unidad_destinatario: '',
    descripcion: ''
});

const receiveLoading = ref(false);
const receiveErrorMsg = ref('');
const receiveSuccessMsg = ref('');

const receiveData = ref({
    secuencia: '',
    nombre_recibe: '',
    fecha_recibido: ''
});

const handleSubmit = async () => {
    if (!confirm("¿Está seguro de que desea generar el documento con estos datos?")) {
        return;
    }
    loading.value = true;
    errorMsg.value = '';

    try {
        const payload = {
            // El backend asume la plantilla más reciente.
            datos_formulario: {
                enviado_por: formData.value.enviado_por,
                unidad_remitente: formData.value.unidad_remitente,
                destinatario: formData.value.destinatario,
                unidad_destinatario: formData.value.unidad_destinatario,
                descripcion: formData.value.descripcion
            }
        };

        // Solicitar el archivo como blob
        const response = await api.post('/generar', payload, {
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

const handleReceiveSubmit = async () => {
    if (!confirm("¿Confirma que este documento ha sido recibido físicamente y los datos son correctos?")) {
        return;
    }
    receiveLoading.value = true;
    receiveErrorMsg.value = '';
    receiveSuccessMsg.value = '';

    try {
        const payload = {
            secuencia: receiveData.value.secuencia,
            nombre_recibe: receiveData.value.nombre_recibe,
            fecha_recibido: receiveData.value.fecha_recibido
        };

        const response = await api.patch('/recibido', payload);

        receiveSuccessMsg.value = response.data.message || "Documento marcado como recibido exitosamente.";

        // Limpiar formulario y enfocar para siguiente entrada si se desea
        receiveData.value.secuencia = '';
        receiveData.value.nombre_recibe = '';
        receiveData.value.fecha_recibido = '';

        setTimeout(() => { receiveSuccessMsg.value = ''; }, 5000);
    } catch (error) {
        console.error("Error al registrar recepción:", error);
        receiveErrorMsg.value = error.response?.data?.message || "Ocurrió un error al registrar la recepción.";
    } finally {
        receiveLoading.value = false;
    }
};
</script>
