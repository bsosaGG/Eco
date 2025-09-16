<template>
    <div class="container-fluid mt-4">
        <h1>Análisis Comparativo de Monitoreo</h1>
        <p class="text-muted">
            Selecciona los servidores y sitios que deseas comparar en las gráficas.
        </p>
        <hr />

        <div class="row g-4">
            <div class="col-12 col-lg-3">
                <div class="card">
                    <div class="card-header">
                        <strong><i class="bi bi-ui-checks-grid me-2"></i>Controles</strong>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title mb-2">Rango de Tiempo</h5>
                        <div class="btn-group w-100 mb-3" role="group">
                            <button type="button" class="btn btn-sm"
                                :class="selectedRange === '24h' ? 'btn-primary' : 'btn-outline-primary'"
                                @click="changeRange('24h')">24 Horas</button>
                            <button type="button" class="btn btn-sm"
                                :class="selectedRange === '7d' ? 'btn-primary' : 'btn-outline-primary'"
                                @click="changeRange('7d')">7 Días</button>
                            <button type="button" class="btn btn-sm"
                                :class="selectedRange === '30d' ? 'btn-primary' : 'btn-outline-primary'"
                                @click="changeRange('30d')">1 Mes</button>
                        </div>
                        <hr>

                        <h5 class="card-title mb-2">Métricas a Mostrar</h5>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="cpu" v-model="selectedMetrics"
                                id="metric-cpu">
                            <label class="form-check-label" for="metric-cpu">CPU (%)</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="ram" v-model="selectedMetrics"
                                id="metric-ram">
                            <label class="form-check-label" for="metric-ram">RAM (%)</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="disk" v-model="selectedMetrics"
                                id="metric-disk">
                            <label class="form-check-label" for="metric-disk">Disco (%)</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="response" v-model="selectedMetrics"
                                id="metric-response">
                            <label class="form-check-label" for="metric-response">Tiempo Respuesta (ms)</label>
                        </div>
                        <hr>

                        <div v-if="monitoringStore.isLoading" class="text-center">
                            <div class="spinner-border spinner-border-sm" role="status"><span
                                    class="visually-hidden">Cargando...</span></div>
                        </div>
                        <div v-else>
                            <h5>Servidores</h5>
                            <div v-for="server in monitoringStore.servers" :key="server.id_servidor" class="form-check">
                                <input class="form-check-input" type="checkbox" :value="server.id_servidor"
                                    v-model="selectedServerIds" :id="'server-' + server.id_servidor">
                                <label class="form-check-label" :for="'server-' + server.id_servidor">{{ server.nombre
                                }}</label>
                            </div>
                            <hr class="my-3">
                            <h5>Sitios Web</h5>
                            <div v-for="site in monitoringStore.sites" :key="site.id_sitio_web" class="form-check">
                                <input class="form-check-input" type="checkbox" :value="site.id_sitio_web"
                                    v-model="selectedSiteIds" :id="'site-' + site.id_sitio_web">
                                <label class="form-check-label" :for="'site-' + site.id_sitio_web">{{ site.nombre
                                }}</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-lg-9">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Gráfica de Rendimiento (Últimas {{ rangeText }})</h5>
                        <div v-if="isChartLoading" class="text-center my-5">
                            <div class="spinner-border" role="status"><span class="visually-hidden">Cargando
                                    datos...</span></div>
                            <p class="mt-2">Cargando datos de la gráfica...</p>
                        </div>
                        <div v-else-if="chartData.datasets.length === 0" class="text-center my-5 text-muted">
                            <i class="bi bi-graph-up" style="font-size: 3rem;"></i>
                            <p class="mt-2">Selecciona un ítem y una métrica para empezar.</p>
                        </div>
                        <div v-else style="height: 500px;">
                            <ComparativeHistoryChart :chart-data="chartData" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useMonitoringStore } from '@/stores/monitoring.store';
import ComparativeHistoryChart from '@/components/monitoring/ComparativeHistoryChart.vue';
import type { ChartData } from 'chart.js';

const monitoringStore = useMonitoringStore();

// --- ESTADO LOCAL DEL COMPONENTE ---
const selectedServerIds = ref<number[]>([]);
const selectedSiteIds = ref<number[]>([]);
const selectedRange = ref('24h');
const isChartLoading = ref(false);
const selectedMetrics = ref(['cpu', 'ram', 'disk', 'response']);

