<template>
  <aside class="workflow-actions" aria-label="Acciones del documento">
    <p class="workflow-actions-title">Acciones</p>

    <div class="workflow-actions-list">
      <button v-show="stage >= 2" type="button" class="workflow-action workflow-navigation"
        :disabled="busy" @click="$emit('prev')">
        ← Volver
        <span class="workflow-action-status">Etapa anterior</span>
      </button>

      <button v-show="stage <= 3 && canUpdate" type="button" class="workflow-action workflow-save is-available"
        :disabled="busy" @click="$emit('save')">
        Guardar cambios
        <span class="workflow-action-status">{{ saveStatus }}</span>
      </button>

      <button v-show="stage >= 3 && canExport" type="button" class="workflow-action workflow-generate"
        :class="{ 'is-available': canGenerate }" :disabled="!canGenerate" @click="$emit('generate')">
        Generar Plan de Medios
        <span class="workflow-action-status">{{ generateStatus }}</span>
      </button>

      <button v-if="canExport" type="button" class="workflow-action workflow-download"
        :class="{ 'is-available': store.meta.wordGenerated }" :disabled="!store.meta.wordGenerated"
        @click="store.downloadPlan()">
        Descargar Plan de Medios
        <span class="workflow-action-status">{{ store.meta.wordGenerated ? 'Documento listo' : 'Genere el documento' }}</span>
      </button>

      <button v-show="stage <= 3" type="button" class="workflow-action workflow-next" :disabled="busy"
        @click="$emit('next')">
        {{ next.label }}
        <span class="workflow-action-status">{{ next.status }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useExpedienteStore } from '../../stores/expediente.store';
import authService from '../../services/auth.service';

const props = defineProps({ stage: { type: Number, required: true } });
defineEmits(['prev', 'save', 'generate', 'next']);

const store = useExpedienteStore();
const canUpdate = authService.hasPermission('plan-medios:update');
const canExport = authService.hasPermission('plan-medios:export');

const busy = computed(() => store.saving || store.generating);
const canGenerate = computed(() => store.saved && !busy.value);

const saveStatus = computed(() => {
  if (store.saving) return 'Guardando…';
  return store.saved ? 'Cambios guardados' : 'Paso disponible';
});
const generateStatus = computed(() => {
  if (store.generating) return 'Generando…';
  return store.saved ? 'Listo para generar' : 'Guarde primero';
});

const NEXT_BY_STAGE = {
  1: { label: 'Guardar y continuar a prioridades →', status: 'Prioridades de campaña' },
  2: { label: 'Guardar y continuar a medios →', status: 'Planificación de medios' },
  3: { label: 'Guardar y continuar a solicitudes →', status: 'Solicitudes de Compra' },
};
const next = computed(() => NEXT_BY_STAGE[props.stage] || NEXT_BY_STAGE[3]);
</script>
