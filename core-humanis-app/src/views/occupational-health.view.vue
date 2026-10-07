<template>
  <div class="occupational-health-view">
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Salud y Seguridad Ocupacional (SSO) & Clínica Médica</h2>
          <p class="text-muted text-sm mt-1">
            Gestión del Comité Bipartito, Libro Oficial de Accidentes y Registro de Consultas de la Dra. Institucional (Acuerdos 229-2014 y 33-2016).
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--secondary mr-2" @click="openConsultationModal">
            🩺 Nueva Consulta Médica
          </button>
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
          <span class="text-muted text-sm">Consultas Médicas Atendidas</span>
          <h3 class="font-heading mt-1 text-primary">{{ store.consultations.length || 0 }}</h3>
          <span class="text-xs text-muted">Registro Clínico Dra. SCSPR</span>
        </div>
      </div>
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
          <span class="text-muted text-sm">Total Eventos Accidentes</span>
          <h3 class="font-heading mt-1">{{ store.metrics.totalIncidents || 0 }}</h3>
        </div>
      </div>
    </div>

    <!-- PESTAÑAS DE VISTA -->
    <div class="tabs-nav mb-4">
      <button class="tabs-nav__btn" :class="{ 'tabs-nav__btn--active': activeTab === 'consultations' }" @click="activeTab = 'consultations'">
        🩺 Consultas Médicas (Dra.)
      </button>
      <button class="tabs-nav__btn" :class="{ 'tabs-nav__btn--active': activeTab === 'incidents' }" @click="activeTab = 'incidents'">
        Libro Oficial de Accidentes
      </button>
      <button class="tabs-nav__btn" :class="{ 'tabs-nav__btn--active': activeTab === 'committee' }" @click="activeTab = 'committee'">
        Comité Bipartito SSO (MINTRAB)
      </button>
    </div>

    <!-- TAB 1: CONSULTAS MÉDICAS (DRA.) -->
    <div v-if="activeTab === 'consultations'" class="card">
      <div class="card__header d-flex justify-between align-center">
        <h4 class="font-heading">Registro de Consultas de Clínica Médica SCSPR</h4>
        <span class="badge badge--info">{{ store.consultations.length }} atenciones</span>
      </div>
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">Fecha / Hora</th>
                <th class="data-table__th">Colaborador / Paciente</th>
                <th class="data-table__th">Unidad Administrativa</th>
                <th class="data-table__th">Motivo de Consulta</th>
                <th class="data-table__th">Diagnóstico</th>
                <th class="data-table__th">Signos Vitales</th>
                <th class="data-table__th">Reposo / IGSS</th>
                <th class="data-table__th">Atendido Por</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.consultations.length">
                <td colspan="8" class="data-table__td text-center text-muted">
                  No hay consultas médicas registradas aún.
                </td>
              </tr>
              <tr v-for="c in store.consultations" :key="c.id" class="data-table__row">
                <td class="data-table__td text-bold">{{ formatDate(c.fecha_consulta) }}</td>
                <td class="data-table__td">
                  <div class="text-bold">{{ c.primer_nombre }} {{ c.primer_apellido }}</div>
                  <div class="text-xs text-muted">CUI: {{ c.cui_dpi }}</div>
                </td>
                <td class="data-table__td text-sm">{{ c.unidad_nombre || 'SCSPR' }}</td>
                <td class="data-table__td">{{ c.motivo_consulta }}</td>
                <td class="data-table__td text-bold text-primary">{{ c.diagnostico }}</td>
                <td class="data-table__td text-xs">
                  <span v-if="c.signos_vitales">
                    PA: <strong>{{ c.signos_vitales.presion || '-' }}</strong> | Temp: <strong>{{ c.signos_vitales.temperatura || '-' }}</strong>
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="data-table__td">
                  <span v-if="c.genera_reposo" class="badge badge--warning">
                    ⚠️ Reposo ({{ c.dias_reposo }}d)
                  </span>
                  <span v-else-if="c.remite_igss" class="badge badge--danger">
                    🏥 Remitido IGSS
                  </span>
                  <span v-else class="badge badge--success">
                    ✓ De Alta
                  </span>
                </td>
                <td class="data-table__td text-xs text-muted">{{ c.doctora_nombre }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación Adaptativa de Consultas Médicas -->
        <div v-if="store.pagination.totalPages > 1" class="d-flex justify-between align-center mt-3 pt-3 border-top">
          <span class="text-xs text-muted">
            Mostrando página {{ store.pagination.page }} de {{ store.pagination.totalPages }} (Total: {{ store.pagination.total }} atenciones)
          </span>
          <div class="d-flex gap-2">
            <button
              class="btn btn--secondary btn--sm"
              :disabled="store.pagination.page <= 1"
              @click="changeConsultationPage(store.pagination.page - 1)"
            >
              ← Anterior
            </button>
            <button
              class="btn btn--secondary btn--sm"
              :disabled="store.pagination.page >= store.pagination.totalPages"
              @click="changeConsultationPage(store.pagination.page + 1)"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: LIBRO OFICIAL DE ACCIDENTES -->
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
                <td class="data-table__td">{{ formatDateTime(inc.fecha_hora_evento) }}</td>
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

    <!-- TAB 3: COMITE BIPARTITO SSO -->
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
                <td class="data-table__td">{{ formatDate(m.fecha_acreditacion) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL REGISTRO DE CONSULTA MÉDICA (DRA.) -->
    <div v-if="showConsultationModal" class="modal__overlay" @click.self="showConsultationModal = false">
      <div class="modal__content" style="max-width: 650px;">
        <div class="modal__header">
          <h4 class="font-heading">🩺 Registrar Consulta Médica (Dra. SCSPR)</h4>
          <button class="btn-close" @click="showConsultationModal = false">✕</button>
        </div>
        <div class="modal__body">
          <form @submit.prevent="handleSaveConsultation">
            <div class="form-group">
              <label class="form-group__label">Colaborador / Paciente *</label>
              <select v-model="consultationForm.persona_id" class="form-group__control" required>
                <option value="" disabled>-- Seleccione Colaborador --</option>
                <option v-for="col in colaboradores" :key="col.id" :value="col.id">
                  {{ col.primer_nombre }} {{ col.segundo_nombre || '' }} {{ col.primer_apellido }} {{ col.segundo_apellido || '' }} (CUI: {{ col.cui_dpi }})
                </option>
              </select>
            </div>

            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Doctora Atendiente</label>
                <input v-model="consultationForm.doctora_nombre" class="form-group__control" required />
              </div>
              <div class="form-group">
                <label class="form-group__label">Presión Arterial (P.A.)</label>
                <input v-model="consultationForm.signos_vitales.presion" class="form-group__control" placeholder="Ej: 120/80 mmHg" />
              </div>
            </div>

            <div class="grid--3">
              <div class="form-group">
                <label class="form-group__label">Temperatura (°C)</label>
                <input v-model="consultationForm.signos_vitales.temperatura" class="form-group__control" placeholder="Ej: 36.6 °C" />
              </div>
              <div class="form-group">
                <label class="form-group__label">Pulso (BPM)</label>
                <input v-model="consultationForm.signos_vitales.pulso" class="form-group__control" placeholder="Ej: 75 bpm" />
              </div>
              <div class="form-group">
                <label class="form-group__label">Peso (kg/lbs)</label>
                <input v-model="consultationForm.signos_vitales.peso" class="form-group__control" placeholder="Ej: 70 kg" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-group__label">Motivo de Consulta (Síntomas) *</label>
              <input v-model="consultationForm.motivo_consulta" class="form-group__control" placeholder="Ej: Dolor de cabeza, mareo, chequeo preventivo..." required />
            </div>

            <div class="form-group">
              <label class="form-group__label">Diagnóstico Clínico *</label>
              <textarea v-model="consultationForm.diagnostico" class="form-group__control" rows="2" placeholder="Diagnóstico o evaluación de la Dra..." required></textarea>
            </div>

            <div class="form-group">
              <label class="form-group__label">Tratamiento / Medicamentos Indicados</label>
              <textarea v-model="consultationForm.tratamiento_indicado" class="form-group__control" rows="2" placeholder="Prescripción y recomendaciones..."></textarea>
            </div>

            <div class="grid--2" style="background: #F9FAFB; padding: 0.875rem; border-radius: 6px; margin-bottom: 1rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="d-flex align-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="consultationForm.genera_reposo" />
                  <strong>¿Genera Reposo / Licencia Médica?</strong>
                </label>
                <input v-if="consultationForm.genera_reposo" v-model.number="consultationForm.dias_reposo" type="number" min="1" class="form-group__control mt-2" placeholder="Número de días" />
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="d-flex align-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="consultationForm.remite_igss" />
                  <strong>¿Remite a Consulta Externa IGSS?</strong>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-group__label">Observaciones Adicionales</label>
              <input v-model="consultationForm.observaciones" class="form-group__control" placeholder="Notas adicionales..." />
            </div>

            <div class="d-flex justify-end gap-2 mt-4">
              <button type="button" class="btn btn--secondary" @click="showConsultationModal = false">Cancelar</button>
              <button type="submit" class="btn btn--primary" :disabled="saving">
                {{ saving ? 'Guardando...' : 'Registrar Consulta Médica' }}
              </button>
            </div>
          </form>
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
import { ref, computed, onMounted } from "vue";
import { useOccupationalHealthStore } from "../stores/occupational-health.store";
import { useCollaboratorsStore } from "../stores/collaborators.store";
import { useToast } from "../composables/useToast";
import { formatDate, formatDateTime } from "../utils/date";

const store = useOccupationalHealthStore();
const colabStore = useCollaboratorsStore();
const toast = useToast();

const activeTab = ref("consultations");
const showIncidentModal = ref(false);
const showConsultationModal = ref(false);
const saving = ref(false);

const colaboradores = computed(() => colabStore.colaboradores);

const consultationForm = ref({
  persona_id: "",
  doctora_nombre: "Dra. Claudia Ramos - SCSPR",
  motivo_consulta: "",
  diagnostico: "",
  signos_vitales: { presion: "", temperatura: "", pulso: "", peso: "" },
  tratamiento_indicado: "",
  genera_reposo: false,
  dias_reposo: 1,
  remite_igss: false,
  observaciones: "",
});

const incidentForm = ref({
  tipo_evento: "ACCIDENTE_SIN_BAJA",
  fecha_hora_evento: "",
  lugar_exacto: "",
  descripcion_hechos: "",
  medidas_correctivas: "",
  dias_incapacidad_estimados: 0,
});

function openConsultationModal() {
  consultationForm.value = {
    persona_id: "",
    doctora_nombre: "Dra. Claudia Ramos - SCSPR",
    motivo_consulta: "",
    diagnostico: "",
    signos_vitales: { presion: "", temperatura: "", pulso: "", peso: "" },
    tratamiento_indicado: "",
    genera_reposo: false,
    dias_reposo: 1,
    remite_igss: false,
    observaciones: "",
  };
  showConsultationModal.value = true;
}

async function handleSaveConsultation() {
  saving.value = true;
  try {
    await store.createConsultation(consultationForm.value);
    showConsultationModal.value = false;
    toast.success("Consulta médica registrada exitosamente");
  } catch (err) {
    toast.error("Error al registrar consulta médica: " + (err.response?.data?.message || err.message));
  } finally {
    saving.value = false;
  }
}

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
    toast.success("Evento asentado en Libro Oficial correctamente");
  } catch (err) {
    toast.error("Error al asentar evento: " + (err.response?.data?.message || err.message));
  } finally {
    saving.value = false;
  }
}


function getEventTypeBadge(tipo) {
  switch (tipo) {
    case "ACCIDENTE_CON_BAJA": return "badge--danger";
    case "ACCIDENTE_SIN_BAJA": return "badge--warning";
    case "INCIDENTE_PELIGROSO": return "badge--info";
    default: return "badge--neutral";
  }
}

function changeConsultationPage(newPage) {
  if (newPage >= 1 && newPage <= store.pagination.totalPages) {
    store.fetchConsultations({ page: newPage });
  }
}

onMounted(() => {
  store.fetchConsultations();
  store.fetchIncidents();
  store.fetchCommittee();
  colabStore.fetchColaboradores();
});
</script>

<style scoped>
.grid--3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .grid--3 {
    grid-template-columns: 1fr;
  }
}
</style>
