<template>
  <div class="vacations-view">
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Gestión de Vacaciones y Saldos Kardex</h2>
          <p class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">
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
                <td colspan="7" class="data-table__td" style="text-align: center; color: var(--text-muted);">
                  No hay solicitudes de vacaciones registradas.
                </td>
              </tr>
              <tr v-for="req in vacationsStore.requests" :key="req.id" class="data-table__row">
                <td class="data-table__td" style="font-weight: 600;">{{ req.correlativo }}</td>
                <td class="data-table__td">{{ req.colaborador_nombre || 'Colaborador Institucional' }}</td>
                <td class="data-table__td">{{ req.unidad_nombre || 'Despacho Superior' }}</td>
                <td class="data-table__td">{{ req.fecha_inicio }} al {{ req.fecha_fin }}</td>
                <td class="data-table__td" style="text-align: center;">
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
                  <div style="display: flex; gap: 0.375rem;">
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
          <div v-for="c in colabStore.colaboradores" :key="c.id" class="card card--interactive p-3" style="padding: 1rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <h4 style="font-size: 0.9375rem;">{{ c.primer_nombre }} {{ c.primer_apellido }}</h4>
              <span class="badge badge--info">{{ c.renglon_codigo || '011' }}</span>
            </div>
            <p class="text-muted" style="font-size: 0.8125rem;">{{ c.puesto_funcional || 'Personal Institucional' }}</p>
            <div style="margin-top: 1rem; border-top: 1px solid var(--border-light); padding-top: 0.75rem; display: flex; justify-content: space-between; font-size: 0.8125rem;">
              <div>
                <div class="text-muted">Derecho:</div>
                <div style="font-weight: 600;">15.00 días</div>
              </div>
              <div>
                <div class="text-muted">Utilizados:</div>
                <div style="font-weight: 600; color: var(--color-warning-text);">0.00 días</div>
              </div>
              <div>
                <div class="text-muted">Disponibles:</div>
                <div style="font-weight: 600; color: var(--color-success-text);">15.00 días</div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useVacationsStore } from '../stores/vacations.store';
import { useCollaboratorsStore } from '../stores/collaborators.store';
import { useAuthStore } from '../stores/auth.store';
import RequestVacationModal from '../components/request-vacation.modal.vue';

const vacationsStore = useVacationsStore();
const colabStore = useCollaboratorsStore();
const authStore = useAuthStore();

const activeTab = ref('solicitudes');
const showModal = ref(false);

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

function formatEstado(estado) {
  const map = {
    'PENDIENTE_JEFE': 'Visto Bueno Pendiente',
    'APROBADO_JEFE': 'Aprobado por Jefe',
    'APROBADO_RRHH': 'Aprobado por RRHH',
    'RECHAZADO': 'Rechazado'
  };
  return map[estado] || estado;
}

async function handleUpdateStatus(id, newStatus) {
  if (confirm(`¿Confirma cambiar el estado de la solicitud a ${formatEstado(newStatus)}?`)) {
    await vacationsStore.updateStatus(id, newStatus);
  }
}

function onVacationCreated() {
  alert('Solicitud de vacaciones registrada con éxito.');
}
</script>
