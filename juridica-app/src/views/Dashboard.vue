<template>
    <div class="space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div
                class="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Casos Activos</p>
                    <p class="text-2xl md:text-3xl font-bold text-gray-800 mt-1">{{ stats.casos_activos }}</p>
                </div>
                <div class="p-3 bg-blue-50 rounded-full text-blue-600">
                    <Activity class="w-6 h-6" />
                </div>
            </div>
            <!-- More cards omitted for brevity assuming simple structure, adhering to existing if needed but here we just keep layout -->
            <div
                class="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">En Trámite</p>
                    <p class="text-2xl md:text-3xl font-bold text-yellow-600 mt-1">{{ stats.en_tramite }}</p>
                </div>
                <div class="p-3 bg-yellow-50 rounded-full text-yellow-600">
                    <Clock class="w-6 h-6" />
                </div>
            </div>
            <div
                class="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Sentencias</p>
                    <p class="text-2xl md:text-3xl font-bold text-red-600 mt-1">{{ stats.sentencias }}</p>
                </div>
                <div class="p-3 bg-red-50 rounded-full text-red-600">
                    <Gavel class="w-6 h-6" />
                </div>
            </div>
            <div
                class="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Monto Total a Pagar</p>
                    <p class="text-lg md:text-xl font-bold text-gray-800 mt-1">{{ formatMoney(stats.contingencia_total)
                        }}</p>
                </div>
                <div class="p-3 bg-purple-50 rounded-full text-purple-600">
                    <DollarSign class="w-6 h-6" />
                </div>
            </div>
        </div>

        <!-- Filters & Actions -->
        <div
            class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div class="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                <div class="relative w-full md:w-80">
                    <Search class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input v-model="filters.search" type="text"
                        placeholder="Buscar por proceso, juzgado o demandante..."
                        class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <select v-model="filters.estado"
                    class="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto">
                    <option value="">Todos los Estados</option>
                    <option v-for="(config, status) in CASE_STATUSES" :key="status" :value="status">
                        {{ status }}
                    </option>
                </select>
            </div>
            <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <button v-if="canExportPdf" @click="exportSelected('pdf')"
                    :disabled="selected.length === 0 || isExporting"
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed w-full md:w-auto">
                    <Download v-if="!isExporting" class="w-4 h-4" />
                    <span v-else
                        class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full block"></span>
                    <span>{{ isExporting ? 'Generando...' : `PDFs (${selected.length})` }}</span>
                </button>
                <button v-if="canExportDoc" @click="exportSelected('docx')"
                    :disabled="selected.length === 0 || isExporting"
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed w-full md:w-auto">
                    <Download v-if="!isExporting" class="w-4 h-4" />
                    <span v-else
                        class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full block"></span>
                    <span>{{ isExporting ? 'Generando...' : `Fichas (${selected.length})` }}</span>
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left min-w-[800px]">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-4 py-4 w-10">
                                <input type="checkbox" :checked="allSelected" @change="toggleAll"
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            </th>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">PROCESO
                                No.</th>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Demandante</th>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Juzgado
                            </th>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado
                            </th>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actitud
                                Proc.</th>
                            <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Última
                                Act.</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr v-for="juicio in juicios" :key="juicio.id"
                            class="hover:bg-gray-50 transition-colors cursor-pointer"
                            @click="handleRowClick(juicio.id)">
                            <td class="px-4 py-4" @click.stop>
                                <input type="checkbox" v-model="selected" :value="juicio.id"
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            </td>
                            <td class="px-6 py-4 text-sm font-medium text-blue-600">{{ juicio.numero_proceso }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ juicio.demandante_nombre ||
                                juicio.demandante_id }}</td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                <div class="line-clamp-3 max-w-xs" :title="juicio.organo_jurisdiccional">
                                    {{ juicio.organo_jurisdiccional }}
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border max-w-[95px]"
                                    :class="getStatusConfig(juicio.estado_procesal).color"
                                    :title="juicio.estado_procesal">
                                    <component :is="getStatusConfig(juicio.estado_procesal).icon"
                                        class="w-3.5 h-3.5 flex-shrink-0" />
                                    <span class="truncate">{{ juicio.estado_procesal }}</span>
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600">
                                <div class="line-clamp-3 max-w-xs" :title="juicio.actitud_procesal">
                                    {{ juicio.actitud_procesal }}
                                </div>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">{{ formatDate(juicio.fecha_actualizacion) }}
                            </td>
                        </tr>
                        <tr v-if="juicios.length === 0">
                            <td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500">
                                No se encontraron registros.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div
                class="px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <span class="text-sm text-gray-500 text-center md:text-left">
                    Mostrando {{ (meta.page - 1) * meta.limit + 1 }} a {{ Math.min(meta.page * meta.limit, meta.total)
                    }} de {{ meta.total }} entradas
                </span>
                <div class="flex space-x-2">
                    <button @click="changePage(meta.page - 1)" :disabled="meta.page === 1"
                        class="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Anterior
                    </button>
                    <button @click="changePage(meta.page + 1)" :disabled="meta.page >= meta.totalPages"
                        class="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Activity, Clock, Gavel, DollarSign, Search, Download, MoreHorizontal } from 'lucide-vue-next';
