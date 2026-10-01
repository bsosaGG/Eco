<template>
  <nav class="stage-nav" aria-label="Etapas del plan de medios">
    <button v-for="s in STAGES" :key="s.number" type="button" class="stage-nav-button"
      :class="{ 'is-current': s.number === current, 'is-complete': s.number < current }"
      :aria-current="s.number === current ? 'step' : undefined" @click="$emit('go', s.number)">
      <span class="stage-nav-number">Etapa {{ s.number }}</span>
      {{ s.title }}
    </button>
  </nav>
</template>

<script setup>
import { STAGES } from '../../utils/constants';

defineProps({ current: { type: Number, required: true } });
defineEmits(['go']);
</script>
