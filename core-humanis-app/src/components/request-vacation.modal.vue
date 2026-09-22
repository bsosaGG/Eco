<template>
  <div v-if="show" class="modal__overlay" @click.self="close">
    <div class="modal__content card">
      <div class="modal__header card__header">
        <h3 class="font-heading">Solicitar Vacaciones / Permiso</h3>
        <button class="btn btn--sm btn--secondary" @click="close">&times;</button>
      </div>

      <div class="modal__body card__body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-group__label">Colaborador:</label>
            <select v-model="form.persona_id" class="form-group__control" required>
              <option value="" disabled>Seleccione un colaborador...</option>
              <option v-for="c in colaboradores" :key="c.id" :value="c.id">
                {{ c.primer_nombre }} {{ c.primer_apellido }} ({{ c.cui_dpi }})
              </option>
            </select>
          </div>

          <div class="grid grid--2">
            <div class="form-group">
              <label class="form-group__label">Fecha de Inicio:</label>
              <input type="date" v-model="form.fecha_inicio" class="form-group__control" required />
            </div>
            <div class="form-group">
              <label class="form-group__label">Fecha de Fin:</label>
              <input type="date" v-model="form.fecha_fin" class="form-group__control" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-group__label">Observaciones / Motivo:</label>
            <textarea
              v-model="form.observaciones"
              class="form-group__control"
              rows="3"
              placeholder="Ej. Solicitud de periodo vacacional anual correspondiente al periodo 2026..."
            ></textarea>
          </div>

          <div v-if="errorMessage" class="form-group__error">
            {{ errorMessage }}
          </div>

          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="close">Cancelar</button>
            <button type="submit" class="btn btn--primary" :disabled="submitting">
              {{ submitting ? 'Enviando...' : 'Enviar Solicitud' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { useCollaboratorsStore } from '../stores/collaborators.store';
import { useVacationsStore } from '../stores/vacations.store';

const props = defineProps({
  show: Boolean,
  defaultPersonaId: String
});

const emit = defineEmits(['close', 'created']);

const colabStore = useCollaboratorsStore();
const vacationsStore = useVacationsStore();

const colaboradores = ref([]);
const submitting = ref(false);
const errorMessage = ref('');

const form = reactive({
  persona_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  observaciones: ''
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    errorMessage.value = '';
    form.persona_id = props.defaultPersonaId || (colaboradores.value[0]?.id || '');
    form.fecha_inicio = new Date().toISOString().split('T')[0];
    const fin = new Date();
    fin.setDate(fin.getDate() + 4);
    form.fecha_fin = fin.toISOString().split('T')[0];
  }
});

onMounted(async () => {
  if (!colabStore.colaboradores.length) {
    await colabStore.fetchColaboradores();
  }
  colaboradores.value = colabStore.colaboradores;
  if (props.defaultPersonaId) {
    form.persona_id = props.defaultPersonaId;
  }
});

function close() {
  emit('close');
}

async function handleSubmit() {
  submitting.value = true;
  errorMessage.value = '';
  try {
    await vacationsStore.createRequest({
      persona_id: form.persona_id,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      observaciones: form.observaciones
    });
    emit('created');
    close();
  } catch (err) {
    errorMessage.value = err.message || 'Error al enviar la solicitud';
  } finally {
    submitting.value = false;
  }
}
</script>
