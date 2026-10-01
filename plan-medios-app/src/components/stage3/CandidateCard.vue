<template>
  <article class="media-candidate">
    <div class="media-candidate-head">
      <div>
        <h6 class="media-candidate-name">{{ position }}. {{ candidate.media_name }}</h6>
        <p class="media-candidate-meta">
          Compatibilidad: {{ compatibilityLabel(candidate.compatibility) }} · Puntaje: {{ candidate.score }}/100 ·
          Confianza de datos: {{ candidate.data_confidence }}%
        </p>
      </div>
      <button type="button" class="select-candidate-button" :disabled="selected" @click="$emit('select')">
        {{ selected ? 'Medio seleccionado' : 'Seleccionar este medio' }}
      </button>
    </div>

    <p v-if="criticalReasons" class="media-candidate-warning">Advertencia: {{ criticalReasons }}</p>

    <details class="media-candidate-details">
      <summary>Ver por qué se recomienda</summary>
      <ul>
        <li v-for="c in candidate.criteria" :key="c.key">
          {{ c.name }}: {{ c.score }}/{{ c.maximum }}. {{ c.explanation }}
        </li>
      </ul>
    </details>

    <p v-if="selected" class="media-candidate-selected-message">✓ Este medio ya fue seleccionado para este perfil.</p>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { compatibilityLabel } from '../../utils/justification';

const props = defineProps({
  candidate: { type: Object, required: true },
  position: { type: Number, required: true },
  selected: { type: Boolean, default: false },
});
defineEmits(['select']);

// Las advertencias críticas llegan como { key, reason }; se muestran los motivos.
const criticalReasons = computed(() =>
  (props.candidate.critical_failures || []).map((f) => (f && f.reason) || String(f)).join(' ')
);
</script>
