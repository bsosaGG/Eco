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

          <!-- Resumen de Kardex y Días Hábiles en tiempo real -->
          <div v-if="selectedColabBalance" class="kardex-preview-box p-3 mb-3 bg-subtle rounded border">
            <div class="d-flex justify-between align-center mb-1">
              <span class="text-xs text-muted font-bold text-uppercase">Estado de Kardex (Año {{ currentYear }}):</span>
              <span class="badge" :class="saldoInsuficiente ? 'badge--danger' : 'badge--success'">
                {{ saldoInsuficiente ? '⚠️ Saldo Insuficiente' : '✓ Saldo Disponible' }}
              </span>
            </div>
            <div class="grid grid--3 text-center pt-1">
              <div>
                <div class="text-xs text-muted">Disponible Actual:</div>
                <div class="font-bold text-sm text-primary">{{ disponibleActual }} días</div>
              </div>
              <div>
                <div class="text-xs text-muted">Días a Solicitar:</div>
                <div class="font-bold text-sm text-warning">{{ diasHabilesCalculados }} días</div>
              </div>
              <div>
                <div class="text-xs text-muted">Saldo Proyectado:</div>
                <div class="font-bold text-sm" :class="saldoInsuficiente ? 'text-danger' : 'text-success'">
                  {{ saldoProyectado }} días
                </div>
              </div>
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

          <div v-if="errorMessage" class="form-group__error mb-3 text-danger text-sm">
            {{ errorMessage }}
          </div>

          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="close">Cancelar</button>
            <button type="submit" class="btn btn--primary" :disabled="submitting || saldoInsuficiente || diasHabilesCalculados <= 0">
              {{ submitting ? 'Enviando...' : 'Enviar Solicitud' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
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

const currentYear = new Date().getFullYear();

const form = reactive({
  persona_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  observaciones: ''
});

// Balance del colaborador seleccionado
const selectedColabBalance = computed(() => {
  if (!form.persona_id) return null;
  return vacationsStore.balances.find(b => b.persona_id === form.persona_id) || {
    dias_derecho: 15.00,
    dias_utilizados: 0.00,
    dias_pendientes: 15.00
  };
});

// Cálculo de días hábiles en el cliente
const diasHabilesCalculados = computed(() => {
  if (!form.fecha_inicio || !form.fecha_fin) return 0;
  const start = new Date(form.fecha_inicio + 'T00:00:00');
  const end = new Date(form.fecha_fin + 'T00:00:00');
  if (end < start) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
});

const disponibleActual = computed(() => {
  if (!selectedColabBalance.value) return 15;
  return parseFloat(selectedColabBalance.value.dias_pendientes || 15);
});

const saldoInsuficiente = computed(() => {
  return diasHabilesCalculados.value > disponibleActual.value;
});

const saldoProyectado = computed(() => {
  const rem = disponibleActual.value - diasHabilesCalculados.value;
  return rem >= 0 ? rem.toFixed(2) : `(${Math.abs(rem).toFixed(2)}) Excede`;
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
  if (!vacationsStore.balances.length) {
    await vacationsStore.fetchBalances();
  }
  if (props.defaultPersonaId) {
    form.persona_id = props.defaultPersonaId;
  }
});

function close() {
  emit('close');
}

async function handleSubmit() {
  if (saldoInsuficiente.value) {
    errorMessage.value = `Saldo insuficiente: Dispone de ${disponibleActual.value} días y solicita ${diasHabilesCalculados.value} días hábiles.`;
    return;
  }
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
    errorMessage.value = err.response?.data?.message || err.message || 'Error al enviar la solicitud';
  } finally {
    submitting.value = false;
  }
}
</script>
