<template>
  <div class="media-entry">
    <div class="media-entry-header">
      <h4 class="media-entry-title">Medio {{ number }}</h4>
      <button type="button" class="remove-media-button" @click="store.removeEntry(entry.uid)">Eliminar medio</button>
    </div>

    <p class="media-origin">{{ originLabel(entry) }}</p>

    <p v-if="entry.catalogMediaName" class="selected-catalog-medium">
      Medio de catálogo seleccionado: <strong>{{ entry.catalogMediaName }}</strong>
      <template v-if="entry.scoringScore !== null"> — puntaje orientativo {{ entry.scoringScore }}/100</template>
      <template v-if="entry.scoringCompatibility">; compatibilidad {{ compatibilityLabel(entry.scoringCompatibility) }}</template>.
    </p>

    <div class="summary-field">
      <label :for="`${entry.uid}_name`">Perfil / medio seleccionado</label>
      <input :id="`${entry.uid}_name`" v-model="entry.medium" type="text" class="media-name"
        :class="{ 'catalog-selected': entry.catalogMediaId }"
        placeholder="Ej. Radio regional, televisión abierta..." />
    </div>

    <div class="summary-field selection-justification-field">
      <label :for="`${entry.uid}_justification`">Justificación de selección</label>
      <p class="selection-justification-help">{{ justificationHelp(entry) }}</p>
      <textarea :id="`${entry.uid}_justification`" v-model="entry.selectionJustification"
        class="selection-justification" rows="5" :aria-required="String(mandatory)"
        :aria-invalid="String(missing)" :aria-describedby="`${entry.uid}_justification_error`"></textarea>
      <p v-show="missing" :id="`${entry.uid}_justification_error`" class="selection-justification-error"
        role="alert">{{ JUSTIFICATION_ERROR }}</p>
    </div>

    <ReviewedField v-for="(name, fieldId) in MEDIA_FIELD_NAMES" :key="fieldId"
      v-model="entry.fields[fieldId].value" v-model:ignoredKeys="entry.fields[fieldId].ignoredKeys"
      :input-id="`${entry.uid}_field_${fieldId.replace('.', '_')}`" :field-id="fieldId" :label="name" multiline />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ReviewedField from '../common/ReviewedField.vue';
import { useExpedienteStore } from '../../stores/expediente.store';
import { MEDIA_FIELD_NAMES } from '../../utils/constants';
import {
  ERROR_MESSAGE as JUSTIFICATION_ERROR,
  compatibilityLabel,
  justificationHelp,
  requiresJustification,
} from '../../utils/justification';
import { hasContent, originLabel } from '../../utils/mediaEntries';

const props = defineProps({
  entry: { type: Object, required: true },
  number: { type: Number, required: true },
});

const store = useExpedienteStore();

// Obligatoria solo si el medio tiene contenido y no es la opción #1 del ranking.
const mandatory = computed(() => hasContent(props.entry) && requiresJustification(props.entry));
const missing = computed(() => store.missingJustification.has(props.entry.uid));
</script>
