<template>
  <div class="portal-view page-container">
    <!-- Header Institucional del Colaborador -->
    <div class="card glass-panel portal-hero mb-4">
      <div class="card__body portal-hero__body adaptive-bar">
        <div class="portal-hero__user">
          <div class="avatar-circle avatar-circle--hero">
            {{ userInitial }}
          </div>
          <div class="portal-hero__meta">
            <h2 class="font-heading portal-hero__title">
              Bienvenido(a), {{ currentUser.nombres || 'Colaborador' }} {{ currentUser.apellidos || '' }}
            </h2>
            <p class="portal-hero__sub">
              Portal de Autogestión Self-Service &bull;
              {{ currentUser.puesto_funcional || 'Unidad de Comunicación Social' }}
            </p>
          </div>
        </div>

        <div class="adaptive-bar__actions">
          <button class="btn btn--primary portal-hero__btn-vacation" @click="showVacationModal = true">
            <Calendar class="icon-inline" /> Solicitar Vacaciones
          </button>
          <button class="btn btn--secondary portal-hero__btn-leave" @click="showLeaveModal = true">
            <FileText class="icon-inline" /> Permiso / Licencia
          </button>
        </div>
      </div>
    </div>

    <!-- PESTAÑAS NAVEGABLES DEL PORTAL (Scroll táctil nativo) -->
    <div class="tabs-nav mb-4">
      <button class="tab-btn" :class="{ 'tab-btn--active': activeTab === 'overview' }" @click="activeTab = 'overview'">
        <LayoutDashboard class="icon-inline" /> Tablero Principal
      </button>
      <button class="tab-btn" :class="{ 'tab-btn--active': activeTab === 'expediente' }"
        @click="activeTab = 'expediente'">
        <User class="icon-inline" /> Mi Expediente Digital
      </button>
      <button class="tab-btn" :class="{ 'tab-btn--active': activeTab === 'requests' }" @click="activeTab = 'requests'">
        <Clock class="icon-inline" /> Mis Solicitudes & Trámites
      </button>
      <button class="tab-btn" :class="{ 'tab-btn--active': activeTab === 'attendance' }"
        @click="activeTab = 'attendance'">
        <CheckCircle2 class="icon-inline" /> Mi Asistencia & Puntualidad
      </button>
      <button class="tab-btn" :class="{ 'tab-btn--active': activeTab === 'documents' }"
        @click="activeTab = 'documents'">
        <ShieldCheck class="icon-inline" /> Mis Constancias & Boletas
      </button>
    </div>

    <!-- PESTAÑA 1: TABLERO PRINCIPAL (RESUMEN & ALERTAS) -->
    <div v-if="activeTab === 'overview'">
      <div class="grid-adaptive mb-4">
        <div class="card card--interactive">
          <div class="card__body">
            <div class="stat-label">DÍAS DERECHO (LEY)</div>
            <div class="stat-value text-primary">
              15.00 <span class="stat-unit">días</span>
            </div>
            <div class="stat-desc">Período 2026 acumulado</div>
          </div>
        </div>

        <div class="card card--interactive">
          <div class="card__body">
            <div class="stat-label">DÍAS UTILIZADOS</div>
            <div class="stat-value text-warning">
              0.00 <span class="stat-unit">días</span>
            </div>
            <div class="stat-desc">0 solicitudes procesadas</div>
          </div>
        </div>

        <div class="card card--interactive card--accent-success">
          <div class="card__body">
            <div class="stat-label">DÍAS DISPONIBLES</div>
            <div class="stat-value text-success">
              15.00 <span class="stat-unit">días hábiles</span>
            </div>
            <div class="stat-desc">Saldo listo para solicitar</div>
          </div>
        </div>
      </div>

      <div class="grid--2 mb-4">
        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Estado de Mi Finiquito CGC (Contraloría)</h3>
          </div>
          <div class="card__body">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span class="badge badge--success" style="font-size: 1rem; padding: 0.5rem 1rem;">
                <ShieldCheck class="icon-inline" /> Vigente
              </span>
              <div>
                <p><strong>Fecha de Emisión:</strong> 15 de Enero de 2026</p>
                <p><strong>Vencimiento:</strong> 15 de Julio de 2026 (Faltan > 60 días)</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Acciones Rápidas</h3>
          </div>
          <div class="card__body" style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn--secondary" @click="showVacationModal = true">
              <Calendar class="icon-inline" /> Solicitar Vacaciones
            </button>
            <button class="btn btn--secondary" @click="showLeaveModal = true">
              <FileText class="icon-inline" /> Solicitar Permiso
            </button>
            <router-link to="/certificates" class="btn btn--secondary">
              <Download class="icon-inline" /> Constancia QR
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 2: MI EXPEDIENTE DIGITAL -->
    <div v-if="activeTab === 'expediente'">
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">
            <User class="icon-inline" /> Mis Datos Personales y Laborales
          </h3>
        </div>
        <div class="card__body">
          <div class="grid--2">
            <div>
              <p><strong>Nombres Completo:</strong> {{ currentUser.nombres || 'Karina Elizabeth García Méndez' }}</p>
              <p><strong>CUI / DPI:</strong> {{ currentUser.cui_dpi || '550e8400-e29b-41d4-a716-446655440000' }}</p>
              <p><strong>Renglón Presupuestario:</strong> 011 (Personal Permanente)</p>
              <p><strong>Correo Institucional:</strong> {{ currentUser.email || 'kgarcia@scspr.gob.gt' }}</p>
            </div>
            <div>
              <p><strong>Puesto Funcional:</strong> {{ currentUser.puesto_funcional || 'Directora de Recursos Humanos'
                }}</p>
              <p><strong>Unidad Administrativa:</strong> Unidad de Recursos Humanos</p>
              <p><strong>Fecha de Ingreso:</strong> 02 de Enero de 2021</p>
              <p><strong>Contacto Emergencia:</strong> Lic. Carlos García (Esposo - 5555-1234)</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 3: MIS SOLICITUDES & TRÁMITES -->
    <div v-if="activeTab === 'requests'">
      <div class="card">
        <div class="card__header" style="display: flex; justify-content: space-between; align-items: center;">
          <h3 class="card__title">Historial de Mis Solicitudes de Vacaciones y Licencias</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn--sm btn--primary" @click="showVacationModal = true">+ Vacaciones</button>
            <button class="btn btn--sm btn--secondary" @click="showLeaveModal = true">+ Licencia / Permiso</button>
          </div>
        </div>
        <div class="card__body">
          <div v-if="!userVacations.length" class="text-muted" style="text-align: center; padding: 2rem 0;">
            No tienes solicitudes registradas en la plataforma.
          </div>
          <div v-else class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Correlativo</th>
                  <th>Tipo</th>
                  <th>Período</th>
                  <th>Días Hábiles</th>
                  <th>Estado Multietapa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="req in userVacations" :key="req.id">
                  <td>{{ req.correlativo }}</td>
                  <td>Vacaciones</td>
                  <td>{{ req.fecha_inicio }} al {{ req.fecha_fin }}</td>
                  <td>{{ req.dias_solicitados }}</td>
                  <td>
                    <span class="badge badge--warning">{{ req.estado }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 4: MI ASISTENCIA & PUNTUALIDAD -->
    <div v-if="activeTab === 'attendance'">
      <div class="card">
        <div class="card__header" style="display: flex; justify-content: space-between; align-items: center;">
          <h3 class="card__title">
            <CheckCircle2 class="icon-inline" /> Mis Marcajes de Asistencia Biométrica
          </h3>
          <button class="btn btn--sm btn--secondary" @click="showJustifyModal = true">
            <AlertCircle class="icon-inline" /> Justificar Retardo / Omisión
          </button>
        </div>
        <div class="card__body">
          <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 1rem;">
            Registro inmutable sincronizado desde los marcadores biométricos de la SCSPR (Tolerancia: 15 mins sobre
            jornada 08:00 AM).
          </p>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha / Hora</th>
                  <th>Tipo Marca</th>
                  <th>Reloj Biométrico</th>
                  <th>Puntualidad</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="punch in attendanceStore.punches" :key="punch.id">
                  <td>{{ new Date(punch.fecha_hora).toLocaleString('es-GT') }}</td>
                  <td><span class="badge badge--info">{{ punch.tipo_marca }}</span></td>
                  <td>{{ punch.dispositivo_id }}</td>
                  <td>
                    <span class="badge badge--success">
                      <CheckCircle2 class="icon-inline" /> En Tiempo
                    </span>
                  </td>
                </tr>
                <tr v-if="attendanceStore.punches.length === 0">
                  <td colspan="4" style="text-align: center; color: var(--text-muted);">No hay marcajes registrados para
                    tu usuario.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 5: MIS CONSTANCIAS & BOLETAS -->
    <div v-if="activeTab === 'documents'">
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">
            <ShieldCheck class="icon-inline" /> Mis Documentos y Constancias Oficiales
          </h3>
        </div>
        <div class="card__body">
          <div class="card__item adaptive-bar mb-3">
            <div>
              <p class="card__item-title">Constancia Laboral Simple con QR (2026)</p>
              <p class="card__item-subtitle">Autorizada por la URH para trámites bancarios / embajadas</p>
            </div>
            <router-link to="/certificates" class="btn btn--sm btn--secondary">
              <Download class="icon-inline" /> Descargar PDF
            </router-link>
          </div>

          <div v-if="payrollsStore.mySlips.length === 0" class="card__item adaptive-bar">
            <div>
              <p class="card__item-title">Boleta de Pago de Sueldo / Liquidación (Septiembre 2026)</p>
              <p class="card__item-subtitle">Acreditamiento oficial en cuenta bancaria institucional</p>
            </div>
            <span class="badge badge--info">Generada en Cierre</span>
          </div>

          <div
            v-for="slip in payrollsStore.mySlips"
            :key="slip.id"
            class="card__item adaptive-bar mb-2"
          >
            <div>
              <p class="card__item-title">Boleta: {{ slip.correlativo }} ({{ slip.periodo_mes }}/{{ slip.periodo_anio }})</p>
              <p class="card__item-subtitle">
                Líquido Acreditado: Q {{ Number(slip.liquido_a_recibir || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 }) }}
              </p>
            </div>
            <router-link
              v-if="slip.boleta_hash_sha256"
              :to="`/certificates/verifications/${slip.boleta_hash_sha256}`"
              class="btn btn--sm btn--secondary"
              target="_blank"
            >
              <ShieldCheck class="icon-inline" /> Ver Boleta QR
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- MODALES DE AUTOGESTION -->
    <RequestVacationModal :show="showVacationModal" @close="showVacationModal = false" @created="onCreated" />

    <RequestLeaveModal :show="showLeaveModal" @close="showLeaveModal = false" @created="onLeaveCreated" />

    <JustifyIncidentModal :show="showJustifyModal" @close="showJustifyModal = false"
      @submitted="onJustificationSubmitted" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { useVacationsStore } from '../stores/vacations.store';
