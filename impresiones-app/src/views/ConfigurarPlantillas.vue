<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Plantillas</h1>
        </div>

        <!-- Formulario para Subir Plantilla -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">Nueva Plantilla (.xlsx)</h2>

            <form @submit.prevent="handleUpload" class="space-y-6 max-w-2xl">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Descriptivo</label>
                        <input type="text" v-model="uploadData.nombre" required
                            class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            placeholder="Ej. Memorando Oficial">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Código (Prefijo Correlativo)</label>
                        <input type="text" v-model="uploadData.codigo" required maxlength="10"
                            class="block w-full uppercase shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            placeholder="Ej. MEMO">
                        <p class="mt-1 text-xs text-gray-500">Documentos usarán el formato: DOC-CÓDIGO-0001</p>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Archivo Excel (.xlsx)</label>
                    <input type="file" ref="fileInput"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required
                        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md p-1" />
                </div>

                <div v-if="successMsg" class="rounded-md bg-green-50 p-4">
                    <div class="flex">
                        <div class="ml-3 text-sm text-green-700">{{ successMsg }}</div>
                    </div>
                </div>

                <div v-if="errorMsg" class="rounded-md bg-red-50 p-4">
                    <div class="flex">
                        <div class="ml-3 text-sm text-red-700">{{ errorMsg }}</div>
                    </div>
                </div>

                <div class="flex justify-end">
                    <button type="submit" :disabled="loading"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 gap-2">
                        <UploadIcon v-if="!loading" class="w-4 h-4" />
                        <Loader2Icon v-else class="w-4 h-4 animate-spin" />
                        {{ loading ? 'Subiendo...' : 'Subir Plantilla' }}
                    </button>
                </div>
            </form>
        </div>

        <!-- Lista de Plantillas -->
        <div class="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden mt-6">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 class="text-lg font-semibold text-gray-800">Plantillas Activas</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Código</th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Nombre</th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Fecha Creación</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-if="plantillas.length === 0">
                            <td colspan="3" class="px-6 py-10 text-center text-gray-500 text-sm">
                                No hay plantillas registradas.
                            </td>
                        </tr>
                        <tr v-for="plantilla in plantillas" :key="plantilla.id"
                            class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{{ plantilla.codigo
                                }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ plantilla.nombre }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{
                                formatDate(plantilla.fecha_creacion) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { UploadIcon, Loader2Icon } from 'lucide-vue-next';
import api from '../services/api';

const plantillas = ref([]);
const fileInput = ref(null);
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const uploadData = ref({
    nombre: '',
    codigo: ''
});

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('es-GT', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(dateString));
};

const loadPlantillas = async () => {
    try {
        const response = await api.get('/impresiones/plantillas');
        plantillas.value = response.data;
    } catch (error) {
        console.error("Error cargando plantillas:", error);
    }
};

const handleUpload = async () => {
    loading.value = true;
    errorMsg.value = '';
    successMsg.value = '';

    if (!fileInput.value.files[0]) {
        errorMsg.value = "Debe adjuntar un archivo .xlsx";
        loading.value = false;
        return;
    }

    const formData = new FormData();
    formData.append('nombre', uploadData.value.nombre);
    formData.append('codigo', uploadData.value.codigo.toUpperCase());
    formData.append('archivo', fileInput.value.files[0]);

    try {
        await api.post('/impresiones/plantilla', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        successMsg.value = "Plantilla subida y registrada exitosamente.";

        // Reset form
        uploadData.value.nombre = '';
        uploadData.value.codigo = '';
        if (fileInput.value) fileInput.value.value = '';

        // Recargar lista
        await loadPlantillas();

        // Limpiar mensaje éxito después de un tiempo
        setTimeout(() => { successMsg.value = ''; }, 5000);

    } catch (error) {
        console.error("Error subiendo plantilla:", error);
        errorMsg.value = error.response?.data?.message || "Error al subir la plantilla.";
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadPlantillas();
});
</script>
