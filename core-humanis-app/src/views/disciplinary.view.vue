<template>
  <div class="disciplinary-page page-container">
    <div class="adaptive-bar">
      <div>
        <h1 class="page-title">Régimen Disciplinario</h1>
        <p class="page-subtitle">Trazabilidad de faltas administrativas y garantía del debido proceso (Art. 12 CPRG)</p>
      </div>
      <div class="adaptive-bar__actions">
        <button @click="showNewModal = true" class="btn btn--primary">
          <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Falta
        </button>
      </div>
    </div>

    <!-- Tabla de Expedientes -->
    <div class="card table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Correlativo</th>
              <th>Colaborador</th>
              <th>Fecha Falta</th>
              <th>Gravedad</th>
              <th>Sanción</th>
              <th>Días Suspensión</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="payrollsStore.loading">
              <td colspan="8" class="text-center py-4">Cargando expedientes disciplinarios...</td>
            </tr>
            <tr v-else-if="payrollsStore.disciplinaryRecords.length === 0">
              <td colspan="8" class="text-center py-4">No hay expedientes disciplinarios registrados.</td>
            </tr>
            <tr v-for="r in payrollsStore.disciplinaryRecords" :key="r.id">
              <td class="font-bold text-primary">{{ r.correlativo }}</td>
              <td>{{ r.primer_nombre }} {{ r.primer_apellido }}</td>
              <td>{{ formatDate(r.fecha_incidente) }}</td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge--danger': r.gravedad_falta === 'GRAVISIMA',
                    'badge--warning': r.gravedad_falta === 'GRAVE',
                    'badge--secondary': r.gravedad_falta === 'LEVE'
                  }"
                >
                  {{ r.gravedad_falta }}
                </span>
              </td>
              <td>{{ r.tipo_sancion_definitiva || r.tipo_sancion_propuesta }}</td>
              <td>{{ r.dias_suspension > 0 ? `${r.dias_suspension} días` : '0' }}</td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(r.estado)">
                  {{ r.estado }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    v-if="r.estado === 'REGISTRADO'"
                    @click="handleConferirAudiencia(r.id)"
                    class="btn btn--sm btn--secondary"
                    title="Conferir 3 días de audiencia legal"
                  >
                    Conferir Audiencia
                  </button>
                  <button
                    v-if="r.estado === 'DESCARGO_RECIBIDO' || r.estado === 'AUDIENCIA_CONFERIDA'"
                    @click="openResolveModal(r)"
                    class="btn btn--sm btn--primary"
                  >
                    Resolver
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Registrar Falta -->
    <div v-if="showNewModal" class="modal__overlay" @click.self="showNewModal = false">
      <div class="modal__content modal-dialog">
        <div class="card__header">
          <h2 class="card__title">Registrar Reporte Disciplinario</h2>
        </div>
        <form @submit.prevent="handleCreateRecord" class="modal-form">
          <div class="form-group">
            <label class="form-label">Colaborador:</label>
            <select v-model="form.persona_id" required class="form-control">
              <option value="" disabled>Seleccione un colaborador...</option>
              <option v-for="c in colabStore.colaboradores" :key="c.id" :value="c.id">
                {{ c.primer_nombre }} {{ c.primer_apellido }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha del Incidente:</label>
            <input v-model="form.fecha_incidente" type="date" required class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Gravedad de la Falta:</label>
            <select v-model="form.gravedad_falta" required class="form-control">
              <option value="LEVE">Leve (Amonestación Verbal o Escrita)</option>
              <option value="GRAVE">Grave (Suspensión sin Goce de Sueldo)</option>
              <option value="GRAVISIMA">Gravísima (Destitución con Causa)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sanción Propuesta:</label>
            <select v-model="form.tipo_sancion_propuesta" required class="form-control">
              <option value="AMONESTACION_VERBAL">Amonestación Verbal</option>
              <option value="AMONESTACION_ESCRITA">Amonestación Escrita</option>
              <option value="SUSPENSION">Suspensión de Trabajo sin Goce</option>
              <option value="DESTITUCION">Destitución Justificada</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Relación de Hechos:</label>
            <textarea v-model="form.hechos_denuncia" rows="3" required class="form-control" placeholder="Describa los hechos ocurridos..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showNewModal = false" class="btn btn--secondary">Cancelar</button>
            <button type="submit" class="btn btn--primary" :disabled="submitting">
              {{ submitting ? "Guardando..." : "Registrar Reporte" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Resolver Falta -->
    <div v-if="showResolveModal" class="modal__overlay" @click.self="showResolveModal = false">
      <div class="modal__content modal-dialog">
        <div class="card__header">
          <h2 class="card__title">Emitir Resolución Final</h2>
        </div>
        <form @submit.prevent="handleResolveRecord" class="modal-form">
          <div class="form-group">
            <label class="form-label">Sanción Definitiva:</label>
            <select v-model="resolveForm.tipo_sancion_definitiva" required class="form-control">
              <option value="AMONESTACION_ESCRITA">Amonestación Escrita</option>
              <option value="SUSPENSION">Suspensión sin Goce de Sueldo</option>
              <option value="ABSUELTO">Absolución / Desestimación</option>
            </select>
          </div>
          <div v-if="resolveForm.tipo_sancion_definitiva === 'SUSPENSION'" class="form-group">
            <label class="form-label">Días de Suspensión (Descuento en Nómina):</label>
            <input v-model.number="resolveForm.dias_suspension" type="number" min="1" max="30" required class="form-control" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showResolveModal = false" class="btn btn--secondary">Cancelar</button>
            <button type="submit" class="btn btn--primary">Emitir Resolución</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usePayrollsStore } from "../stores/payrolls.store";
import { useCollaboratorsStore } from "../stores/collaborators.store";
import { useToast } from "../composables/useToast";
import { formatDate } from "../utils/date";

const payrollsStore = usePayrollsStore();
const colabStore = useCollaboratorsStore();
const toast = useToast();

const showNewModal = ref(false);
const showResolveModal = ref(false);
const submitting = ref(false);
const selectedRecord = ref(null);

const form = ref({
  persona_id: "",
  fecha_incidente: new Date().toISOString().split("T")[0],
  gravedad_falta: "GRAVE",
  tipo_sancion_propuesta: "SUSPENSION",
  hechos_denuncia: "",
});

const resolveForm = ref({
  tipo_sancion_definitiva: "SUSPENSION",
  dias_suspension: 3,
});


const getStatusBadgeClass = (estado) => {
  if (estado === "RESUELTO") return "badge--success";
  if (estado === "AUDIENCIA_CONFERIDA") return "badge--warning";
  if (estado === "DESCARGO_RECIBIDO") return "badge--info";
  return "badge--secondary";
};

const handleCreateRecord = async () => {
  submitting.value = true;
  try {
    await payrollsStore.createDisciplinaryRecord(form.value);
    toast.success("Reporte disciplinario registrado exitosamente");
    showNewModal.value = false;
  } catch (err) {
    toast.error(err.message || "Error al registrar reporte");
  } finally {
    submitting.value = false;
  }
};

const handleConferirAudiencia = async (id) => {
  try {
    await payrollsStore.createHearing(id, new Date().toISOString().split("T")[0]);
    toast.info("Audiencia de descargo legal conferida por 3 días hábiles.");
  } catch (err) {
    toast.error(err.message || "Error al conferir audiencia");
  }
};

const openResolveModal = (record) => {
  selectedRecord.value = record;
  showResolveModal.value = true;
};

const handleResolveRecord = async () => {
  if (!selectedRecord.value) return;
  try {
    await payrollsStore.resolveDisciplinaryRecord(selectedRecord.value.id, resolveForm.value);
    toast.success("Expediente resuelto exitosamente");
    showResolveModal.value = false;
  } catch (err) {
    toast.error(err.message || "Error al resolver expediente");
  }
};

onMounted(() => {
  payrollsStore.fetchDisciplinaryRecords();
  colabStore.fetchColaboradores(1);
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.action-buttons {
  display: flex;
  gap: 0.5rem;
}
.modal-dialog {
  max-width: 500px;
  width: 100%;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
