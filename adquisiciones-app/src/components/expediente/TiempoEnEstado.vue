<template>
  <span v-if="ms !== null"
    class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap"
    :class="[clases, nivel === 'alerta' && !final ? 'animate-pulse' : '', grande ? 'text-sm px-3 py-1' : '']"
    :title="titulo">
    <Clock :class="grande ? 'w-4 h-4' : 'w-3 h-3'" />
    {{ texto }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { Clock } from 'lucide-vue-next';
import { duracionMs, formatDuracion, nivelDeEspera, CLASES_NIVEL } from '../../utils/tiempos';

// Cuánto lleva un expediente en su estado actual. Cambia de color con la espera (verde, ámbar y rojo
// que parpadea). En un expediente cerrado muestra cuánto duró todo el trámite, sin alertas.
const props = defineProps({
  desde: { type: String, default: '' }, // cuándo entró al estado actual
  ahora: { type: String, default: '' }, // hora del servidor
  final: { type: Boolean, default: false }, // el estado es final (pagado, cancelado)
  inicio: { type: String, default: '' }, // cuándo se creó (para el total de un expediente cerrado)
  grande: { type: Boolean, default: false },
});

const ms = computed(() => (props.final ? duracionMs(props.inicio, props.desde) : duracionMs(props.desde, props.ahora)));
const nivel = computed(() => (props.final ? 'normal' : nivelDeEspera(ms.value)));
const clases = computed(() => (props.final ? 'bg-gray-50 text-gray-600 border-gray-200' : CLASES_NIVEL[nivel.value]));
const texto = computed(() => (props.final ? `Duró ${formatDuracion(ms.value)}` : `${formatDuracion(ms.value)} en este estado`));
const titulo = computed(() =>
  props.final ? 'Tiempo total del trámite' : 'Tiempo que lleva el expediente en su estado actual'
);
</script>
