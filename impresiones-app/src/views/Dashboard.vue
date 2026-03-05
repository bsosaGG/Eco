<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Dashboard de Impresiones</h1>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
                <div class="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <FileTextIcon class="w-6 h-6" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Documentos Generados</p>
                    <p class="text-2xl font-bold text-gray-900">{{ statistics.total_generados || 0 }}</p>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
                <div class="p-3 bg-green-100 text-green-600 rounded-lg">
                    <FileSpreadsheetIcon class="w-6 h-6" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Plantillas Activas</p>
                    <p class="text-2xl font-bold text-gray-900">{{ statistics.plantillas_activas || 0 }}</p>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
                <div class="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                    <AlertCircleIcon class="w-6 h-6" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Doc. Pendientes Recibir</p>
                    <p class="text-2xl font-bold text-gray-900">{{ statistics.pendientes_recibir || 0 }}</p>
                </div>
            </div>
        </div>

        <!-- Recent Activity Table -->
        <div class="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 class="text-lg font-semibold text-gray-800">Últimos Documentos Generados</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Correlativo</th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Creador</th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Fecha</th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Formulario</th>
                            <th scope="col"
                                class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Estado</th>

                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-if="recentDocs.length === 0">
                            <td colspan="6" class="px-6 py-10 text-center text-gray-500 text-sm">
                                No hay documentos en esta página.
                            </td>
                        </tr>
                        <tr v-for="doc in recentDocs" :key="doc.id" class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">{{ doc.correlativo
                                }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ doc.usuario_nombre || 'N/A'
                            }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{
                                formatDate(doc.fecha_creacion) }}</td>

                            <!-- Botón Ver Datos -->
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button @click="openDataModal(doc)"
                                    class="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 font-medium bg-transparent border-0 p-0 m-0">
                                    <EyeIcon class="w-4 h-4" /> Ver Datos
                                </button>
                            </td>

                            <!-- Estado Muestra si está Recibido o Pendiente -->
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <span v-if="doc.recibido"
                                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                                    :title="'Recibido el: ' + formatDate(doc.fecha_recibido)">
                                    Recibido
                                </span>
                                <span v-else
                                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Pendiente
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Controles de Paginación -->
            <div class="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between sm:px-6">
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            Mostrando <span class="font-medium">{{ (pagination.currentPage - 1) * pagination.limit + 1
                                }}</span>
                            a <span class="font-medium">{{ Math.min(pagination.currentPage * pagination.limit,
                                pagination.totalRegistros) }}</span>
                            de <span class="font-medium">{{ pagination.totalRegistros }}</span> resultados
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button @click="changePage(pagination.currentPage - 1)"
                                :disabled="pagination.currentPage === 1"
                                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                <span class="sr-only">Anterior</span>
                                <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
                            </button>

                            <!-- Paginas simplificadas -->
                            <span
                                class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                {{ pagination.currentPage }} / {{ pagination.totalPages || 1 }}
                            </span>

                            <button @click="changePage(pagination.currentPage + 1)"
                                :disabled="pagination.currentPage >= pagination.totalPages"
                                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                <span class="sr-only">Siguiente</span>
                                <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Datos del Formulario -->
        <Teleport to="body">
            <div v-if="isModalOpen" class="fixed z-[100] inset-0 overflow-y-auto" aria-labelledby="modal-title"
                role="dialog" aria-modal="true">
                <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                    <!-- Fondo oscuro -->
                    <div class="fixed inset-0 bg-gray-900/75 transition-opacity z-40" aria-hidden="true"
                        @click="closeDataModal"></div>

                    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                    <!-- Panel del modal -->
                    <div
                        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100 relative z-50">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="sm:flex sm:items-start w-full">
                                <div
                                    class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <FileTextIcon class="h-6 w-6 text-blue-600" aria-hidden="true" />
                                </div>
                                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1 w-full min-w-0">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Datos del Documento: <span class="text-blue-600 font-bold">{{
                                            selectedDoc?.correlativo }}</span>
                                    </h3>

                                    <div class="mt-5 w-full text-sm text-gray-700 space-y-4">
                                        <!-- Detalles del Sistema -->
                                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h4 class="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                                                Información del Sistema</h4>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p
                                                        class="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                                        Creado por</p>
                                                    <p class="font-medium text-gray-900 mt-1">{{
                                                        selectedDoc?.usuario_nombre || 'Desconocido' }} <span
                                                            class="text-xs text-gray-500 font-normal"
                                                            v-if="selectedDoc?.creador_correo"><br>{{
                                                                selectedDoc?.creador_correo }}</span></p>
                                                    <p class="text-xs text-gray-500 mt-1 flex items-center gap-1"><span
                                                            class="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                                                        {{ formatDate(selectedDoc?.fecha_creacion) }}</p>
                                                </div>
                                                <div>
                                                    <p
                                                        class="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                                        Recibido por</p>
                                                    <div v-if="selectedDoc?.recibido" class="mt-1">
                                                        <p class="font-medium text-gray-900">{{
                                                            selectedDoc?.receptor_usuario_nombre || 'Desconocido' }}
                                                            <span
                                                                class="text-xs text-gray-500 font-normal block">(Firma:
                                                                {{ selectedDoc?.receptor_nombre || 'Desconocido'
                                                                }})</span></p>
                                                        <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                            <span
                                                                class="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                                                            {{ formatDate(selectedDoc?.fecha_recibido) }}
                                                        </p>
                                                    </div>
                                                    <div v-else class="mt-2">
                                                        <span
                                                            class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">No
                                                            recibido (Pendiente)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Detalles del Formulario -->
                                        <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <h4
                                                class="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2 flex justify-between items-center">
                                                <span>Datos del Formulario</span>
                                                <span
                                                    class="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Plantilla:
                                                    {{ selectedDoc?.plantilla_nombre }}</span>
                                            </h4>

                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                v-if="selectedDoc?.datos_formulario">
                                                <div v-for="(value, key) in selectedDoc.datos_formulario" :key="key"
                                                    :class="{ 'md:col-span-2': typeof value === 'string' && value.length > 50 }">
                                                    <p
                                                        class="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                                        {{ formatFormKey(key) }}</p>
                                                    <div class="mt-1 p-2 bg-gray-50 rounded border border-gray-100">
                                                        <p
                                                            class="font-medium text-gray-900 whitespace-pre-wrap break-words text-sm">
                                                            {{ value || 'N/A' }}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p v-else class="text-gray-500 italic">No hay datos de formulario
                                                disponibles.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                            <button type="button"
                                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                @click="closeDataModal">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
    FileTextIcon, FileSpreadsheetIcon, AlertCircleIcon,
    ChevronLeftIcon, ChevronRightIcon, EyeIcon, CheckCircleIcon
} from 'lucide-vue-next';
import api from '../services/api';

