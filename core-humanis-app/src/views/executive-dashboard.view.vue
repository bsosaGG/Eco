<template>
  <div class="executive-dashboard-view">
    <!-- Header -->
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Cuadro de Mando Ejecutivo & Transparencia LAIP</h2>
          <p class="text-muted text-sm mt-1">
            Indicadores de gestión de talento, masa salarial mensual, pasivo contingente y cumplimiento del Art. 10 Num. 4.
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--secondary" @click="downloadCsv">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar LAIP Art. 10 (CSV)
          </button>
          <button class="btn btn--primary" @click="toggleLaipTable">
            {{ showLaip ? 'Ocultar Matriz LAIP' : 'Ver Matriz LAIP' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TARJETAS SUPERIORES DE KPI -->
    <div v-if="dashboard" class="grid--4 mb-4">
      <div class="metric-card">
        <div class="metric-card__title">Total Colaboradores</div>
        <div class="metric-card__value">{{ dashboard.generales.total_colaboradores }}</div>
        <div class="metric-card__subtitle text-success">
          ● {{ dashboard.generales.activos }} activos ({{ dashboard.generales.mujeres }}M / {{ dashboard.generales.hombres }}H)
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-card__title">Masa Salarial Mensual</div>
        <div class="metric-card__value">Q{{ formatNumber(dashboard.masa_salarial.total_mensual_estimada) }}</div>
        <div class="metric-card__subtitle text-muted">
          011/022: Q{{ formatNumber(dashboard.masa_salarial.planilla_permanente_011_022) }} | 029: Q{{ formatNumber(dashboard.masa_salarial.servicios_profesionales_029) }}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-card__title">Pasivo Vacaciones</div>
        <div class="metric-card__value">Q{{ formatNumber(dashboard.pasivo_vacaciones.monto_estimado_quetzales) }}</div>
        <div class="metric-card__subtitle text-warning">
          {{ dashboard.pasivo_vacaciones.dias_acumulados }} días acumulados en Kardex
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-card__title">Finiquitos CGC</div>
        <div class="metric-card__value text-success">
          {{ dashboard.semaforo_cgc.vigentes }} <span class="text-sm text-muted">Vigentes</span>
        </div>
        <div class="metric-card__subtitle">
          <span class="text-warning">● {{ dashboard.semaforo_cgc.advertencia }} en alerta</span> &nbsp;
          <span class="text-danger">● {{ dashboard.semaforo_cgc.vencidos }} vencidos</span>
        </div>
      </div>
    </div>

    <!-- SEGUNDA FILA: TALENTO OLA 4 & DISTRIBUCIÓN DE RENGLONES -->
    <div v-if="dashboard" class="grid--2 mb-4">
      <!-- Distribución por Renglón -->
      <div class="card">
        <div class="card__header">
          <h4 class="font-heading">Distribución Salarial por Renglón Presupuestario</h4>
        </div>
        <div class="card__body">
          <div v-for="r in dashboard.masa_salarial.distribucion_renglones" :key="r.codigo" class="mb-3">
            <div class="d-flex justify-between align-center mb-1">
              <span class="text-bold text-sm">Renglón {{ r.codigo }} - {{ r.nombre }}</span>
              <span class="badge badge--neutral">{{ r.cantidad }} personas (Q{{ formatNumber(r.masa_total) }})</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-bar__fill progress-bar__fill--primary"
                :style="{ width: getPercentage(r.masa_total, dashboard.masa_salarial.total_mensual_estimada) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pirámide Demográfica y Talento Ola 4 -->
      <div class="card">
        <div class="card__header">
          <h4 class="font-heading">Talento Humano & Pirámide Etaria</h4>
        </div>
        <div class="card__body">
          <div class="grid--3 mb-4">
            <div class="metric-card">
              <div class="metric-card__title">Convocatorias</div>
              <div class="metric-card__value">{{ dashboard.talento_ola4.convocatorias.total_convocatorias }}</div>
              <div class="metric-card__subtitle text-info">{{ dashboard.talento_ola4.convocatorias.activas }} publicadas</div>
            </div>
            <div class="metric-card">
              <div class="metric-card__title">Postulantes</div>
              <div class="metric-card__value">{{ dashboard.talento_ola4.postulaciones.total_postulaciones }}</div>
              <div class="metric-card__subtitle text-warning">{{ dashboard.talento_ola4.postulaciones.preseleccionados_terna }} en terna</div>
            </div>
            <div class="metric-card">
              <div class="metric-card__title">Promedio Desempeño</div>
              <div class="metric-card__value">{{ dashboard.talento_ola4.evaluaciones.promedio_institucional }}</div>
              <div class="metric-card__subtitle text-muted">pts / 100</div>
            </div>
          </div>

          <h5 class="font-heading mb-2">Composición Etaria y Género</h5>
          <div v-for="p in dashboard.piramide_demografica" :key="p.rango_edad" class="mb-2">
            <div class="d-flex justify-between align-center mb-1">
              <span class="text-sm text-bold">{{ p.rango_edad }}</span>
              <span class="text-muted text-sm">{{ p.mujeres }} Mujeres / {{ p.hombres }} Hombres (Total: {{ p.total }})</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-bar__fill progress-bar__fill--info"
                :style="{ width: getPercentage(p.total, dashboard.generales.total_colaboradores) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN TRANSPARENCIA LAIP ART. 10 NUMERAL 4 (SI ACTIVA) -->
    <div v-if="showLaip" class="card mb-4">
      <div class="card__header adaptive-bar">
        <div>
          <h4 class="font-heading">Ley de Acceso a la Información Pública (LAIP Art. 10 Numeral 4)</h4>
          <span class="text-muted text-sm">
            Nómina institucional completa de remuneraciones, honorarios, bonificaciones y dietas.
          </span>
        </div>
        <div class="adaptive-bar__actions">
          <span class="badge badge--success">{{ laipRecords.length }} registros procesados</span>
        </div>
      </div>
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">No.</th>
                <th class="data-table__th">Renglón</th>
                <th class="data-table__th">Servidor Público</th>
                <th class="data-table__th">Cargo Nominal</th>
                <th class="data-table__th">Puesto Funcional</th>
                <th class="data-table__th">Sueldo / Honorarios</th>
                <th class="data-table__th">Bono Incentivo</th>
                <th class="data-table__th">Bono Prof.</th>
                <th class="data-table__th">Total Devengado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in laipRecords" :key="r.correlativo_linea" class="data-table__row">
                <td class="data-table__td">{{ r.correlativo_linea }}</td>
                <td class="data-table__td">
                  <span class="badge badge--neutral">{{ r.renglon_presupuestario }}</span>
                </td>
                <td class="data-table__td text-bold">{{ r.nombre_servidor }}</td>
                <td class="data-table__td text-sm">{{ r.cargo_nominal }}</td>
                <td class="data-table__td text-sm">{{ r.puesto_funcional }}</td>
                <td class="data-table__td text-right">Q{{ formatNumber(r.sueldo_base_u_honorarios) }}</td>
                <td class="data-table__td text-right">Q{{ formatNumber(r.bonificacion_incentivo) }}</td>
                <td class="data-table__td text-right">Q{{ formatNumber(r.bonificacion_profesional) }}</td>
                <td class="data-table__td text-right text-bold text-success">Q{{ formatNumber(r.total_ingreso_devengado) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAnalyticsStore } from '../stores/analytics.store';

const store = useAnalyticsStore();
const showLaip = ref(false);

const dashboard = computed(() => store.dashboard);
const laipRecords = computed(() => store.laipReport?.data || []);

onMounted(async () => {
  await store.fetchDashboard();
});

const formatNumber = (val) => {
  if (!val) return '0.00';
  return Number(val).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getPercentage = (val, total) => {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((Number(val) / Number(total)) * 100));
};

const toggleLaipTable = async () => {
  showLaip.value = !showLaip.value;
  if (showLaip.value && !store.laipReport) {
    await store.fetchLaipReport();
  }
};

const downloadCsv = async () => {
  await store.downloadLaipCsv();
};
</script>
