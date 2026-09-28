<template>
  <div class="occupational-health-view">
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Salud y Seguridad Ocupacional (SSO)</h2>
          <p class="text-muted text-sm mt-1">
            Gestión del Comité Bipartito y Libro Oficial de Accidentes de Trabajo según Acuerdos Gubernativos 229-2014 y 33-2016.
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--primary" @click="openIncidentModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            Asentar en Libro de Accidentes
          </button>
        </div>
      </div>
    </div>

    <!-- INDICADORES LEGALES AG 229-2014 -->
    <div class="grid-adaptive mb-4">
      <div class="card">
        <div class="card__body">
          <span class="text-muted text-sm">Tasa de Frecuencia (IF)</span>
          <h3 class="font-heading mt-1">{{ store.metrics.frequencyRate || 0 }}</h3>
          <span class="text-xs text-muted">Accidentes con baja x 1M / H-H</span>
        </div>
      </div>
      <div class="card">
        <div class="card__body">
          <span class="text-muted text-sm">Tasa de Gravedad (IG)</span>
          <h3 class="font-heading mt-1">{{ store.metrics.severityRate || 0 }}</h3>
          <span class="text-xs text-muted">Días perdidos x 1,000 / H-H</span>
        </div>
      </div>
      <div class="card">
        <div class="card__body">
          <span class="text-muted text-sm">Días de Incapacidad Estimados</span>
          <h3 class="font-heading mt-1 text-primary">{{ store.metrics.totalLostDays || 0 }} días</h3>
        </div>
      </div>
      <div class="card">
        <div class="card__body">
          <span class="text-muted text-sm">Total de Eventos Registrados</span>
          <h3 class="font-heading mt-1">{{ store.metrics.totalIncidents || 0 }}</h3>
        </div>
      </div>
    </div>

    <!-- PESTAÑAS DE VISTA -->
    <div class="tabs-nav mb-4">
      <button class="tabs-nav__item" :class="{ 'tabs-nav__item--active': activeTab === 'incidents' }" @click="activeTab = 'incidents'">
        Libro Oficial de Accidentes
      </button>
      <button class="tabs-nav__item" :class="{ 'tabs-nav__item--active': activeTab === 'committee' }" @click="activeTab = 'committee'">
        Comité Bipartito SSO (MINTRAB)
      </button>
    </div>

    <!-- TAB 1: LIBRO OFICIAL DE ACCIDENTES -->
    <div v-if="activeTab === 'incidents'" class="card">
      <div class="card__header d-flex justify-between align-center">
        <h4 class="font-heading">Asientos del Libro Oficial</h4>
        <span class="badge badge--info">{{ store.incidents.length }} registros</span>
      </div>
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">Correlativo</th>
                <th class="data-table__th">Fecha / Hora</th>
                <th class="data-table__th">Tipo de Evento</th>
                <th class="data-table__th">Persona Afectada</th>
                <th class="data-table__th">Lugar del Hecho</th>
                <th class="data-table__th">Días Baja</th>
                <th class="data-table__th">Medidas Correctivas</th>
                <th class="data-table__th">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.incidents.length">
                <td colspan="8" class="data-table__td text-center text-muted">
                  No hay eventos registrados en el Libro Oficial de Accidentes.
                </td>
              </tr>
              <tr v-for="inc in store.incidents" :key="inc.id" class="data-table__row">
                <td class="data-table__td text-bold">{{ inc.correlativo }}</td>
                <td class="data-table__td">{{ formatDate(inc.fecha_hora_evento) }}</td>
                <td class="data-table__td">
                  <span class="badge" :class="getEventTypeBadge(inc.tipo_evento)">
                    {{ inc.tipo_evento }}
                  </span>
                </td>
                <td class="data-table__td">
                  {{ inc.primer_nombre ? inc.primer_nombre + ' ' + inc.primer_apellido : 'No especificado' }}
                </td>
                <td class="data-table__td">{{ inc.lugar_exacto }}</td>
                <td class="data-table__td text-bold">{{ inc.dias_incapacidad_estimados || 0 }} d</td>
                <td class="data-table__td text-sm">{{ inc.medidas_correctivas }}</td>
                <td class="data-table__td">
                  <span class="badge badge--neutral">{{ inc.estado }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: COMITE BIPARTITO SSO -->
    <div v-if="activeTab === 'committee'" class="card">
      <div class="card__header d-flex justify-between align-center">
        <div>
          <h4 class="font-heading">{{ store.committee?.nombre_comite || 'Comité Bipartito SSO SCSPR' }}</h4>
          <span class="text-muted text-sm">Registro MINTRAB: {{ store.committee?.numero_registro_mintrab || 'En Trámite' }}</span>
        </div>
        <span class="badge badge--success">{{ store.committee?.estado || 'VIGENTE' }}</span>
      </div>
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">Representación</th>
                <th class="data-table__th">Tipo</th>
                <th class="data-table__th">Cargo en Comité</th>
                <th class="data-table__th">Nombre del Miembro</th>
                <th class="data-table__th">CUI / DPI</th>
                <th class="data-table__th">Puesto Institucional</th>
                <th class="data-table__th">Acreditación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.committeeMembers.length">
                <td colspan="7" class="data-table__td text-center text-muted">
                  No hay miembros registrados en el comité vigente.
                </td>
              </tr>
              <tr v-for="m in store.committeeMembers" :key="m.id" class="data-table__row">
                <td class="data-table__td">
                  <span class="badge" :class="m.representacion === 'PATRONAL' ? 'badge--info' : 'badge--warning'">
                    {{ m.representacion }}
                  </span>
                </td>
                <td class="data-table__td">{{ m.tipo_miembro }}</td>
                <td class="data-table__td text-bold">{{ m.cargo_comite }}</td>
                <td class="data-table__td">{{ m.primer_nombre }} {{ m.primer_apellido }}</td>
                <td class="data-table__td font-mono">{{ m.cui_dpi }}</td>
                <td class="data-table__td">{{ m.puesto_nominal || 'Servidor Público' }}</td>
                <td class="data-table__td">{{ m.fecha_acreditacion?.split('T')[0] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL REGISTRO DE ACCIDENTE / INCIDENTE -->
    <div v-if="showIncidentModal" class="modal__overlay" @click.self="showIncidentModal = false">
      <div class="modal__content">
        <div class="modal__header">
          <h4 class="font-heading">Asentar Evento en Libro Oficial (AG 229-2014)</h4>
          <button class="btn-close" @click="showIncidentModal = false">✕</button>
        </div>
        <div class="modal__body">
          <form @submit.prevent="handleSaveIncident">
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Tipo de Evento</label>
                <select v-model="incidentForm.tipo_evento" class="form-group__control" required>
                  <option value="ACCIDENTE_SIN_BAJA">Accidente sin baja médica</option>
                  <option value="ACCIDENTE_CON_BAJA">Accidente con baja médica (Incapacidad)</option>
                  <option value="INCIDENTE_PELIGROSO">Incidente peligroso / Casi accidente</option>
                  <option value="ENFERMEDAD_OCUPACIONAL">Sospecha de enfermedad ocupacional</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-group__label">Fecha y Hora del Evento</label>
                <input v-model="incidentForm.fecha_hora_evento" type="datetime-local" class="form-group__control" required />
              </div>
            </div>
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Lugar Exacto en Sede SCSPR</label>
                <input v-model="incidentForm.lugar_exacto" class="form-group__control" placeholder="Ej: Edificio Central, Nivel 3, Cocineta" required />
              </div>
              <div class="form-group">
                <label class="form-group__label">Días Estimados de Incapacidad</label>
                <input v-model.number="incidentForm.dias_incapacidad_estimados" type="number" min="0" class="form-group__control" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-group__label">Descripción Pormenorizada de los Hechos</label>
              <textarea v-model="incidentForm.descripcion_hechos" class="form-group__control" rows="2" placeholder="Detalle circunstancial del incidente..." required></textarea>
            </div>
            <div class="form-group">
              <label class="form-group__label">Medidas Correctivas y Preventivas Inmediatas</label>
              <textarea v-model="incidentForm.medidas_correctivas" class="form-group__control" rows="2" placeholder="Acciones tomadas para mitigar el riesgo..." required></textarea>
            </div>
            <div class="d-flex justify-end gap-2 mt-4">
              <button type="button" class="btn btn--secondary" @click="showIncidentModal = false">Cancelar</button>
              <button type="submit" class="btn btn--primary" :disabled="saving">
                {{ saving ? 'Asentando...' : 'Asentar en Libro Oficial' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useOccupationalHealthStore } from "../stores/occupational-health.store";

const store = useOccupationalHealthStore();
const activeTab = ref("incidents");
const showIncidentModal = ref(false);
const saving = ref(false);

const incidentForm = ref({
  tipo_evento: "ACCIDENTE_SIN_BAJA",
  fecha_hora_evento: "",
  lugar_exacto: "",
  descripcion_hechos: "",
  medidas_correctivas: "",
  dias_incapacidad_estimados: 0,
});

function openIncidentModal() {
  incidentForm.value = {
    tipo_evento: "ACCIDENTE_SIN_BAJA",
    fecha_hora_evento: new Date().toISOString().slice(0, 16),
    lugar_exacto: "",
    descripcion_hechos: "",
    medidas_correctivas: "",
    dias_incapacidad_estimados: 0,
  };
  showIncidentModal.value = true;
}

async function handleSaveIncident() {
  saving.value = true;
  try {
    await store.createIncident(incidentForm.value);
    showIncidentModal.value = false;
  } catch (err) {
    alert("Error al asentar evento: " + (err.response?.data?.message || err.message));
  } finally {
    saving.value = false;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" });
}

function getEventTypeBadge(tipo) {
  switch (tipo) {
    case "ACCIDENTE_CON_BAJA": return "badge--danger";
    case "ACCIDENTE_SIN_BAJA": return "badge--warning";
    case "INCIDENTE_PELIGROSO": return "badge--info";
    default: return "badge--neutral";
  }
}

onMounted(() => {
  store.fetchIncidents();
  store.fetchCommittee();
});
</script>
