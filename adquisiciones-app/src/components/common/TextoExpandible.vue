<template>
  <div>
    <p class="text-gray-700 text-sm whitespace-pre-line" :class="abierto ? '' : 'line-clamp-3'">{{ texto }}</p>
    <button v-if="esLargo" type="button" @click="abierto = !abierto" class="text-xs text-accent hover:underline mt-1">
      {{ abierto ? 'ver menos' : 'ver más' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Texto largo recortado a tres líneas, con "ver más" para leerlo completo.
const props = defineProps({
  texto: { type: String, default: '' },
});

const abierto = ref(false);
const esLargo = computed(() => props.texto.length > 200 || (props.texto.match(/\n/g) || []).length >= 3);
</script>
