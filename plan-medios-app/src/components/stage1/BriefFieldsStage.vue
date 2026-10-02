<template>
  <div>
    <p class="stage-intro">
      <strong>Etapa 1 — Campaña y Brief.</strong>
      Revise la información general extraída del Brief, corrija los campos necesarios y complete la revisión
      ortográfica antes de continuar.
    </p>

    <template v-for="(field, fieldId) in store.fields" :key="fieldId">
      <h3 v-if="SECTION_HEADINGS[fieldId]" class="section-heading">{{ SECTION_HEADINGS[fieldId] }}</h3>

      <ReviewedField v-model="field.value" v-model:ignoredKeys="field.ignoredKeys"
        :input-id="`field_${fieldId.replace('.', '_')}`" :field-id="fieldId" :label="field.name"
        :multiline="TEXTAREA_FIELDS.has(fieldId)">
        <template v-if="AUDIENCE_FIELDS.has(fieldId)">
          <label class="territory-label" :for="`territory_${fieldId.replace('.', '_')}`">Territorio</label>
          <textarea :id="`territory_${fieldId.replace('.', '_')}`" v-model="field.territory"
            class="territory-field"></textarea>
        </template>
      </ReviewedField>
    </template>
  </div>
</template>

<script setup>
import ReviewedField from '../common/ReviewedField.vue';
import { useExpedienteStore } from '../../stores/expediente.store';
import { AUDIENCE_FIELDS, SECTION_HEADINGS, TEXTAREA_FIELDS } from '../../utils/constants';

const store = useExpedienteStore();
</script>
