<template>
  <div class="trainings-view">
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Plan Anual de Capacitación (PAC) y Desarrollo</h2>
          <p class="text-muted text-sm mt-1">
            Gestión de formación continua, acreditación de horas lectivas y emisión de certificados digitales institucionales.
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--primary" @click="openCreateModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nuevo Curso PAC
          </button>
        </div>
      </div>
    </div>

    <!-- METRICAS RESUMIDAS -->
    <div class="grid-adaptive mb-4">
      <div class="card">
        <div class="card__body">
          <span class="text-muted text-sm">Cursos en Catálogo</span>
          <h3 class="font-heading mt-1">{{ store.trainings.length }}</h3>
        </div>
      </div>
      <div class="card">
        <div class="card__body">
          <span class="text-muted text-sm">Horas Formativas PAC</span>
          <h3 class="font-heading mt-1 text-primary">{{ totalHoursCatalog }} hrs</h3>
        </div>
      </div>
      <div class="card">
        <div class="card__body">
          <span class="text-muted text-sm">Total Participantes Inscritos</span>
          <h3 class="font-heading mt-1">{{ totalEnrolled }}</h3>
        </div>
      </div>
    </div>

    <!-- TABLA DE CURSOS -->
    <div class="card">
      <div class="card__header d-flex justify-between align-center">
        <h4 class="font-heading">Catálogo de Capacitaciones</h4>
        <span class="badge badge--info">{{ store.trainings.length }} programas</span>
      </div>
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">Código</th>
                <th class="data-table__th">Título del Programa</th>
                <th class="data-table__th">Área Temática</th>
                <th class="data-table__th">Modalidad</th>
                <th class="data-table__th">Horas</th>
                <th class="data-table__th">Facilitador</th>
                <th class="data-table__th">Inscritos</th>
                <th class="data-table__th">Estado</th>
                <th class="data-table__th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.trainings.length">
                <td colspan="9" class="data-table__td text-center text-muted">
                  No hay programas de capacitación registrados en el PAC.
                </td>
              </tr>
              <tr v-for="t in store.trainings" :key="t.id" class="data-table__row">
                <td class="data-table__td text-bold">{{ t.codigo_curso }}</td>
                <td class="data-table__td">{{ t.titulo }}</td>
                <td class="data-table__td">
                  <span class="badge badge--neutral">{{ t.area_tematica }}</span>
                </td>
                <td class="data-table__td">{{ t.modalidad }}</td>
                <td class="data-table__td text-bold">{{ t.horas_lectivas }}h</td>
                <td class="data-table__td">{{ t.entidad_facilitadora }}</td>
                <td class="data-table__td">{{ t.total_inscritos || 0 }} / {{ t.cupo_maximo }}</td>
                <td class="data-table__td">
                  <span class="badge" :class="getStatusBadge(t.estado)">
                    {{ t.estado }}
                  </span>
                </td>
                <td class="data-table__td">
                  <button class="btn btn--sm btn--secondary" @click="viewTrainingDetail(t.id)">
                    Ver Grupo
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVO CURSO PAC -->
    <div v-if="showModal" class="modal__overlay" @click.self="showModal = false">
      <div class="modal__content">
        <div class="modal__header">
          <h4 class="font-heading">Registrar Curso en el PAC</h4>
          <button class="btn-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal__body">
          <form @submit.prevent="handleSaveTraining">
            <div class="form-group">
              <label class="form-group__label">Título de la Capacitación</label>
              <input v-model="form.titulo" class="form-group__control" placeholder="Ej: Gestión Pública y Ética Gubernamental" required />
            </div>
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Área Temática</label>
                <select v-model="form.area_tematica" class="form-group__control" required>
                  <option value="TECNICA">Técnica y Funcional</option>
                  <option value="GESTION_PUBLICA">Gestión Pública e INAP</option>
                  <option value="HABILIDADES_BLANDAS">Habilidades Blandas</option>
                  <option value="ETICA_TRANSPARENCIA">Ética y Transparencia LAIP</option>
                  <option value="SALUD_SEGURIDAD_SSO">Salud y Seguridad SSO (AG 229-2014)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-group__label">Modalidad</label>
                <select v-model="form.modalidad" class="form-group__control">
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="VIRTUAL">Virtual / En Línea</option>
                  <option value="HIBRIDA">Híbrida</option>
                </select>
              </div>
            </div>
            <div class="grid--3">
              <div class="form-group">
                <label class="form-group__label">Horas Lectivas</label>
                <input v-model.number="form.horas_lectivas" type="number" min="1" max="200" class="form-group__control" required />
              </div>
              <div class="form-group">
                <label class="form-group__label">Cupo Máximo</label>
                <input v-model.number="form.cupo_maximo" type="number" min="5" max="200" class="form-group__control" />
              </div>
              <div class="form-group">
                <label class="form-group__label">Entidad Facilitadora</label>
                <input v-model="form.entidad_facilitadora" class="form-group__control" placeholder="Ej: INAP / IGSS / SCSPR" required />
              </div>
            </div>
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Fecha de Inicio</label>
                <input v-model="form.fecha_inicio" type="date" class="form-group__control" required />
              </div>
              <div class="form-group">
                <label class="form-group__label">Fecha de Finalización</label>
                <input v-model="form.fecha_fin" type="date" class="form-group__control" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-group__label">Objetivo de la Formación</label>
              <textarea v-model="form.objetivo_capacitacion" class="form-group__control" rows="2" placeholder="Competencias esperadas..."></textarea>
            </div>
            <div class="d-flex justify-end gap-2 mt-4">
              <button type="button" class="btn btn--secondary" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn btn--primary" :disabled="saving">
                {{ saving ? 'Guardando...' : 'Crear Programa' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE DE GRUPO Y PARTICIPANTES -->
    <div v-if="showDetailModal && selectedCourse" class="modal__overlay" @click.self="showDetailModal = false">
      <div class="modal__content modal__content--lg">
        <div class="modal__header">
          <div>
            <h4 class="font-heading">{{ selectedCourse.titulo }}</h4>
            <span class="text-muted text-sm">{{ selectedCourse.codigo_curso }} • {{ selectedCourse.horas_lectivas }} horas lectivas</span>
          </div>
          <button class="btn-close" @click="showDetailModal = false">✕</button>
        </div>
        <div class="modal__body">
          <div class="d-flex justify-between align-center mb-3">
            <h5 class="font-heading">Participantes Inscritos</h5>
            <span class="badge badge--info">{{ selectedCourse.participantes?.length || 0 }} participantes</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="data-table__th">Colaborador</th>
                  <th class="data-table__th">Renglón</th>
                  <th class="data-table__th">Origen</th>
                  <th class="data-table__th">Nota Final</th>
                  <th class="data-table__th">Asistencia</th>
                  <th class="data-table__th">Estado</th>
                  <th class="data-table__th">Diploma SHA-256</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!selectedCourse.participantes?.length">
                  <td colspan="7" class="data-table__td text-center text-muted">
                    No hay colaboradores inscritos en este curso.
                  </td>
                </tr>
                <tr v-for="p in selectedCourse.participantes" :key="p.id">
                  <td class="data-table__td text-bold">{{ p.primer_nombre }} {{ p.primer_apellido }}</td>
                  <td class="data-table__td">{{ p.renglon_codigo || '011' }}</td>
                  <td class="data-table__td">
                    <span class="badge badge--neutral">{{ p.origen_inscripcion }}</span>
                  </td>
                  <td class="data-table__td">{{ p.calificacion_final !== null ? p.calificacion_final + '/100' : 'Pendiente' }}</td>
                  <td class="data-table__td">{{ p.porcentaje_asistencia !== null ? p.porcentaje_asistencia + '%' : 'Pendiente' }}</td>
                  <td class="data-table__td">
                    <span class="badge" :class="p.estado === 'APROBADO' ? 'badge--success' : (p.estado === 'REPROBADO' ? 'badge--danger' : 'badge--warning')">
                      {{ p.estado }}
                    </span>
                  </td>
                  <td class="data-table__td text-xs font-mono">
                    <span v-if="p.hash_certificado" class="badge badge--success">{{ p.hash_certificado }}</span>
                    <span v-else class="text-muted">Sin emisión</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useTrainingsStore } from "../stores/trainings.store";
import { useToast } from "../composables/useToast";

const store = useTrainingsStore();
const toast = useToast();
const showModal = ref(false);
const showDetailModal = ref(false);
const saving = ref(false);
const selectedCourse = ref(null);

const form = ref({
  titulo: "",
  area_tematica: "GESTION_PUBLICA",
  modalidad: "VIRTUAL",
  horas_lectivas: 16,
  cupo_maximo: 30,
  entidad_facilitadora: "INAP",
  fecha_inicio: "",
  fecha_fin: "",
  objetivo_capacitacion: "",
});

const totalHoursCatalog = computed(() => {
  return store.trainings.reduce((acc, curr) => acc + Number(curr.horas_lectivas || 0), 0);
});

const totalEnrolled = computed(() => {
  return store.trainings.reduce((acc, curr) => acc + Number(curr.total_inscritos || 0), 0);
});

function openCreateModal() {
  form.value = {
    titulo: "",
    area_tematica: "GESTION_PUBLICA",
    modalidad: "VIRTUAL",
    horas_lectivas: 16,
    cupo_maximo: 30,
    entidad_facilitadora: "INAP",
    fecha_inicio: "",
    fecha_fin: "",
    objetivo_capacitacion: "",
  };
  showModal.value = true;
}

async function handleSaveTraining() {
  saving.value = true;
  try {
    await store.createTraining(form.value);
    showModal.value = false;
    toast.success("Curso o capacitación registrado exitosamente");
  } catch (err) {
    toast.error("Error al guardar curso: " + (err.response?.data?.message || err.message));
  } finally {
    saving.value = false;
  }
}

async function viewTrainingDetail(id) {
  try {
    selectedCourse.value = await store.fetchTrainingById(id);
    showDetailModal.value = true;
  } catch (err) {
    toast.error("Error al obtener detalle del curso");
  }
}

function getStatusBadge(estado) {
  switch (estado) {
    case "CONVOCATORIA_ABIERTA": return "badge--info";
    case "EN_CURSO": return "badge--warning";
    case "FINALIZADO": return "badge--success";
    default: return "badge--neutral";
  }
}

onMounted(() => {
  store.fetchTrainings();
});
</script>
