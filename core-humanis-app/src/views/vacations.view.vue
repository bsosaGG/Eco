<template>
  <div class="vacations-view">
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Gestión de Vacaciones y Saldos Kardex</h2>
          <p class="text-muted vacations-header__desc">
            Control institucional de acumulación (15 días de ley), solicitudes en trámite y visto bueno.
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--primary" @click="showModal = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Solicitud
          </button>
        </div>
      </div>
    </div>

    <!-- Pestañas internas -->
    <div class="tabs-nav">
      <button
        class="tabs-nav__btn"
        :class="{ 'tabs-nav__btn--active': activeTab === 'solicitudes' }"
        @click="activeTab = 'solicitudes'"
      >
        Solicitudes de Vacaciones
      </button>
      <button
        class="tabs-nav__btn"
        :class="{ 'tabs-nav__btn--active': activeTab === 'kardex' }"
        @click="activeTab = 'kardex'"
      >
        Kardex y Saldos Acumulados
      </button>
    </div>

    <!-- TAB 1: SOLICITUDES EN TRÁMITE -->
    <div v-if="activeTab === 'solicitudes'" class="card">
      <div class="card__header">
        <h4 class="font-heading">Solicitudes de Vacaciones Registradas</h4>
        <span class="badge badge--info">{{ vacationsStore.requests.length }} solicitudes</span>
      </div>
      <div class="card__body">
        <div class="data-table-container table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">Correlativo</th>
                <th class="data-table__th">Colaborador</th>
                <th class="data-table__th">Unidad</th>
                <th class="data-table__th">Fechas</th>
                <th class="data-table__th">Días Hábiles</th>
                <th class="data-table__th">Estado</th>
                <th class="data-table__th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!vacationsStore.requests.length">
                <td colspan="7" class="data-table__td data-table__td--empty">
                  No hay solicitudes de vacaciones registradas.
                </td>
              </tr>
              <tr v-for="req in vacationsStore.requests" :key="req.id" class="data-table__row">
                <td class="data-table__td data-table__td--strong">{{ req.correlativo }}</td>
                <td class="data-table__td">{{ req.colaborador_nombre || 'Colaborador Institucional' }}</td>
                <td class="data-table__td">{{ req.unidad_nombre || 'Despacho Superior' }}</td>
                <td class="data-table__td">{{ formatDate(req.fecha_inicio) }} al {{ formatDate(req.fecha_fin) }}</td>
                <td class="data-table__td data-table__td--center">
                  <span class="badge badge--neutral">{{ req.dias_solicitados }} días</span>
                </td>
                <td class="data-table__td">
                  <span
                    class="badge"
                    :class="{
                      'badge--warning': req.estado === 'PENDIENTE_JEFE',
                      'badge--info': req.estado === 'APROBADO_JEFE',
                      'badge--success': req.estado === 'APROBADO_RRHH',
                      'badge--danger': req.estado === 'RECHAZADO'
                    }"
                  >
                    {{ formatEstado(req.estado) }}
                  </span>
                </td>
                <td class="data-table__td">
                  <div class="table-actions">
                    <button
                      class="btn btn--sm btn--outline"
                      @click="handleViewDetail(req)"
                      title="Ver detalle y cálculo de días"
                    >
                      👁️ Ver Detalle
                    </button>
                    <button
                      v-if="req.estado === 'PENDIENTE_JEFE' && canApproveJefe"
                      class="btn btn--sm btn--secondary"
                      @click="handleUpdateStatus(req.id, 'APROBADO_JEFE')"
                    >
                      Visto Bueno
                    </button>
                    <button
                      v-if="(req.estado === 'PENDIENTE_JEFE' || req.estado === 'APROBADO_JEFE') && canApproveRRHH"
                      class="btn btn--sm btn--primary"
                      @click="handleUpdateStatus(req.id, 'APROBADO_RRHH')"
                    >
                      Aprobar Kardex
                    </button>
                    <button
                      v-if="req.estado !== 'RECHAZADO' && req.estado !== 'APROBADO_RRHH'"
                      class="btn btn--sm btn--danger"
                      @click="handleUpdateStatus(req.id, 'RECHAZADO')"
                    >
                      Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: KARDEX Y SALDOS -->
    <div v-if="activeTab === 'kardex'" class="card">
      <div class="card__header">
        <h4 class="font-heading">Saldos de Vacaciones 2026 (Kardex por Renglón)</h4>
      </div>
      <div class="card__body">
        <div class="grid grid--3">
          <div v-for="c in colabStore.colaboradores" :key="c.id" class="card card--interactive kardex-card p-3">
            <div class="kardex-card__header">
              <h4 class="kardex-card__title">{{ c.primer_nombre }} {{ c.primer_apellido }}</h4>
              <span class="badge badge--info">{{ c.renglon_codigo || '011' }}</span>
            </div>
            <p class="text-muted kardex-card__puesto">{{ c.puesto_funcional || 'Personal Institucional' }}</p>
            <div class="kardex-card__stats">
              <div>
                <div class="text-muted">Derecho:</div>
                <div class="kardex-card__stat-num">15.00 días</div>
              </div>
              <div>
                <div class="text-muted">Utilizados:</div>
                <div class="kardex-card__stat-num text-warning">0.00 días</div>
              </div>
              <div>
                <div class="text-muted">Disponibles:</div>
                <div class="kardex-card__stat-num text-success">15.00 días</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Solicitar Vacaciones -->
    <RequestVacationModal
      :show="showModal"
      @close="showModal = false"
      @created="onVacationCreated"
    />

    <!-- Modal Ver Detalle de Solicitud (Milton Directive) -->
    <VacationDetailModal
      :show="showDetailModal"
      :request="selectedRequest"
      @close="showDetailModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useVacationsStore } from '../stores/vacations.store';