import { useAttendanceStore } from '../stores/attendance.store';
import { usePayrollsStore } from '../stores/payrolls.store';
import RequestVacationModal from '../components/request-vacation.modal.vue';
import RequestLeaveModal from '../components/request-leave.modal.vue';
import JustifyIncidentModal from '../components/justify-incident.modal.vue';
import {
  LayoutDashboard, User, Clock, CheckCircle2, ShieldCheck, Calendar, FileText,
  Download, AlertCircle
} from 'lucide-vue-next';

const authStore = useAuthStore();
const vacationsStore = useVacationsStore();
const attendanceStore = useAttendanceStore();
const payrollsStore = usePayrollsStore();

const activeTab = ref('overview');
const showVacationModal = ref(false);
const showLeaveModal = ref(false);
const showJustifyModal = ref(false);

const currentUser = computed(() => authStore.user || {});
const userInitial = computed(() => (currentUser.value.nombres?.[0] || 'C').toUpperCase());
const userVacations = computed(() => vacationsStore.requests || []);

onMounted(async () => {
  await vacationsStore.fetchRequests();
  await payrollsStore.fetchMySlips();
  if (currentUser.value.id) {
    await attendanceStore.fetchPunches(currentUser.value.id);
  }
});

function onCreated() {
  alert('Solicitud de vacaciones enviada exitosamente a tu jefe inmediato.');
}

