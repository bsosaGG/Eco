<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-800">Configuración de Plantillas</h2>
                <p class="text-gray-500 mt-1">Gestione los documentos base para la generación de fichas.</p>
            </div>
            <button @click="showModal = true"
                class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <UploadCloud class="w-4 h-4" />
                <span>Nueva Plantilla</span>
            </button>
        </div>

        <!-- Templates List -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <template v-if="loading">
                <div class="p-8 text-center text-gray-500">Cargando plantillas...</div>
            </template>
            <template v-else>
                <table class="w-full text-left">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre
                            </th>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Descripción</th>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha
                            </th>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr v-for="template in templates" :key="template.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 flex items-center gap-3">
                                <div class="bg-blue-50 p-2 rounded text-blue-600">
                                    <FileText class="w-5 h-5" />
                                </div>
                                <span class="font-medium text-gray-800">{{ template.nombre }}</span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600">{{ template.descripcion }}</td>
                            <td class="px-6 py-4 text-sm text-gray-500">{{ formatDate(template.fecha_actualizacion) }}
                            </td>
                            <td class="px-6 py-4">
                                <span v-if="template.activo"
                                    class="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Activo</span>
                                <span v-else
                                    class="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Inactivo</span>
                            </td>
                        </tr>
                        <tr v-if="templates.length === 0">
                            <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                                No hay plantillas configuradas.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </template>
        </div>

        <!-- Upload Modal -->
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800">Subir Nueva Plantilla</h3>
                    <button @click="showModal = false" class="text-gray-400 hover:text-gray-600">
                        <X class="w-5 h-5" />
                    </button>
                </div>

                <form @submit.prevent="uploadTemplate" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input v-model="form.nombre" type="text"
                            class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. Ficha General v2" required />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea v-model="form.descripcion" rows="3"
                            class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Detalles sobre esta versión..."></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Archivo Word (.docx)</label>
                        <div
                            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input type="file" @change="handleFile" accept=".docx"
                                class="absolute inset-0 opacity-0 cursor-pointer" required />
                            <div v-if="form.file"
                                class="flex items-center justify-center gap-2 text-green-600 font-medium">
                                <CheckCircle class="w-5 h-5" />
                                {{ form.file.name }}
                            </div>
                            <div v-else class="text-gray-500">
                                <UploadCloud class="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p class="text-sm">Arrastra o selecciona un archivo .docx</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end pt-4 gap-3">
                        <button type="button" @click="showModal = false"
                            class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
                        <button type="submit"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                            :disabled="uploading">
                            {{ uploading ? 'Subiendo...' : 'Guardar Plantilla' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { UploadCloud, FileText, X, CheckCircle } from 'lucide-vue-next';
import api from '../services/api';

const loading = ref(true);
const templates = ref([]);
const showModal = ref(false);
const uploading = ref(false);
const form = ref({
    nombre: '',
    descripcion: '',
    file: null
});

const loadTemplates = async () => {
    try {
        const res = await api.get('/juridica/config/templates');
        templates.value = res.data;
    } catch (error) {
        console.error("Error loading templates:", error);
    } finally {
        loading.value = false;
    }
};

const handleFile = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.docx')) {
        form.value.file = file;
    } else {
        alert("Solo se permiten archivos .docx");
        e.target.value = null;
    }
};

const uploadTemplate = async () => {
    if (!form.value.file) return;

    uploading.value = true;
    try {
        const formData = new FormData();
        formData.append('nombre', form.value.nombre);
        formData.append('descripcion', form.value.descripcion);
        formData.append('archivo', form.value.file);

        await api.post('/juridica/config/templates', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        showModal.value = false;
        form.value = { nombre: '', descripcion: '', file: null };
        loadTemplates();
    } catch (error) {
        console.error("Error uploading template:", error);
        alert("Error al subir la plantilla");
    } finally {
        uploading.value = false;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-GT', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

onMounted(() => {
    loadTemplates();
});
</script>
