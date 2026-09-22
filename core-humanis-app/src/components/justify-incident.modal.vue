<script setup>
import { ref } from 'vue';
import { X, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  show: Boolean,
  incident: Object
});

const emit = defineEmits(['close', 'submitted']);

const justification = ref('');

const handleSubmit = () => {
  if (!justification.value) return;
  emit('submitted', {
    incidentId: props.incident?.id,
    justificacion: justification.value
  });
  emit('close');
};
</script>

<template>
  <div v-if="show" class="modal__overlay" @click.self="emit('close')">
    <div class="modal__content card">
      <div class="card__header" style="display: flex; justify-content: space-between; align-items: center;">
        <h3 class="card__title">
          <AlertCircle class="icon-inline" /> Justificar Incidencia de Asistencia
        </h3>
        <button class="btn btn--sm btn--secondary" @click="emit('close')">
          <X class="icon-inline" />
        </button>
      </div>

      <div class="card__body">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="info-box mb-3" style="background: var(--bg-hover); padding: 0.75rem; border-radius: 6px; font-size: 0.875rem;">
            <p><strong>Fecha de Retardo/Incidencia:</strong> {{ incident?.fecha || 'Fecha actual' }}</p>
            <p><strong>Tiempo de Retardo:</strong> {{ incident?.minutos_retraso || 10 }} minutos</p>
          </div>

          <div class="form-group">
            <label class="form-group__label">Motivo de la Justificación / Caso Fortuito</label>
            <textarea v-model="justification" class="form-group__control" rows="4" required placeholder="Describe las razones del retraso o falla de marcaje (ej. Tránsito extraordinario, cita médica)..."></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
            <button type="button" class="btn btn--secondary" @click="emit('close')">Cancelar</button>
            <button type="submit" class="btn btn--primary">Enviar Justificación a Jefatura</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(12, 35, 64, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal__content {
  width: 100%;
  max-width: 500px;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}
.icon-inline {
  width: 1.1rem;
  height: 1.1rem;
  vertical-align: middle;
}
</style>
