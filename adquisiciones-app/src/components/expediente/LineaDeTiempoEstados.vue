<template>
  <div class="bg-white rounded-lg shadow-sm border p-6" :class="alerta ? 'border-red-300' : 'border-gray-200'">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tiempo en cada estado</h4>
      <div class="text-sm text-gray-500">
        Total del trámite: <span class="font-semibold text-gray-800">{{ formatDuracion(totalMs) }}</span>
      </div>
    </div>

    <div v-if="filas.length === 0" class="text-sm text-gray-400 italic">Todavía no hay historial de estados.</div>

    <template v-else>
      <!-- Estado actual, en grande -->
      <div class="rounded-lg border p-4 mb-4 flex flex-wrap items-center justify-between gap-3" :class="CLASES_NIVEL[nivelActual]">
        <div>
          <p class="text-xs uppercase tracking-wide opacity-70">{{ actual.final ? 'Estado final' : 'Estado actual' }}</p>
          <p class="text-lg font-semibold">{{ actual.estado }}</p>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold leading-tight" :class="alerta && !actual.final ? 'animate-pulse' : ''">
            {{ formatDuracion(actual.ms) }}
          </p>
          <p class="text-xs opacity-70">{{ actual.final ? 'desde que se cerró' : 'en este estado' }}</p>
        </div>
      </div>

      <!-- Barra proporcional al tiempo de cada estado -->
      <div class="flex h-4 w-full overflow-hidden rounded-full bg-gray-100" role="img" aria-label="Distribución del tiempo por estado">
        <div v-for="fila in filas" :key="fila.clave"
          class="h-full border-r border-white last:border-r-0"
          :class="barColor(fila.color)"
          :style="{ width: fila.porcentaje + '%', minWidth: '6px' }"
          :title="`${fila.estado}: ${formatDuracion(fila.ms)}`"></div>
      </div>

      <!-- Detalle por estado -->
      <ol class="mt-4 divide-y divide-gray-100 text-sm">
        <li v-for="fila in filas" :key="fila.clave" class="py-2 flex items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="barColor(fila.color)"></span>
          <span class="flex-1 min-w-0">
            <span class="text-gray-800" :class="fila.actual ? 'font-semibold' : ''">{{ fila.estado }}</span>
            <span v-if="fila.actual" class="ml-2 text-[11px] uppercase tracking-wide text-accent">actual</span>
            <span class="block text-xs text-gray-400">
              {{ formatFechaHora(fila.fecha_entrada) }}<template v-if="fila.fecha_salida"> → {{ formatFechaHora(fila.fecha_salida) }}</template>
            </span>
          </span>
          <span class="font-medium text-gray-700 whitespace-nowrap">{{ formatDuracion(fila.ms) }}</span>
        </li>
      </ol>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { duracionMs, formatDuracion, nivelDeEspera, CLASES_NIVEL } from '../../utils/tiempos';
import { barColor } from '../../utils/estados';
import { formatFechaHora } from '../../utils/format';

// Cuánto estuvo el expediente en cada estado (el historial viene del API, ver historial_estados), con
// el estado actual destacado y una barra proporcional. La hora del servidor mide el estado vigente
// para no depender del reloj de quien mira.
const props = defineProps({
  historial: { type: Array, default: () => [] },
  ahora: { type: String, default: '' },
});

const filas = computed(() => {
  const base = props.historial.map((entrada, i) => ({
    ...entrada,
    clave: `${entrada.id_estado}-${i}`,
    ms: duracionMs(entrada.fecha_entrada, entrada.fecha_salida || props.ahora) ?? 0,
  }));
  const total = base.reduce((suma, fila) => suma + fila.ms, 0);
  return base.map((fila) => ({ ...fila, porcentaje: total > 0 ? (fila.ms / total) * 100 : 100 / base.length }));
});

const actual = computed(() => {
  const fila = filas.value[filas.value.length - 1];
  return { ...fila, final: !!fila?.es_final };
});
const totalMs = computed(() => {
  if (!filas.value.length) return null;
  // En un expediente cerrado el total llega hasta que se cerró, no hasta hoy.
  const hasta = actual.value.final ? actual.value.fecha_entrada : props.ahora;
  return duracionMs(filas.value[0].fecha_entrada, hasta);
});
const nivelActual = computed(() => (actual.value.final ? 'normal' : nivelDeEspera(actual.value.ms)));
const alerta = computed(() => nivelActual.value === 'alerta');
</script>
