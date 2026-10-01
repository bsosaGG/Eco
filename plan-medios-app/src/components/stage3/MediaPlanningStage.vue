<template>
  <div>
    <p class="stage-intro">
      <strong>Etapa 3 — Planificación de medios.</strong>
      Compare las recomendaciones del Brief con las sugerencias del catálogo, revise los campos 6.1–6.7 y confirme la
      selección humana final para cada perfil.
    </p>

    <h3 class="section-heading">6. Selección de medios</h3>
    <p class="help">Agregue un bloque independiente por cada medio seleccionado para la campaña.</p>

    <div v-if="store.meta.recommendations.length" class="recommendations-panel">
      <h4>Recomendaciones extraídas del Brief</h4>
      <p class="help">
        Estas propuestas provienen de la Sección 7 del Brief. Puede revisar el detalle y llevar una recomendación al
        plan para validarla o editarla antes de aprobarla.
      </p>
      <div class="recommendation-list">
        <RecommendationCard v-for="(recommendation, index) in store.meta.recommendations" :key="index"
          :recommendation="recommendation" :index="index" />
      </div>
    </div>

    <MediaEntryCard v-for="(entry, index) in store.mediaEntries" :key="entry.uid" :entry="entry"
      :number="index + 1" />

    <button type="button" class="add-media-button" @click="store.addEntry()">+ Agregar otro medio</button>
  </div>
</template>

<script setup>
import MediaEntryCard from './MediaEntryCard.vue';
import RecommendationCard from './RecommendationCard.vue';
import { useExpedienteStore } from '../../stores/expediente.store';

const store = useExpedienteStore();
</script>
