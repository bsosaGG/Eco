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
                    <p class="text-2xl font-bold text-gray-900">{{ statistics.totalGenerated || 0 }}</p>
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
                <div class="p-3 bg-green-100 text-green-600 rounded-lg">
                    <FileSpreadsheetIcon class="w-6 h-6" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Plantillas Activas</p>
                    <p class="text-2xl font-bold text-gray-900">{{ statistics.activeTemplates || 0 }}</p>
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
                                Plantilla</th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Creador</th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Fecha</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <!-- Nota: En un escenario real, cargar esto de la API -->
                        <tr v-if="recentDocs.length === 0">
                            <td colspan="4" class="px-6 py-10 text-center text-gray-500 text-sm">
                                No hay documentos generados recientemente.
                            </td>
                        </tr>
                        <tr v-for="doc in recentDocs" :key="doc.id" class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{{ doc.correlativo
                                }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ doc.plantilla_nombre }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ doc.usuario_nombre }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{
                                formatDate(doc.fecha_creacion) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { FileTextIcon, FileSpreadsheetIcon } from 'lucide-vue-next';
import api from '../services/api'; // Necesitaríamos endpoints en el Backend para llenar esto real, por ahora lo mockeamos/preparamos

const recentDocs = ref([]);
const statistics = ref({ totalGenerated: 0, activeTemplates: 0 });

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('es-GT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
};

const fetchData = async () => {
    try {
        // En una implementación completa agregaríamos un endpoint en la API: /api/impresiones/dashboard
        // Por ahora cargamos las plantillas para mostrar algo de vida
        const templatesRes = await api.get('/impresiones/plantillas');
        statistics.value.activeTemplates = templatesRes.data.length || 0;

        // Simulación de documentos
        // const docsRes = await api.get('/impresiones/recientes');
        // recentDocs.value = docsRes.data || [];
    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
};

onMounted(() => {
    fetchData();
});
</script>
