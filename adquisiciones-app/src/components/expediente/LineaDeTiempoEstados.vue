<template>
  <div>
    <div v-if="filas.length === 0" class="text-sm text-gray-400 italic">Todavía no hay historial de estados.</div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tiempo en cada estado</h4>
        <div class="text-sm text-gray-500">
          Total del trámite: <span class="font-semibold text-gray-800">{{ formatDuracion(totalMs) }}</span>
        </div>
      </div>

      <!-- Estado actual, en grande -->
      <div class="rounded-lg border p-4 mb-4 flex flex-wrap items-center justify-between gap-3" :class="CLASES_NIVEL[nivelActual]">
        <div>
          <p class="text-xs uppercase tracking-wide opacity-70">{{ actual.final ? 'Estado final' : 'Estado actual' }}</p>
          <p class="text-lg font-semibold">{{ actual.estado }}</p>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold leading-tight" :class="nivelActual === 'alerta' ? 'animate-pulse' : ''">
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

      <!-- Historial: cada estado, del más reciente al más antiguo, con lo que pasó mientras estuvo en él -->
      <ol class="mt-5 text-sm">
        <li v-for="fila in filasRecientesPrimero" :key="fila.clave" class="py-3 border-t border-gray-100 first:border-t-0">
          <div class="flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="barColor(fila.color)"></span>
            <span class="flex-1 min-w-0">
              <span class="text-gray-800" :class="fila.actual ? 'font-semibold' : 'font-medium'">{{ fila.estado }}</span>
              <span v-if="fila.actual" class="ml-2 text-[11px] uppercase tracking-wide text-accent">actual</span>
              <span class="block text-xs text-gray-400">
                {{ formatFechaHora(fila.fecha_entrada) }}<template v-if="fila.fecha_salida"> → {{ formatFechaHora(fila.fecha_salida) }}</template>
              </span>
            </span>
            <span class="font-medium text-gray-700 whitespace-nowrap">{{ formatDuracion(fila.ms) }}</span>
          </div>

          <ul v-if="fila.eventos.length" class="mt-2 ml-5 pl-3 border-l border-gray-200 space-y-2">
            <li v-for="evento in fila.eventos" :key="evento.id_bitacora">
              <p class="text-gray-700">{{ evento.accion }}</p>
              <p v-if="evento.observacion" class="text-xs text-gray-500">{{ evento.observacion }}</p>
              <p class="text-xs text-gray-400">{{ evento.usuario_nombre }} &middot; {{ formatFechaHora(evento.fecha_hora) }}</p>
            </li>
          </ul>
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

// Historial del expediente: cuánto estuvo en cada estado (barra y duraciones) y, dentro de cada estado,
// las acciones de la bitácora que ocurrieron mientras estuvo en él. La hora del servidor mide el estado
// vigente para no depender del reloj de quien mira.
const props = defineProps({
  historial: { type: Array, default: () => [] },
  ahora: { type: String, default: '' },
  bitacora: { type: Array, default: () => [] }, // más reciente primero (como la entrega el API)
});

const hora = (valor) => new Date(valor).getTime();

const filas = computed(() => {
  const base = props.historial.map((entrada, i) => ({
    ...entrada,
    clave: `${entrada.id_estado}-${i}`,
    ms: duracionMs(entrada.fecha_entrada, entrada.fecha_salida || props.ahora) ?? 0,
    // Las acciones de la bitácora que caen entre la entrada a este estado y la entrada al siguiente.
    // Lo anterior al primer estado registrado (expedientes migrados) se cuenta en el primero.
    eventos: props.bitacora.filter((evento) => {
      const t = hora(evento.fecha_hora);
      const desde = i === 0 ? -Infinity : hora(entrada.fecha_entrada);
      const hasta = entrada.fecha_salida ? hora(entrada.fecha_salida) : Infinity;
      return t >= desde && t < hasta;
    }),
  }));
  const total = base.reduce((suma, fila) => suma + fila.ms, 0);
  return base.map((fila) => ({ ...fila, porcentaje: total > 0 ? (fila.ms / total) * 100 : 100 / base.length }));
});

const filasRecientesPrimero = computed(() => [...filas.value].reverse());

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
</script>
