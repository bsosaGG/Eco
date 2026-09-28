<template>
  <div>
    <div v-if="loading" class="text-center text-gray-400 py-12">Cargando resumen...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

    <div v-else class="space-y-6">
      <!-- KPIs de conteo -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-400 uppercase tracking-wide">Expedientes totales</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ conteos.total_expedientes ?? 0 }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ conteos.expedientes_activos ?? 0 }} activos</p>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-400 uppercase tracking-wide">Cotizaciones</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ conteos.total_cotizaciones ?? 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-400 uppercase tracking-wide">CDP / Órdenes de Compra</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ conteos.total_cdp ?? 0 }} / {{ conteos.total_ordenes_compra ?? 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-400 uppercase tracking-wide">Devoluciones pendientes</p>
          <p class="text-2xl font-bold" :class="conteos.devoluciones_pendientes > 0 ? 'text-red-600' : 'text-gray-800'">
            {{ conteos.devoluciones_pendientes ?? 0 }}
          </p>
        </div>
      </div>

      <!-- Montos del ciclo presupuestario -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Montos del proceso</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div v-for="item in montoItems" :key="item.label">
            <p class="text-xs text-gray-400">{{ item.label }}</p>
            <p class="text-lg font-semibold" :class="item.color">{{ formatMonto(item.valor) }}</p>
          </div>
        </div>
      </div>

      <!-- Expedientes por estado -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Expedientes por estado</h4>
        <div class="space-y-3">
          <div v-for="e in porEstado" :key="e.id_estado" class="flex items-center gap-3">
            <span class="w-40 shrink-0 text-sm text-gray-700 truncate">{{ e.estado }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div class="h-3 rounded-full" :class="barColor(e.color)"
                :style="{ width: maxCantidad ? `${(e.cantidad / maxCantidad) * 100}%` : '0%' }"></div>
            </div>
            <span class="w-8 text-right text-sm font-medium text-gray-800">{{ e.cantidad }}</span>
          </div>
          <p v-if="porEstado.length === 0" class="text-sm text-gray-400 italic">Sin datos todavía.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adquisicionesService from '../services/adquisiciones.service';

const loading = ref(true);
const error = ref('');
const porEstado = ref([]);
const montos = ref({});
const conteos = ref({});

const maxCantidad = computed(() => Math.max(0, ...porEstado.value.map((e) => Number(e.cantidad) || 0)));

const montoItems = computed(() => [
  { label: 'Monto estimado (todos los expedientes)', valor: montos.value.monto_estimado_total, color: 'text-gray-800' },
  { label: 'Reservado en CDP', valor: montos.value.monto_reservado_cdp, color: 'text-blue-700' },
  { label: 'Comprometido', valor: montos.value.monto_comprometido, color: 'text-amber-700' },
  { label: 'Devengado', valor: montos.value.monto_devengado, color: 'text-purple-700' },
  { label: 'Pagado', valor: montos.value.monto_pagado, color: 'text-green-700' },
]);

const colorMap = {
  secondary: 'bg-gray-400',
  primary: 'bg-blue-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
  success: 'bg-green-500',
  danger: 'bg-red-500',
  dark: 'bg-slate-500',
};
const barColor = (color) => colorMap[color] || colorMap.secondary;
const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const resumen = await adquisicionesService.getReporteResumen();
    porEstado.value = resumen.por_estado || [];
    montos.value = resumen.montos || {};
    conteos.value = resumen.conteos || {};
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar el resumen general.';
  } finally {
    loading.value = false;
  }
});
</script>
