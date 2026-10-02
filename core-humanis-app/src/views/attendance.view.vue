<script setup>
import { ref, onMounted } from 'vue';
import { useAttendanceStore } from '../stores/attendance.store';
import { useCollaboratorsStore } from '../stores/collaborators.store';
import { useToast } from '../composables/useToast';
import { Clock, CheckCircle2, AlertTriangle, UploadCloud, Users, Check, X, Shield } from 'lucide-vue-next';

const attendanceStore = useAttendanceStore();
const collaboratorsStore = useCollaboratorsStore();
const toast = useToast();

const selectedPersonaId = ref('510523ce-a019-51d3-b8c9-c6b5b1696471'); // Default demo
const mockPunchTime = ref('');
const activeSubTab = ref('punches'); // 'punches' | 'approvals' | 'shifts'

onMounted(async () => {
  await collaboratorsStore.fetchColaboradores();
  if (collaboratorsStore.colaboradores.length > 0) {
    selectedPersonaId.value = collaboratorsStore.colaboradores[0].id;
  }
  await attendanceStore.fetchPunches(selectedPersonaId.value);
  await attendanceStore.fetchIncidents();
});

const onCollaboratorChange = async () => {
  await attendanceStore.fetchPunches(selectedPersonaId.value);
};

const handleSimulatePunch = async () => {
  if (!mockPunchTime.value) return;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const fullDateTime = `${dateStr}T${mockPunchTime.value}:00Z`;

  await attendanceStore.registerPunches({
    persona_id: selectedPersonaId.value,
    fecha_hora: fullDateTime,
    tipo_marca: 'ENTRADA',
    origen: 'BIOMETRICO'
  });
  await attendanceStore.fetchPunches(selectedPersonaId.value);
  mockPunchTime.value = '';
};

const handleApproveIncident = async (incidentId, approved) => {
  await attendanceStore.updateIncidentStatus(incidentId, {
    justificada: approved,
    motivo: approved ? 'Justificación aprobada por la URH' : 'Justificación rechazada por la URH'
  });
  if (approved) {
    toast.success('Incidencia justificada y aprobada exitosamente.');
  } else {
    toast.info('Incidencia marcada como no justificada.');
  }
};
</script>

