<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Dashboard de Reportes</h1>
        </div>

        <div v-if="isLoading" class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        </div>
        <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-else-if="reportData" class="container-fluid px-0">
            <div class="row">
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h6 class="card-subtitle mb-2 text-muted">Monto Total Planificado</h6>
                            <p class="card-text fs-2 fw-bold text-primary">{{
                                formatCurrency(reportData.kpis.monto_planificado) }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h6 class="card-subtitle mb-2 text-muted">Solicitudes Vigentes</h6>
                            <p class="card-text fs-2 fw-bold text-primary">{{ reportData.kpis.solicitudes_vigentes }}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h6 class="card-subtitle mb-2 text-muted">Ejecución Presupuestaria</h6>
                            <p class="card-text fs-2 fw-bold text-primary">{{ reportData.kpis.ejecucion }}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-lg-7 mb-4">
                    <div class="card h-100">
                        <div class="card-header fw-bold">Monto por Renglón (Planificado vs. Pagado)</div>
                        <div class="card-body">
                            <Bar v-if="barChartData.labels.length" :data="barChartData" :options="barChartOptions" />
                        </div>
                    </div>
                </div>
                <div class="col-lg-5 mb-4">
                    <div class="card h-100">
                        <div class="card-header fw-bold">Distribución por Estado</div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <Doughnut v-if="doughnutChartData.labels.length" :data="doughnutChartData"
                                :options="doughnutChartOptions" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/services/api.service';
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const isLoading = ref(true);
const error = ref<string | null>(null);
const reportData = ref<any>(null);

const fetchReportData = async () => {
    isLoading.value = true;
    error.value = null;
    try {
        const response = await apiClient.get('/reports/dashboard');
        reportData.value = response.data;
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Error al cargar el reporte.';
    } finally {
        isLoading.value = false;
    }
};

const barChartData = computed(() => {
    if (!reportData.value?.monto_por_renglon) return { labels: [], datasets: [] };
    const labels = reportData.value.monto_por_renglon.map((item: any) => item.renglon_nombre);
    return {
        labels,
        datasets: [
            {
                label: 'Planificado',
                backgroundColor: '#6c757d', // Gris
                data: reportData.value.monto_por_renglon.map((item: any) => parseFloat(item.planificado)),
            },
            {
                label: 'Pagado',
                backgroundColor: '#0d6efd', // Azul Bootstrap
                data: reportData.value.monto_por_renglon.map((item: any) => parseFloat(item.pagado)),
            },
        ],
    };
});

const doughnutChartData = computed(() => {
    if (!reportData.value?.distribucion_por_estado) return { labels: [], datasets: [] };
    const labels = reportData.value.distribucion_por_estado.map((item: any) => item.nombre);
    const data = reportData.value.distribucion_por_estado.map((item: any) => item.cantidad);
    // Mapeamos los nombres de color de Bootstrap a los colores que ya definimos
    const bgColors = reportData.value.distribucion_por_estado.map((item: any) => {
        const colorMap: { [key: string]: string } = {
            success: '#198754', info: '#0dcaf0', dark: '#212529',
            danger: '#dc3545', warning: '#ffc107', primary: '#0d6efd'
        };
        return colorMap[item.color] || '#6c757d'; // gris por defecto
    });

    return {
        labels,
        datasets: [{ backgroundColor: bgColors, data }],
    };
});

const barChartOptions = { responsive: true, maintainAspectRatio: false };
const doughnutChartOptions = { responsive: true, maintainAspectRatio: false };

const formatCurrency = (value: number | string) => {
    const numberValue = Number(value);
    if (isNaN(numberValue)) return value;
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(numberValue);
};

onMounted(() => {
    fetchReportData();
});
</script>