const chartData = ref<ChartData<'line'>>({ datasets: [] });
const historyCache = new Map<string, any[]>();

// --- NUEVO: Paleta de colores predefinida y un índice para recorrerla ---
const COLOR_PALETTE = [
    'rgba(54, 162, 235, 1)',  // Blue
    'rgba(255, 99, 132, 1)',   // Red
    'rgba(75, 192, 192, 1)',   // Green
    'rgba(255, 159, 64, 1)',  // Orange
    'rgba(153, 102, 255, 1)', // Purple
    'rgba(255, 206, 86, 1)',  // Yellow
    'rgba(231, 76, 60, 1)',    // Alizarin Red
    'rgba(46, 204, 113, 1)',   // Emerald Green
    'rgba(41, 128, 185, 1)',   // Peter River Blue
    'rgba(241, 196, 15, 1)',   // Sun Flower Yellow
    'rgba(142, 68, 173, 1)',   // Amethyst Purple
    'rgba(52, 73, 94, 1)',     // Wet Asphalt Grey
];
let colorIndex = 0;

// --- LÓGICA DE CARGA DE DATOS ---
onMounted(() => {
    if (monitoringStore.servers.length === 0 || monitoringStore.sites.length === 0) {
        monitoringStore.fetchDashboardData();
    }
});

watch([selectedServerIds, selectedSiteIds, selectedMetrics], () => updateChartData(), { deep: true });

const rangeText = computed(() => {
    if (selectedRange.value === '24h') return '24 horas';
    if (selectedRange.value === '7d') return '7 días';
    if (selectedRange.value === '30d') return '30 días';
    return '';
});

const changeRange = (range: string) => {
    selectedRange.value = range;
    historyCache.clear();
    updateChartData();
};

const updateChartData = async () => {
    isChartLoading.value = true;
    const newDatasets = [];
    colorIndex = 0; // Reiniciamos el índice de color en cada actualización

    for (const id of selectedServerIds.value) {
        const server = monitoringStore.servers.find(s => s.id_servidor === id);
        if (!server) continue;
        const cacheKey = `server-${id}-${selectedRange.value}`;
        let history = historyCache.get(cacheKey) as any[];
        if (!history) {
            history = await monitoringStore.fetchServerHistory(id, selectedRange.value);
            historyCache.set(cacheKey, history);
        }

        const commonOptions = { tension: 0.4, pointRadius: 0 };
        const getNextColor = () => COLOR_PALETTE[colorIndex++ % COLOR_PALETTE.length];

        if (selectedMetrics.value.includes('cpu')) {
            newDatasets.push({ label: `${server.nombre} - CPU (%)`, data: history.map(p => ({ x: new Date(p.fecha_verificacion).getTime(), y: p.cpu_usage_percent })), borderColor: getNextColor(), ...commonOptions });
        }
        if (selectedMetrics.value.includes('ram')) {
            newDatasets.push({ label: `${server.nombre} - RAM (%)`, data: history.map(p => ({ x: new Date(p.fecha_verificacion).getTime(), y: p.ram_usage_percent })), borderColor: getNextColor(), ...commonOptions });
        }
        if (selectedMetrics.value.includes('disk')) {
            newDatasets.push({ label: `${server.nombre} - Disco (%)`, data: history.map(p => ({ x: new Date(p.fecha_verificacion).getTime(), y: p.disk_usage_percent })), borderColor: getNextColor(), ...commonOptions });
        }
    }

    for (const id of selectedSiteIds.value) {
        const site = monitoringStore.sites.find(s => s.id_sitio_web === id);
        if (!site) continue;
        const cacheKey = `site-${id}-${selectedRange.value}`;
        let history = historyCache.get(cacheKey) as any[];
        if (!history) {
            history = await monitoringStore.fetchSiteHistory(id, selectedRange.value);
            historyCache.set(cacheKey, history);
        }

        if (selectedMetrics.value.includes('response')) {
            newDatasets.push({ label: `${site.nombre} - Respuesta (ms)`, data: history.map(p => ({ x: new Date(p.fecha_verificacion).getTime(), y: p.tiempo_respuesta_ms })), borderColor: COLOR_PALETTE[colorIndex++ % COLOR_PALETTE.length], tension: 0.4, pointRadius: 0 });
        }
    }

    chartData.value = { datasets: newDatasets };
    isChartLoading.value = false;
};
</script>