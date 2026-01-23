<template>
    <div class="space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Casos Activos</p>
                    <p class="text-3xl font-bold text-gray-800 mt-1">24</p>
                </div>
                <div class="p-3 bg-blue-50 rounded-full text-blue-600">
                    <Activity class="w-6 h-6" />
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">En Trámite</p>
                    <p class="text-3xl font-bold text-orange-600 mt-1">12</p>
                </div>
                <div class="p-3 bg-orange-50 rounded-full text-orange-600">
                    <Clock class="w-6 h-6" />
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Favorables</p>
                    <p class="text-3xl font-bold text-green-600 mt-1">8</p>
                </div>
                <div class="p-3 bg-green-50 rounded-full text-green-600">
                    <CheckCircle class="w-6 h-6" />
                </div>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Contingencia Est.</p>
                    <p class="text-xl font-bold text-gray-800 mt-1">Q450,000</p>
                </div>
                <div class="p-3 bg-purple-50 rounded-full text-purple-600">
                    <DollarSign class="w-6 h-6" />
                </div>
            </div>
        </div>

        <!-- Filters & Actions -->
        <div
            class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div class="flex items-center gap-4 w-full md:w-auto">
                <div class="relative w-full md:w-80">
                    <Search class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input v-model="filters.search" type="text"
                        placeholder="Buscar por proceso, juzgado o demandante..."
                        class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <select v-model="filters.estado"
                    class="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Todos los Estados</option>
                    <option value="En Trámite">En Trámite</option>
                    <option value="Sentencia">Sentencia</option>
                    <option value="Archivado">Archivado</option>
                </select>
            </div>
            <button
                class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download class="w-4 h-4" />
                <span>Exportar Lista</span>
            </button>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">No. Proceso
                        </th>
                        <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Demandante
                        </th>
                        <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Juzgado</th>
                        <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actitud Proc.
                        </th>
                        <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Act.
                        </th>
                        <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                            Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr v-for="juicio in juicios" :key="juicio.id"
                        class="hover:bg-gray-50 transition-colors cursor-pointer" @click="goToDetail(juicio.id)">
                        <td class="px-6 py-4 text-sm font-medium text-blue-600">{{ juicio.numero_proceso }}</td>
                        <td class="px-6 py-4 text-sm text-gray-700">{{ juicio.demandante_nombre || juicio.demandante_id
                            }}</td>
                        <td class="px-6 py-4 text-sm text-gray-500">{{ juicio.organo_jurisdiccional }}</td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                :class="getStatusColor(juicio.estado_procesal)">
                                {{ juicio.estado_procesal }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">{{ juicio.actitud_procesal }}</td>
                        <td class="px-6 py-4 text-sm text-gray-500">{{ formatDate(juicio.fecha_actualizacion) }}</td>
                        <td class="px-6 py-4 text-right">
                            <button class="text-gray-400 hover:text-blue-600">
                                <MoreHorizontal class="w-5 h-5" />
                            </button>
                        </td>
                    </tr>
                    <tr v-if="juicios.length === 0">
                        <td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500">
                            No se encontraron registros.
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Pagination -->
            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span class="text-sm text-gray-500">
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
import { Activity, Clock, CheckCircle, DollarSign, Search, Download, MoreHorizontal } from 'lucide-vue-next';
import juridicaService from '../services/juridica.service';

const router = useRouter();

// State
const juicios = ref([]);
const meta = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
const loading = ref(false);
const filters = ref({
    search: '',
    estado: ''
});

// Methods
const loadData = async () => {
    loading.value = true;
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
    return new Date(dateString).toLocaleDateString('es-GT');
};

const getStatusColor = (status) => {
    switch (status) {
        case 'En Trámite': return 'bg-yellow-100 text-yellow-800';
        case 'Sentencia': return 'bg-red-100 text-red-800'; // Asumiendo rojo para sentencia por ahora, o gris
        case 'Favorable': return 'bg-green-100 text-green-800';
        case 'Archivado': return 'bg-gray-100 text-gray-800';
        default: return 'bg-blue-100 text-blue-800';
    }
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
});
</script>
