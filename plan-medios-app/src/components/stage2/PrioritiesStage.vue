<template>
  <div>
    <p class="stage-intro">
      <strong>Etapa 2 — Prioridades de campaña.</strong>
      Defina qué factores tienen mayor importancia para esta campaña. Las prioridades se guardan en el expediente y
      todavía no modifican el ranking hasta activar SC-4C.
    </p>

    <h3 class="section-heading">Prioridades para la selección de medios</h3>
    <p class="help">
      Use una configuración rápida o ajuste manualmente los cinco criterios. El total debe sumar exactamente 100%.
    </p>

    <div class="priority-panel">
      <div class="priority-presets" role="group" aria-label="Configuraciones rápidas de prioridades">
        <button v-for="(preset, key) in PRIORITY_PRESETS" :key="key" type="button" class="priority-preset-button"
          :class="{ 'is-active': store.priorities.preset === key }" @click="applyPreset(key)">
          {{ preset.label }}
        </button>
      </div>

      <div class="priority-list">
        <div v-for="item in PRIORITY_ITEMS" :key="item.key" class="priority-item">
          <div class="priority-item-header">
            <label :for="`priority_${item.key}`">{{ item.label }}</label>
            <span class="priority-value">{{ store.priorities.weights[item.key] }}%</span>
          </div>
          <input :id="`priority_${item.key}`" type="range" min="0" max="100" step="5"
            :value="store.priorities.weights[item.key]" @input="onSlide(item.key, $event.target.value)" />
          <p class="priority-description">{{ item.description }}</p>
        </div>
      </div>

      <div class="priority-total" :class="{ 'is-invalid': !store.prioritiesAreValid }" role="status"
        aria-live="polite">
        {{ totalMessage(store.priorities.weights) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useExpedienteStore } from '../../stores/expediente.store';
import { PRIORITY_ITEMS, PRIORITY_PRESETS } from '../../utils/constants';
import { totalMessage } from '../../utils/priorities';

const store = useExpedienteStore();

function onSlide(key, value) {
  store.priorities.weights[key] = Number(value) || 0;
  store.priorities.preset = 'custom'; // ajustar a mano deja de ser un preset
}

function applyPreset(key) {
  Object.assign(store.priorities.weights, PRIORITY_PRESETS[key].weights);
  store.priorities.preset = key;
}
</script>