function onLeaveCreated(data) {
  alert(`Solicitud de ${data.tipo_licencia} registrada exitosamente.`);
}

function onJustificationSubmitted(data) {
  alert('Justificación de incidencia enviada a revisión de tu jefatura.');
}
</script>

<style scoped>
.page-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
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
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 0.875rem;
}

.tab-btn:hover {
  color: var(--color-primary-800);
}

.tab-btn--active {
  color: var(--color-primary-900);
  border-bottom-color: var(--color-gold-500);
}

.icon-inline {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
}

/* Portal Hero Card */
.portal-hero {
  background: linear-gradient(135deg, var(--color-primary-900), var(--color-primary-800));
  color: var(--text-white);
  border: none;
}

.portal-hero__body {
  padding: 1.5rem;
}

.portal-hero__user {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.portal-hero__title {
  color: #ffffff;
  font-size: 1.4rem;
  margin: 0;
  line-height: 1.2;
}

.portal-hero__sub {
  opacity: 0.9;
  font-size: 0.875rem;
  margin-top: 0.35rem;
  margin-bottom: 0;
}

.portal-hero__btn-vacation {
  background: var(--color-gold-500);
  color: #000;
  font-weight: 600;
  border: none;
}

.portal-hero__btn-vacation:hover {
  background: var(--color-gold-400);
}

.portal-hero__btn-leave {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.portal-hero__btn-leave:hover {
  background: rgba(255, 255, 255, 0.28);
}

@media (max-width: 599px) {
  .portal-hero__user {
    width: 100%;
    gap: 0.875rem;
  }

  .portal-hero__title {
    font-size: 1.125rem;
    word-break: break-word;
  }

  .portal-hero__sub {
    font-size: 0.775rem;
  }
}
</style>
