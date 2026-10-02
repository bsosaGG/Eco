<template>
  <article class="recommendation-card">
    <div class="recommendation-card-header">
      <div>
        <h5 class="recommendation-card-title">{{ recommendation.profile || 'Recomendación de medio' }}</h5>
        <span class="recommendation-category">{{ recommendation.category || 'Sin categoría' }}</span>
      </div>

      <button type="button" class="use-recommendation-button" :disabled="alreadyApplied" @click="apply">
        {{ alreadyApplied ? 'Datos del Brief aplicados' : 'Usar datos extraídos del Brief' }}
      </button>
    </div>

    <p v-if="appliedMessage" class="recommendation-apply-message" role="status" aria-live="polite">
      ✓ Información agregada correctamente al formulario.
    </p>

    <details class="recommendation-details">
      <summary>Ver información en el Brief</summary>
      <dl>
        <template v-for="(name, fieldId) in MEDIA_FIELD_NAMES" :key="fieldId">
          <dt>{{ fieldId }} {{ name }}</dt>
          <dd>{{ recommendation.fields?.[fieldId]?.value || 'No encontrado en esta recomendación del Brief.' }}</dd>
        </template>
      </dl>
    </details>

    <div class="media-ranking">
      <h6 class="media-ranking-title">Medios sugeridos por la base de datos</h6>
      <p class="media-ranking-status">{{ statusText }}</p>
      <div class="media-candidate-list">
        <CandidateCard v-for="(candidate, i) in candidates" :key="candidate.media_id" :candidate="candidate"
          :position="i + 1" :selected="selectedId !== null && selectedId === candidate.media_id"
          @select="store.selectCandidate(recommendation, candidate, i + 1)" />
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import CandidateCard from './CandidateCard.vue';
import { useExpedienteStore } from '../../stores/expediente.store';
import { MEDIA_FIELD_NAMES } from '../../utils/constants';

const props = defineProps({
  recommendation: { type: Object, required: true },
  index: { type: Number, required: true },
});

const store = useExpedienteStore();
const appliedMessage = ref(false);
let hideTimer = null;

const alreadyApplied = computed(() => store.profileAlreadySelected(props.recommendation));
const selectedId = computed(() => store.selectedCatalogIdFor(props.recommendation));
const ranking = computed(() => store.rankings[props.index]);
const candidates = computed(() =>
  ranking.value && ranking.value.status === 'completed' && Array.isArray(ranking.value.items) ? ranking.value.items : []
);

const statusText = computed(() => {
  if (store.rankingState === 'loading' || store.rankingState === 'idle') return 'Calculando compatibilidad…';
  if (store.rankingState === 'error') return 'No fue posible consultar el catálogo de medios en este momento.';
  if (store.catalogEmpty) {
    return 'El catálogo de medios está vacío, por eso no hay sugerencias. Pida al administrador del sistema que lo cargue (comando import-catalog).';
  }
  if (!candidates.value.length) return 'No hay candidatos comparables disponibles en el catálogo para este perfil.';
  return 'Ranking orientativo y explicable. La selección final corresponde al equipo humano.';
});

function apply() {
  if (!store.useRecommendation(props.recommendation)) return;
  appliedMessage.value = true;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => (appliedMessage.value = false), 4500);
}

onBeforeUnmount(() => clearTimeout(hideTimer));
</script>
