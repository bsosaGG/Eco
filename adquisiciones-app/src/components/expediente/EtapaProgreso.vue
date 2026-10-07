<template>
  <div v-if="indice >= 0" class="flex items-center gap-2" :title="`Etapa: ${etiqueta}`">
    <div class="flex gap-0.5">
      <span v-for="(e, i) in ETAPAS" :key="e" class="h-1.5 w-4 rounded-full"
        :class="i <= indice ? 'bg-accent' : 'bg-gray-200'"></span>
    </div>
    <span class="text-[11px] text-gray-500 whitespace-nowrap">{{ etiqueta }}</span>
  </div>
  <span v-else-if="etiqueta" class="text-[11px] text-gray-500">{{ etiqueta }}</span>
</template>

<script setup>
import { computed } from 'vue';
import { ETAPAS, etapaLabel } from '../../utils/estados';

// Dónde va un expediente: una barra con las etapas del proceso (hasta la actual) y su nombre.
const props = defineProps({
  etapa: { type: String, default: '' },
});

const indice = computed(() => ETAPAS.indexOf(props.etapa));
const etiqueta = computed(() => etapaLabel(props.etapa));
</script>
