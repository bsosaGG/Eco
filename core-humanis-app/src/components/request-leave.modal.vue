<script setup>
import { ref } from 'vue';
import { X, Calendar, FileText } from 'lucide-vue-next';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'created']);

const leaveType = ref('LICENCIA_MEDICA_IGSS');
const startDate = ref('');
const endDate = ref('');
const supportDocNum = ref('');
const observations = ref('');

const handleSubmit = () => {
  if (!startDate.value || !endDate.value) return;
  emit('created', {
    tipo_licencia: leaveType.value,
    fecha_inicio: startDate.value,
    fecha_fin: endDate.value,
    documento_soporte_num: supportDocNum.value,
    observaciones: observations.value
  });
  emit('close');
};
</script>

<template>
  <div v-if="show" class="modal__overlay" @click.self="emit('close')">
    <div class="modal__content card">
      <div class="card__header" style="display: flex; justify-content: space-between; align-items: center;">
        <h3 class="card__title">
          <Calendar class="icon-inline" /> Solicitar Licencia / Permiso Institucional
        </h3>
        <button class="btn btn--sm btn--secondary" @click="emit('close')">
          <X class="icon-inline" />
        </button>
      </div>

      <div class="card__body">
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-group">
            <label class="form-group__label">Tipo de Permiso / Licencia</label>
            <select v-model="leaveType" class="form-group__control" required>
              <option value="LICENCIA_MEDICA_IGSS">Licencia Médica IGSS (Enfermedad / Maternidad)</option>
              <option value="PERMISO_MATRIMONIO">Permiso por Matrimonio (5 días con goce)</option>
              <option value="PERMISO_DUELO">Permiso por Duelo / Fallecimiento (3 días con goce)</option>
              <option value="PERMISO_PATERNIDAD">Permiso por Paternidad (2 días con goce)</option>
              <option value="PERMISO_PERSONAL_SIN_GOCE">Permiso Personal (Sin Goce de Sueldo)</option>
            </select>
          </div>

          <div class="grid grid--2-cols" style="gap: 1rem;">
            <div class="form-group">
              <label class="form-group__label">Fecha de Inicio</label>
              <input type="date" v-model="startDate" class="form-group__control" required />
            </div>
            <div class="form-group">
              <label class="form-group__label">Fecha de Fin</label>
              <input type="date" v-model="endDate" class="form-group__control" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-group__label">No. de Constancia / Suspensión IGSS (Si aplica)</label>
            <input type="text" v-model="supportDocNum" class="form-group__control" placeholder="Ej. IGSS-SUSP-2026-9941" />
          </div>

          <div class="form-group">
            <label class="form-group__label">Motivo / Observaciones</label>
            <textarea v-model="observations" class="form-group__control" rows="3" placeholder="Detalla el motivo del permiso..."></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
            <button type="button" class="btn btn--secondary" @click="emit('close')">Cancelar</button>
            <button type="submit" class="btn btn--primary">Enviar Solicitud a RRHH</button>
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
  max-width: 550px;
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