const recentDocs = ref([]);
const statistics = ref({ total_generados: 0, plantillas_activas: 0, pendientes_recibir: 0 });
const pagination = ref({ currentPage: 1, limit: 10, totalPages: 1, totalRegistros: 0 });

const isModalOpen = ref(false);
const selectedDoc = ref(null);

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('es-GT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
};

const formatFormKey = (key) => {
    if (!key) return '';
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const fetchKPIs = async () => {
    try {
        const res = await api.get('/impresiones/kpis');
        statistics.value = res.data;
    } catch (error) {
        console.error("Error obteniendo KPIs", error);
    }
}

const fetchDocuments = async (page = 1) => {
    try {
        const res = await api.get(`/impresiones/recientes?page=${page}&limit=${pagination.value.limit}`);
        recentDocs.value = res.data.data || [];
        pagination.value = res.data.pagination;
    } catch (error) {
        console.error("Error obteniendo documentos", error);
    }
}

const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.totalPages) {
        fetchDocuments(page);
    }
}

const openDataModal = (doc) => {
    selectedDoc.value = doc;
    isModalOpen.value = true;
}

const closeDataModal = () => {
    isModalOpen.value = false;
    selectedDoc.value = null;
}

const loadData = () => {
    fetchKPIs();
    fetchDocuments(1);
}

onMounted(() => {
    loadData();
});
</script>