<template>
  <div class="attendance-view page-container">
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Gestión de Horarios y Asistencia Biométrica</h1>
        <p class="page-header__subtitle">Consolidado de marcas, administración de jornadas y aprobación de justificaciones (Módulo 2)</p>
      </div>
    </div>

    <!-- SUB-PESTAÑAS DE ADMINISTRACION -->
    <div class="tabs-nav mb-4">
      <button class="tab-btn" :class="{ 'tab-btn--active': activeSubTab === 'punches' }" @click="activeSubTab = 'punches'">
        <Clock class="icon-inline" /> Control de Marcas Biométrica
      </button>
      <button class="tab-btn" :class="{ 'tab-btn--active': activeSubTab === 'approvals' }" @click="activeSubTab = 'approvals'">
        <AlertTriangle class="icon-inline" /> Aprobación de Justificaciones
      </button>
      <button class="tab-btn" :class="{ 'tab-btn--active': activeSubTab === 'shifts' }" @click="activeSubTab = 'shifts'">
        <Shield class="icon-inline" /> Jornadas Institucionales SCSPR
      </button>
    </div>

    <!-- SUB-PESTAÑA 1: CONTROL DE MARCAS BIOMETRICAS -->
    <div v-if="activeSubTab === 'punches'">
      <div class="grid--2 mb-4">
        <!-- Panel de Ingesta Biométrica -->
        <div class="card">
          <div class="card__header">
            <h2 class="card__title">
              <Clock class="icon-inline" /> Ingesta de Marcajes (Reloj Biométrico Digital)
            </h2>
          </div>
          <div class="card__body">
            <form @submit.prevent="handleSimulatePunch" class="form">
              <div class="form-group">
                <label class="form-group__label"><Users class="icon-inline" /> Seleccionar Colaborador Institucional</label>
                <select v-model="selectedPersonaId" @change="onCollaboratorChange" class="form-group__control">
                  <option v-for="c in collaboratorsStore.colaboradores" :key="c.id" :value="c.id">
                    {{ c.primer_nombre }} {{ c.primer_apellido }} &bull; {{ c.cui_dpi }} ({{ c.renglon_codigo || '011' }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-group__label">Hora de Marcaje Entrada (Jornada: 08:00 AM)</label>
                <input type="time" v-model="mockPunchTime" class="form-group__control" required />
              </div>

              <button type="submit" class="btn btn--primary" :disabled="attendanceStore.loading">
                <UploadCloud class="icon-inline" /> Ingestar Marca Biométrica
              </button>
            </form>
          </div>
        </div>

        <!-- Parámetros de Puntualidad -->
        <div class="card">
          <div class="card__header">
            <h2 class="card__title">Parámetros de Tolerancia y Horarios</h2>
          </div>
          <div class="card__body">
            <div class="info-box" style="background: var(--bg-hover); padding: 1rem; border-radius: 6px;">
              <p><strong>Jornada Standard SCSPR:</strong> 08:00 a 16:30 hrs</p>
              <p><strong>Límite de Tolerancia:</strong> 15 Minutos (08:15 AM)</p>
              <p><strong>Régimen:</strong> Aplica a personal permanente (011) y contrato (022).</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Marcas Registradas -->
      <div class="card" style="margin-top: 1.5rem;">
        <div class="card__header">
          <h2 class="card__title">Historial de Marcajes Biométricos Registrados</h2>
        </div>
        <div class="card__body">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Tipo de Marca</th>
                <th>Dispositivo / Reloj</th>
                <th>Origen</th>
                <th>Estado Puntualidad</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="punch in attendanceStore.punches" :key="punch.id">
                <td>{{ new Date(punch.fecha_hora).toLocaleString('es-GT') }}</td>
                <td><span class="badge badge--info">{{ punch.tipo_marca }}</span></td>
                <td>{{ punch.dispositivo_id }}</td>
                <td>{{ punch.origen }}</td>
                <td>
                  <span class="badge badge--success" v-if="new Date(punch.fecha_hora).getHours() < 8 || (new Date(punch.fecha_hora).getHours() === 8 && new Date(punch.fecha_hora).getMinutes() <= 15)">
                    <CheckCircle2 class="icon-inline" /> En Tiempo
                  </span>
                  <span class="badge badge--warning" v-else>
                    <AlertTriangle class="icon-inline" /> Retardo
                  </span>
                </td>
              </tr>
              <tr v-if="attendanceStore.punches.length === 0">
                <td colspan="5" style="text-align: center; color: var(--text-muted);">No hay marcajes biométricos registrados</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SUB-PESTAÑA 2: BANDEJA DE APROBACIÓN DE JUSTIFICACIONES -->
    <div v-if="activeSubTab === 'approvals'">
      <div class="card">
        <div class="card__header">
          <h2 class="card__title">Bandeja de Aprobación de Justificaciones de Incidencias</h2>
        </div>
        <div class="card__body">
          <table class="data-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Fecha Incidencia</th>
                <th>Tipo</th>
                <th>Retardo</th>
                <th>Justificación del Colaborador</th>
                <th>Acción URH / Jefe</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inc in attendanceStore.incidents" :key="inc.id">
                <td>{{ inc.colaborador_nombre || 'Karina García Méndez' }}</td>
                <td>{{ inc.fecha }}</td>
                <td><span class="badge badge--warning">{{ inc.tipo_incidencia || 'RETARDO' }}</span></td>
                <td>{{ inc.minutos_retraso || 15 }} mins</td>
                <td>{{ inc.justificacion_motivo || 'Tránsito pesado en calzada Roosevelt por lluvia.' }}</td>
                <td>
                  <div style="display: flex; gap: 0.5rem;" v-if="!inc.justificada">
                    <button class="btn btn--sm btn--primary" @click="handleApproveIncident(inc.id, true)">
                      <Check class="icon-inline" /> Aprobar
                    </button>
                    <button class="btn btn--sm btn--secondary" @click="handleApproveIncident(inc.id, false)">
                      <X class="icon-inline" /> Rechazar
                    </button>
                  </div>
                  <span class="badge badge--success" v-else>
                    <CheckCircle2 class="icon-inline" /> Justificada / Aprobada
                  </span>
                </td>
              </tr>
              <tr v-if="attendanceStore.incidents.length === 0">
                <td colspan="6" style="text-align: center; color: var(--text-muted);">No hay justificaciones pendientes de aprobación.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SUB-PESTAÑA 3: JORNADAS INSTITUCIONALES -->
    <div v-if="activeSubTab === 'shifts'">
      <div class="card">
        <div class="card__header">
          <h2 class="card__title">Jornadas y Turnos Aprobados por la SCSPR</h2>
        </div>
        <div class="card__body">
          <div class="card__item adaptive-bar mb-3">
            <div>
              <p class="card__item-title">Jornada Ordinaria Administrativa (SCSPR Standard)</p>
              <p class="card__item-subtitle">Horario: 08:00 a 16:30 hrs | Tolerancia: 15 minutos | Días: Lunes a Viernes</p>
            </div>
            <span class="badge badge--success">Activa / Principal</span>
          </div>

          <div class="card__item adaptive-bar">
            <div>
              <p class="card__item-title">Turno Rotativo Prensa y Noticias (Dirección de Prensa)</p>
              <p class="card__item-subtitle">Horario: 06:00 a 14:30 hrs | Tolerancia: 10 minutos | Días: Turnos rotativos</p>
            </div>
            <span class="badge badge--info">Turno Especial</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 1.5rem;
}
.tab-btn {
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.tab-btn--active {
  color: var(--color-primary-900);
  border-bottom-color: var(--color-gold-500);
}
.icon-inline {
  width: 1rem;
  height: 1rem;
  vertical-align: middle;
}
</style>
