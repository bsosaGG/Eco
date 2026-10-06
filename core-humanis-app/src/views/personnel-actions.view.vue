<template>
  <div class="personnel-actions-page page-container">
    <div class="adaptive-bar">
      <div>
        <h1 class="page-title">Acciones de Personal</h1>
        <p class="page-subtitle">Trazabilidad de nombramientos, ascensos, bajas y cumplimiento DJP ante CGC</p>
      </div>
      <div class="adaptive-bar__actions">
        <button @click="showNewModal = true" class="btn btn--primary">
          <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Acción
        </button>
      </div>
    </div>

    <!-- Tabla de Acciones -->
    <div class="card table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Correlativo</th>
              <th>Colaborador</th>
              <th>Tipo de Acción</th>
              <th>Fecha Efectiva</th>
              <th>Salario / Puesto</th>
              <th>Semáforo DJP (CGC)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="payrollsStore.loading">
              <td colspan="8" class="text-center py-4">Cargando acciones de personal...</td>
            </tr>
            <tr v-else-if="payrollsStore.personnelActions.length === 0">
              <td colspan="8" class="text-center py-4">No hay acciones de personal registradas.</td>
            </tr>
            <tr v-for="a in payrollsStore.personnelActions" :key="a.id">
              <td class="font-bold text-primary">{{ a.correlativo }}</td>
              <td>{{ a.primer_nombre }} {{ a.primer_apellido }}</td>
              <td>
                <span class="badge badge--info">{{ a.tipo_accion }}</span>
              </td>
              <td>{{ formatDate(a.fecha_efectiva) }}</td>
              <td>
                <div v-if="a.salario_nuevo" class="font-bold">Q {{ formatMoney(a.salario_nuevo) }}</div>
                <small class="text-muted">{{ a.puesto_funcional || "Puesto Actual" }}</small>
              </td>
              <td>
                <div v-if="a.djp_cumplida">
                  <span class="badge badge--success">DJP Cumplida ✓</span>
                </div>
                <div v-else-if="a.alertaDjp">
                  <span
                    class="badge"
                    :class="{
                      'badge--danger': a.alertaDjp.semaforo === 'ROJO',
                      'badge--warning': a.alertaDjp.semaforo === 'AMBAR',
                      'badge--success': a.alertaDjp.semaforo === 'VERDE'
                    }"
                  >
                    {{ a.alertaDjp.diasRestantes }} días restantes
                  </span>
                </div>
                <span v-else class="text-muted">No Aplica</span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="a.estado === 'APROBADO' ? 'badge--success' : 'badge--secondary'"
                >
                  {{ a.estado }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    v-if="a.estado !== 'APROBADO'"
                    @click="handleApproveAction(a.id)"
                    class="btn btn--sm btn--primary"
                  >
                    Aprobar
                  </button>
                  <button
                    v-if="!a.djp_cumplida && a.requiere_djp_cgc"
                    @click="handleMarkDjp(a.id)"
                    class="btn btn--sm btn--secondary"
                    title="Marcar DJP entregada ante CGC"
                  >
                    DJP Entregada
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nueva Acción de Personal -->
    <div v-if="showNewModal" class="modal__overlay" @click.self="showNewModal = false">
      <div class="modal__content modal-dialog">
        <div class="card__header">
          <h2 class="card__title">Registrar Acción de Personal</h2>
        </div>
        <form @submit.prevent="handleCreateAction" class="modal-form">
          <div class="form-group">
            <label class="form-label">Colaborador:</label>
            <select v-model="form.persona_id" required class="form-control">
              <option value="" disabled>Seleccione un colaborador...</option>
              <option v-for="c in colabStore.colaboradores" :key="c.id" :value="c.id">
                {{ c.primer_nombre }} {{ c.primer_apellido }} ({{ c.cui_dpi }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Movimiento:</label>
            <select v-model="form.tipo_accion" required class="form-control">
              <option value="NOMBRAMIENTO">Nombramiento (Primer Ingreso)</option>
              <option value="ASCENSO">Ascenso / Promoción</option>
              <option value="TRASLADO">Traslado Administrativo</option>
              <option value="SUSPENSION">Suspensión de Funciones</option>
              <option value="BAJA">Baja / Rescisión</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha Efectiva:</label>
            <input v-model="form.fecha_efectiva" type="date" required class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Nuevo Salario / Honorarios (Q):</label>
            <input v-model.number="form.salario_nuevo" type="number" step="0.01" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Justificación Administrativa:</label>
            <textarea v-model="form.justificacion" rows="3" required class="form-control" placeholder="Indique la justificación del movimiento..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showNewModal = false" class="btn btn--secondary">Cancelar</button>
            <button type="submit" class="btn btn--primary" :disabled="submitting">
              {{ submitting ? "Registrando..." : "Guardar Acción" }}
            </button>
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
const submitting = ref(false);

const form = ref({
  persona_id: "",
  tipo_accion: "ASCENSO",
  fecha_efectiva: new Date().toISOString().split("T")[0],
  salario_nuevo: null,
  justificacion: "",
});

const formatMoney = (val) => Number(val || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 });

const handleCreateAction = async () => {
  submitting.value = true;
  try {
    await payrollsStore.createPersonnelAction(form.value);
    toast.success("Acción de personal registrada exitosamente");
    showNewModal.value = false;
    form.value = {
      persona_id: "",
      tipo_accion: "ASCENSO",
      fecha_efectiva: new Date().toISOString().split("T")[0],
      salario_nuevo: null,
      justificacion: "",
    };
  } catch (err) {
    toast.error(err.message || "Error al registrar acción");
  } finally {
    submitting.value = false;
  }
};

const handleApproveAction = async (id) => {
  try {
    await payrollsStore.updatePersonnelActionStatus(id, "APROBADO");
    toast.success("Acción de personal aprobada exitosamente");
  } catch (err) {
    toast.error(err.message || "Error al aprobar acción");
  }
};

const handleMarkDjp = async (id) => {
  try {
    await payrollsStore.updateCgcDjpStatus(id, true);
    toast.success("Estado de DJP CGC actualizado exitosamente");
  } catch (err) {
    toast.error(err.message || "Error al actualizar estado de DJP");
  }
};

onMounted(() => {
  payrollsStore.fetchPersonnelActions();
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
