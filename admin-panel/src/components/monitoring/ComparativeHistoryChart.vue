<template>
    <Line :data="chartData" :options="chartOptions" />
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    TimeScale, // Importamos la escala de TIEMPO
    type ChartData,
    type ChartOptions
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Importamos el adaptador de fechas
import type { PropType } from 'vue';

// Registramos los componentes, incluyendo TimeScale
ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    TimeScale
);

defineProps({
    chartData: {
        type: Object as PropType<ChartData<'line'>>,
        required: true
    },
    chartOptions: {
        type: Object as PropType<ChartOptions<'line'>>,
        // Opciones por defecto para una gráfica de TIEMPO
        default: () => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            scales: {
                x: {
                    type: 'time', // Le decimos que el eje X es de TIEMPO
                    time: {
                        tooltipFormat: 'MMM d, yyyy, HH:mm', // Formato para el tooltip al pasar el mouse
                        unit: 'day', // Unidad base para mostrar las etiquetas
                    },
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor'
                    }
                }
            }
        })
    }
});
</script>