import { useCollaboratorsStore } from '../stores/collaborators.store';
import { useAuthStore } from '../stores/auth.store';
import RequestVacationModal from '../components/request-vacation.modal.vue';
import VacationDetailModal from '../components/vacation-detail.modal.vue';
import { useToast } from '../composables/useToast';

const vacationsStore = useVacationsStore();
const colabStore = useCollaboratorsStore();
const authStore = useAuthStore();
const toast = useToast();

const activeTab = ref('solicitudes');
const showModal = ref(false);
const showDetailModal = ref(false);
const selectedRequest = ref(null);

const canApproveJefe = computed(() => {
  const code = authStore.userRole?.codigo;
  return code === 'ADMIN_TI' || code === 'JEFA_RRHH' || code === 'ANALISTA_RRHH';
});

const canApproveRRHH = computed(() => {
  const code = authStore.userRole?.codigo;
  return code === 'ADMIN_TI' || code === 'JEFA_RRHH';
});

onMounted(async () => {
  await vacationsStore.fetchRequests();
  if (!colabStore.colaboradores.length) {
    await colabStore.fetchColaboradores();
  }
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

function formatEstado(estado) {
  const map = {
    'PENDIENTE_JEFE': 'Visto Bueno Pendiente',
    'APROBADO_JEFE': 'Aprobado por Jefe',
    'APROBADO_RRHH': 'Aprobado por RRHH',
    'RECHAZADO': 'Rechazado'
  };
  return map[estado] || estado;
}

async function handleViewDetail(req) {
  try {
    const detail = await vacationsStore.fetchRequestDetail(req.id);
    selectedRequest.value = detail || req;
    showDetailModal.value = true;
  } catch (err) {
    selectedRequest.value = req;
    showDetailModal.value = true;
  }
}

async function handleUpdateStatus(id, newStatus) {
  if (confirm(`¿Confirma cambiar el estado de la solicitud a ${formatEstado(newStatus)}?`)) {
    await vacationsStore.updateStatus(id, newStatus);
  }
}

function onVacationCreated() {
  toast.success('Solicitud de vacaciones registrada con éxito.');
}
</script>

<style scoped>
.vacations-header__desc {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.data-table__td--strong {
  font-weight: 600;
}

.data-table__td--center {
  text-align: center;
}

.data-table__td--empty {
  text-align: center;
  color: var(--color-text-muted, #64748b);
  padding: 2rem;
}

.table-actions {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.kardex-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-light, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.kardex-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(11, 37, 69, 0.08);
  border-color: var(--color-dorado, #c5a059);
}

.kardex-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.kardex-card__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-institucional, #0c2340);
  margin: 0;
}

.kardex-card__puesto {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
  margin: 0 0 1rem 0;
}

.kardex-card__stats {
  margin-top: auto;
  border-top: 1px solid var(--color-border-light, #e2e8f0);
  padding-top: 0.75rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
}

.kardex-card__stat-num {
  font-weight: 600;
  margin-top: 0.15rem;
}
</style>