import juridicaService from '../services/juridica.service';
import { CASE_STATUSES, getStatusConfig } from '../constants/juridica.constants';
import authService from '../services/auth.service';

const router = useRouter();

// State
const juicios = ref([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
const loading = ref(false);
const filters = ref({
    search: '',
    estado: ''
});
const selected = ref([]);
const stats = ref({
    casos_activos: 0,
    en_tramite: 0,
    sentencias: 0,
    contingencia_total: 0
});

// Computed
import { computed } from 'vue';

const allSelected = computed(() => {
    return juicios.value.length > 0 && selected.value.length === juicios.value.length;
});
const canExportDoc = computed(() => authService.hasPermission('juridica:generate-doc'));
const canExportPdf = computed(() => authService.hasPermission('juridica:generate-pdf'));

// Methods
const toggleAll = () => {
    if (allSelected.value) {
        selected.value = [];
    } else {
        selected.value = juicios.value.map(j => j.id);
    }
};

const isExporting = ref(false);

const exportSelected = async (format) => {
    if (selected.value.length === 0) return;

    // Sequential download - Simple logic without needing ZIP backend support yet
    // For a cleaner UX in real prod, a ZIP endpoint is better, but this satifies "generate ... key info"
    let confirmMsg = `¿Generar ${selected.value.length} ${format === 'pdf' ? 'PDF(s)' : 'ficha(s)'}? Si son muchas, su navegador podría pedir permiso para múltiples descargas.`;
    if (!confirm(confirmMsg)) return;

    isExporting.value = true;
    try {
        for (const id of selected.value) {
            try {
                const response = await juridicaService.exportDocx(id, format);
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                // Find juicio to name file properly
                const j = juicios.value.find(Item => Item.id === id);
                const filename = j ? `Ficha_${j.numero_proceso}` : `Ficha_${id}`;
                link.setAttribute('download', filename + "." + format);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Small delay to prevent browser choking
                await new Promise(r => setTimeout(r, 500));
            } catch (error) {
                console.error(`Error exporting ${id}`, error);
            }
        }
    } finally {
        isExporting.value = false;
    }
};

const handleRowClick = (id) => {
    router.push({ name: 'CaseDetail', params: { id } });
};

const loadData = async () => {
    loading.value = true;
    selected.value = []; // Reset selection on reload
    try {
        const params = {
            page: meta.value.page,
            limit: meta.value.limit,
            search: filters.value.search,
            estado: filters.value.estado
        };
        const response = await juridicaService.getJuicios(params);

        if (Array.isArray(response.data)) {
            juicios.value = response.data;
            meta.value = { page: 1, limit: response.data.length, total: response.data.length, totalPages: 1 };
        } else {
            juicios.value = response.data.data || [];
            meta.value = response.data.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };
        }
    } catch (error) {
        console.error("Error loading juicios:", error);
    } finally {
        loading.value = false;
    }
};

const loadStats = async () => {
    try {
        const response = await juridicaService.getStats();
        stats.value = response.data;
    } catch (error) {
        console.error("Error loading stats:", error);
    }
};

const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);
};

const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= meta.value.totalPages) {
        meta.value.page = newPage;
        loadData();
    }
};

const goToDetail = (id) => {
    router.push({ name: 'CaseDetail', params: { id } });
};

// Utils
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
};

// Watchers
let debounceTimeout;
watch(() => filters.value.search, () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        meta.value.page = 1;
        loadData();
    }, 300);
});

watch(() => filters.value.estado, () => {
    meta.value.page = 1;
    loadData();
});

onMounted(() => {
    // Temporary: Hardcode token for dev testing if not present (since we didn't implement full login UI yet)
    // Or assume user manually logs in via console/postman copy-paste
    // For now, let's load
    loadData();
    loadStats();
});
</script>
