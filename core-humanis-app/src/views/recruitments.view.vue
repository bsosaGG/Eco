<template>
  <div class="recruitments-view">
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Reclutamiento y Selección de Talento</h2>
          <p class="text-muted text-sm mt-1">
            Convocatorias públicas institucionales, calificación ciega por mérito y conformación de ternas finalistas.
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--primary" @click="showNewModal = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Convocatoria
          </button>
        </div>
      </div>
    </div>

    <!-- Pestañas -->
    <div class="tabs-nav">
      <button
        class="tabs-nav__btn"
        :class="{ 'tabs-nav__btn--active': activeTab === 'convocatorias' }"
        @click="activeTab = 'convocatorias'"
      >
        Convocatorias ({{ store.recruitments.length }})
      </button>
      <button
        class="tabs-nav__btn"
        :class="{ 'tabs-nav__btn--active': activeTab === 'detalle' }"
        :disabled="!store.currentRecruitment"
        @click="activeTab = 'detalle'"
      >
        Terna y Postulantes {{ store.currentRecruitment ? `(${store.currentRecruitment.correlativo})` : '' }}
      </button>
    </div>

    <!-- TAB 1: LISTA DE CONVOCATORIAS -->
    <div v-if="activeTab === 'convocatorias'" class="card">
      <div class="card__header d-flex justify-between align-center">
        <h4 class="font-heading">Convocatorias Institucionales</h4>
        <span class="badge badge--info">{{ store.recruitments.length }} registros</span>
      </div>
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">Correlativo</th>
                <th class="data-table__th">Título de la Plaza</th>
                <th class="data-table__th">Renglón</th>
                <th class="data-table__th">Unidad</th>
                <th class="data-table__th">Postulantes</th>
                <th class="data-table__th">Estado</th>
                <th class="data-table__th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.recruitments.length">
                <td colspan="7" class="data-table__td text-center text-muted">
                  No hay convocatorias registradas en este momento.
                </td>
              </tr>
              <tr v-for="c in store.recruitments" :key="c.id" class="data-table__row">
                <td class="data-table__td text-bold">{{ c.correlativo }}</td>
                <td class="data-table__td">{{ c.titulo_plaza }}</td>
                <td class="data-table__td">
                  <span class="badge badge--neutral">{{ c.renglon_presupuestario || '011' }}</span>
                </td>
                <td class="data-table__td text-sm">{{ c.unidad_administrativa }}</td>
                <td class="data-table__td text-center">
                  <span class="badge badge--info">{{ c.total_postulaciones || 0 }}</span>
                </td>
                <td class="data-table__td">
                  <select 
                    :value="c.estado" 
                    class="status-select-badge" 
                    :class="getStatusBadge(c.estado)"
                    @change="handleStatusChange(c.id, $event.target.value)"
                  >
                    <option value="PUBLICADA">🟢 PUBLICADA (Activa)</option>
                    <option value="EN_EVALUACION">🟡 EN EVALUACIÓN</option>
                    <option value="BORRADOR">⚪ BORRADOR (Inactiva)</option>
                    <option value="FINALIZADA">🔵 FINALIZADA</option>
                    <option value="CANCELADA">🔴 CANCELADA</option>
                  </select>
                </td>
                <td class="data-table__td actions-cell">
                  <button class="btn btn--sm btn--secondary" @click="viewDetail(c.id)">
                    Ver Terna
                  </button>
                  <button class="btn btn--sm btn--outline" @click="openEditModal(c)" title="Editar estado">
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: DETALLE DE CONVOCATORIA Y POSTULANTES -->
    <div v-if="activeTab === 'detalle' && store.currentRecruitment" class="card">
      <div class="card__header adaptive-bar">
        <div>
          <h4 class="font-heading">{{ store.currentRecruitment.titulo_plaza }}</h4>
          <span class="text-muted text-sm">
            {{ store.currentRecruitment.correlativo }} | Vacantes: {{ store.currentRecruitment.plazas_disponibles }} | {{ store.currentRecruitment.unidad_administrativa }}
          </span>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--sm btn--secondary" @click="showCandidateModal = true">
            Registrar Postulante
          </button>
        </div>
      </div>
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">No.</th>
                <th class="data-table__th">Candidato</th>
                <th class="data-table__th">CUI / DPI</th>
                <th class="data-table__th">CV (20 pts)</th>
                <th class="data-table__th">Técnica (40 pts)</th>
                <th class="data-table__th">Entrevista (40 pts)</th>
                <th class="data-table__th">Total</th>
                <th class="data-table__th">Estado</th>
                <th class="data-table__th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="store.currentRecruitment.postulantes && store.currentRecruitment.postulantes.length">
                <tr v-for="(p, idx) in store.currentRecruitment.postulantes" :key="p.id" class="data-table__row">
                  <td class="data-table__td">{{ idx + 1 }}</td>
                  <td class="data-table__td text-bold">{{ p.nombres }} {{ p.apellidos }}</td>
                <td class="data-table__td">{{ p.cui }}</td>
                <td class="data-table__td text-center">{{ p.punteo_curricular || 0 }}/20</td>
                <td class="data-table__td text-center">{{ p.punteo_tecnico || 0 }}/40</td>
                <td class="data-table__td text-center">{{ p.punteo_entrevista || 0 }}/40</td>
                <td class="data-table__td text-center text-bold">
                  {{ p.punteo_total || 0 }} pts
                </td>
                <td class="data-table__td">
                  <span v-if="p.estado === 'SELECCIONADO'" class="badge badge--success">GANADOR</span>
                  <span v-else-if="p.en_terna" class="badge badge--warning">EN TERNA</span>
                  <span v-else class="badge badge--neutral">{{ p.estado }}</span>
                </td>
                <td class="data-table__td">
                  <div class="d-flex gap-1">
                    <button class="btn btn--sm btn--outline" @click="openScoreModal(p)">
                      Calificar
                    </button>
                    <button
                      v-if="p.en_terna && p.estado !== 'SELECCIONADO'"
                      class="btn btn--sm btn--primary"
                      @click="handleSelectWinner(p.id)"
                    >
                      Seleccionar
                    </button>
                  </div>
                </td>
              </tr>
            </template>
              <tr v-else>
                <td colspan="9" class="data-table__td text-center text-muted">
                  No hay candidatos postulados en esta convocatoria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA CONVOCATORIA -->
    <div v-if="showNewModal" class="modal__overlay" @click.self="showNewModal = false">
      <div class="modal__content">
        <div class="modal__header">
          <h4 class="font-heading">Publicar Convocatoria</h4>
          <button class="btn-close" @click="showNewModal = false">✕</button>
        </div>
        <div class="modal__body">
          <form @submit.prevent="handleCreateRecruitment">
            <div class="form-group">
              <label class="form-group__label">Puesto Funcional (Título de la Plaza) *</label>
              <select v-model="newForm.titulo_plaza" class="form-group__control" required>
                <option value="">Seleccione un puesto funcional...</option>
                <option v-for="pf in colabStore.catalogos.puestos_funcionales" :key="pf.id" :value="pf.nombre">
                  {{ pf.nombre }}
                </option>
              </select>
            </div>
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Renglón Presupuestario *</label>
                <select v-model="newForm.renglon_presupuestario" class="form-group__control" required>
                  <option value="">Seleccione renglón...</option>
                  <option v-for="r in colabStore.catalogos.renglones" :key="r.id" :value="r.codigo">
                    Renglón {{ r.codigo }} - {{ r.nombre }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-group__label">Dirección / Unidad Administrativa *</label>
                <select v-model="newForm.unidad_administrativa" class="form-group__control" required>
                  <option value="">Seleccione una unidad...</option>
                  <option v-for="u in colabStore.catalogos.unidades" :key="u.id" :value="u.nombre">
                    {{ u.nombre }}
                  </option>
                </select>
              </div>
            </div>
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Salario / Honorarios (Q)</label>
                <input v-model.number="newForm.salario_honorarios" type="number" min="0" step="0.01" class="form-group__control" required />
              </div>
              <div class="form-group">
                <label class="form-group__label">Vacantes Disponibles</label>
                <input v-model.number="newForm.plazas_disponibles" type="number" min="1" class="form-group__control" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-group__label">Fecha de Cierre</label>
              <input v-model="newForm.fecha_cierre" type="date" class="form-group__control" required />
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showNewModal = false">Cancelar</button>
              <button type="submit" class="btn btn--primary" :disabled="store.loading">Publicar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL REGISTRAR CANDIDATO -->
    <div v-if="showCandidateModal" class="modal__overlay" @click.self="showCandidateModal = false">
      <div class="modal__content">
        <div class="modal__header">
          <h4 class="font-heading">Registrar Postulante</h4>
          <button class="btn-close" @click="showCandidateModal = false">✕</button>
        </div>
        <div class="modal__body">
          <form @submit.prevent="handleApplyCandidate">
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Nombres</label>
                <input v-model="candidateForm.nombres" class="form-group__control" required />
              </div>
              <div class="form-group">
                <label class="form-group__label">Apellidos</label>
                <input v-model="candidateForm.apellidos" class="form-group__control" required />
              </div>
            </div>
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">CUI / DPI</label>
                <input v-model="candidateForm.cui" class="form-group__control" placeholder="13 dígitos" required />
              </div>
              <div class="form-group">
                <label class="form-group__label">Correo Institucional / Personal</label>
                <input v-model="candidateForm.email" type="email" class="form-group__control" required />
              </div>
            </div>
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Grado Académico</label>
                <select v-model="candidateForm.grado_academico" class="form-group__control" required>
                  <option value="DIVERSIFICADO">Diversificado</option>
                  <option value="ESTUDIANTE_UNIVERSITARIO">Estudiante Universitario</option>
                  <option value="LICENCIATURA">Licenciatura / Profesional</option>
                  <option value="MAESTRIA">Maestría</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-group__label">Teléfono</label>
                <input v-model="candidateForm.telefono" class="form-group__control" placeholder="Opcional" />
              </div>
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showCandidateModal = false">Cancelar</button>
              <button type="submit" class="btn btn--primary" :disabled="store.loading">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL CALIFICAR CANDIDATO -->
    <div v-if="showScoreModal" class="modal__overlay" @click.self="showScoreModal = false">
      <div class="modal__content">
        <div class="modal__header">
          <h4 class="font-heading">Calificación: {{ selectedCandidate?.nombres }} {{ selectedCandidate?.apellidos }}</h4>
          <button class="btn-close" @click="showScoreModal = false">✕</button>
        </div>
        <div class="modal__body">
          <form @submit.prevent="handleSaveScore">
            <div class="form-group">
              <label class="form-group__label">Filtro Documental / CV (Máx 20 pts)</label>
              <input v-model.number="scoreForm.punteo_curricular" type="number" min="0" max="20" class="form-group__control" :class="{ 'is-invalid': scoreForm.punteo_curricular > 20 || scoreForm.punteo_curricular < 0 }" required />
              <small v-if="scoreForm.punteo_curricular > 20" class="text-danger">El punteo no puede ser mayor a 20 pts</small>
            </div>
            <div class="form-group">
              <label class="form-group__label">Prueba Técnica (Máx 40 pts)</label>
              <input v-model.number="scoreForm.punteo_tecnico" type="number" min="0" max="40" class="form-group__control" :class="{ 'is-invalid': scoreForm.punteo_tecnico > 40 || scoreForm.punteo_tecnico < 0 }" required />
              <small v-if="scoreForm.punteo_tecnico > 40" class="text-danger">El punteo no puede ser mayor a 40 pts</small>
            </div>
            <div class="form-group">
              <label class="form-group__label">Entrevista por Competencias (Máx 40 pts)</label>
              <input v-model.number="scoreForm.punteo_entrevista" type="number" min="0" max="40" class="form-group__control" :class="{ 'is-invalid': scoreForm.punteo_entrevista > 40 || scoreForm.punteo_entrevista < 0 }" required />
              <small v-if="scoreForm.punteo_entrevista > 40" class="text-danger">El punteo no puede ser mayor a 40 pts</small>
            </div>
            <div class="card glass-panel mb-3">
              <div class="card__body d-flex justify-between align-center">
                <span>Total Estimado:</span>
                <span v-if="isScoreValid" class="text-bold" :class="totalScore >= 75 ? 'text-success' : 'text-muted'">
                  {{ totalScore }} / 100 pts ({{ totalScore >= 75 ? 'Califica a Terna' : 'No clasifica a terna' }})
                </span>
                <span v-else class="text-bold text-danger">
                  {{ totalScore }} / 100 pts (Excede límite permitido)
                </span>
              </div>
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showScoreModal = false">Cancelar</button>
              <button type="submit" class="btn btn--primary" :disabled="store.loading || !isScoreValid">Guardar Calificación</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR CONVOCATORIA -->
    <div v-if="showEditModal" class="modal__overlay" @click.self="showEditModal = false">
      <div class="modal__content">
        <div class="modal__header">
          <h4 class="font-heading">Gestionar / Editar Convocatoria ({{ editingRecruitment?.correlativo }})</h4>
          <button class="btn-close" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal__body">
          <!-- Explicación de solo lectura si ya existen postulantes -->
          <div v-if="hasCandidates" class="card rule-box rule-box--warning mb-3">
            <span>🔒 <strong>Edición Restringida:</strong> Esta convocatoria ya cuenta con <strong>{{ editingRecruitment?.total_postulaciones || 0 }} postulante(s)</strong> registrado(s). Los términos de la plaza (Puesto, Renglón, Unidad, Honorarios, Vacantes) se encuentran en solo lectura para preservar la transparencia del proceso de oposición por mérito. Únicamente puedes modificar el <strong>Estado</strong>.</span>
          </div>
          <div v-else class="card rule-box rule-box--info mb-3">
            <span>✏️ <strong>Edición Completa Habilitada:</strong> Aún no existen postulantes registrados en esta convocatoria, por lo que puedes editar libremente todos sus campos.</span>
          </div>

          <form @submit.prevent="handleUpdateRecruitment">
            <div class="form-group">
              <label class="form-group__label">Puesto Funcional (Título de la Plaza) *</label>
              <select v-model="editForm.titulo_plaza" class="form-group__control" :disabled="hasCandidates" required>
                <option value="">Seleccione un puesto funcional...</option>
                <option v-for="pf in colabStore.catalogos.puestos_funcionales" :key="pf.id" :value="pf.nombre">
                  {{ pf.nombre }}
                </option>
              </select>
            </div>

            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Renglón Presupuestario *</label>
                <select v-model="editForm.renglon_presupuestario" class="form-group__control" :disabled="hasCandidates" required>
                  <option value="">Seleccione renglón...</option>
                  <option v-for="r in colabStore.catalogos.renglones" :key="r.id" :value="r.codigo">
                    Renglón {{ r.codigo }} - {{ r.nombre }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-group__label">Dirección / Unidad Administrativa *</label>
                <select v-model="editForm.unidad_administrativa" class="form-group__control" :disabled="hasCandidates" required>
                  <option value="">Seleccione una unidad...</option>
                  <option v-for="u in colabStore.catalogos.unidades" :key="u.id" :value="u.nombre">
                    {{ u.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Salario / Honorarios (Q) *</label>
                <input v-model.number="editForm.salario_honorarios" type="number" min="0" step="0.01" class="form-group__control" :disabled="hasCandidates" required />
              </div>
              <div class="form-group">
                <label class="form-group__label">Vacantes Disponibles *</label>
                <input v-model.number="editForm.plazas_disponibles" type="number" min="1" class="form-group__control" :disabled="hasCandidates" required />
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="form-group__label">Fecha de Cierre *</label>
              <input v-model="editForm.fecha_cierre" type="date" class="form-group__control" :disabled="hasCandidates" required />
            </div>

            <div class="form-group mb-4">
              <label class="form-group__label">Estado de la Convocatoria *</label>
              <select v-model="editForm.estado" class="form-group__control" required>
                <option value="PUBLICADA">🟢 PUBLICADA (Activa - Disponible para postulación/contratación)</option>
                <option value="EN_EVALUACION">🟡 EN EVALUACIÓN (En proceso de selección ciego/terna)</option>
                <option value="BORRADOR">⚪ BORRADOR (Inactiva - Oculta del catálogo)</option>
                <option value="FINALIZADA">🔵 FINALIZADA (Concluido proceso de selección)</option>
                <option value="CANCELADA">🔴 CANCELADA (Desactivada permanentemente)</option>
              </select>
            </div>

            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showEditModal = false">Cancelar</button>
              <button type="submit" class="btn btn--primary" :disabled="store.loading">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRecruitmentsStore } from '../stores/recruitments.store';
import { useCollaboratorsStore } from '../stores/collaborators.store';
import { useHiringStore } from '../stores/hiring.store';
import { useToast } from '../composables/useToast';
import { useDialog } from '../composables/useDialog';

const store = useRecruitmentsStore();
const colabStore = useCollaboratorsStore();
const hiringStore = useHiringStore();
const toast = useToast();
const dialog = useDialog();
const activeTab = ref('convocatorias');
const showNewModal = ref(false);
const showEditModal = ref(false);
const showCandidateModal = ref(false);
const showScoreModal = ref(false);
const selectedCandidate = ref(null);
const editingRecruitment = ref(null);

const hasCandidates = computed(() => {
  return (editingRecruitment.value?.total_postulaciones || 0) > 0;
});

const editForm = ref({
  titulo_plaza: '',
  renglon_presupuestario: '',
  unidad_administrativa: '',
  salario_honorarios: 0,
  plazas_disponibles: 1,
  fecha_cierre: '',
  estado: 'PUBLICADA',
});

const newForm = ref({
  titulo_plaza: '',
  renglon_presupuestario: '',
  unidad_administrativa: '',
  salario_honorarios: 10000,
  plazas_disponibles: 1,
  fecha_cierre: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
});

const candidateForm = ref({
  nombres: '',
  apellidos: '',
  cui: '',
  email: '',
  telefono: '',
  grado_academico: 'LICENCIATURA',
});

const scoreForm = ref({
  punteo_curricular: 0,
  punteo_tecnico: 0,
  punteo_entrevista: 0,
});

const totalScore = computed(() => {
  return (scoreForm.value.punteo_curricular || 0) + (scoreForm.value.punteo_tecnico || 0) + (scoreForm.value.punteo_entrevista || 0);
});

const isScoreValid = computed(() => {
  const cur = scoreForm.value.punteo_curricular || 0;
  const tec = scoreForm.value.punteo_tecnico || 0;
  const ent = scoreForm.value.punteo_entrevista || 0;
  return cur >= 0 && cur <= 20 && tec >= 0 && tec <= 40 && ent >= 0 && ent <= 40;
});

onMounted(async () => {
  await Promise.all([
    store.fetchRecruitments(),
    colabStore.fetchCatalogos()
  ]);
});

const viewDetail = async (id) => {
  await store.fetchRecruitmentById(id);
  activeTab.value = 'detalle';
};

const getStatusBadge = (estado) => {
  if (estado === 'PUBLICADA') return 'badge--success';
  if (estado === 'EN_EVALUACION') return 'badge--warning';
  if (estado === 'FINALIZADA') return 'badge--neutral';
  if (estado === 'CANCELADA') return 'badge--danger';
  return 'badge--info';
};

const openEditModal = (recruitment) => {
  editingRecruitment.value = recruitment;
  const formattedDate = recruitment.fecha_cierre ? new Date(recruitment.fecha_cierre).toISOString().split('T')[0] : '';
  editForm.value = {
    titulo_plaza: recruitment.titulo_plaza || '',
    renglon_presupuestario: recruitment.renglon_presupuestario || '',
    unidad_administrativa: recruitment.unidad_administrativa || '',
    salario_honorarios: recruitment.salario_honorarios || 0,
    plazas_disponibles: recruitment.plazas_disponibles || 1,
    fecha_cierre: formattedDate,
    estado: recruitment.estado || 'PUBLICADA',
  };
  showEditModal.value = true;
};

const handleStatusChange = async (id, newStatus) => {
  try {
    await store.updateRecruitmentStatus(id, newStatus);
    await hiringStore.fetchConvocatorias();
    toast.success('Estado actualizado correctamente');
  } catch (err) {
    toast.error('Error al actualizar estado: ' + (err.message || 'Error al cambiar estado'));
  }
};

const handleUpdateRecruitment = async () => {
  if (!editingRecruitment.value) return;
  try {
    if (hasCandidates.value) {
      await store.updateRecruitmentStatus(editingRecruitment.value.id, editForm.value.estado);
    } else {
      await store.updateRecruitment(editingRecruitment.value.id, editForm.value);
    }
    await store.fetchRecruitments();
    await hiringStore.fetchConvocatorias();
    showEditModal.value = false;
    toast.success('Convocatoria actualizada exitosamente');
  } catch (err) {
    toast.error('Error al actualizar la convocatoria: ' + (err.message || 'Error al guardar cambios'));
  }
};

const handleCreateRecruitment = async () => {
  try {
    await store.createRecruitment(newForm.value);
    showNewModal.value = false;
    newForm.value = {
      titulo_plaza: '',
      renglon_presupuestario: '',
      unidad_administrativa: '',
      salario_honorarios: 10000,
      plazas_disponibles: 1,
      fecha_cierre: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    };
    toast.success('Convocatoria creada exitosamente');
  } catch (err) {
    toast.error('Error al crear convocatoria: ' + (err.message || 'Error al crear'));
  }
};

const handleApplyCandidate = async () => {
  if (!store.currentRecruitment) return;
  try {
    await store.applyCandidate(store.currentRecruitment.id, candidateForm.value);
    await store.fetchRecruitmentById(store.currentRecruitment.id);
    await store.fetchRecruitments();
    showCandidateModal.value = false;
    candidateForm.value = { nombres: '', apellidos: '', cui: '', email: '', telefono: '', grado_academico: 'LICENCIATURA' };
    toast.success('Postulante registrado correctamente');
  } catch (err) {
    toast.error('Error al registrar postulante: ' + (err.message || 'Error al postular'));
  }
};

const openScoreModal = (candidate) => {
  selectedCandidate.value = candidate;
  scoreForm.value = {
    punteo_curricular: candidate.punteo_curricular || 0,
    punteo_tecnico: candidate.punteo_tecnico || 0,
    punteo_entrevista: candidate.punteo_entrevista || 0,
  };
  showScoreModal.value = true;
};

const handleSaveScore = async () => {
  if (!store.currentRecruitment || !selectedCandidate.value) return;
  try {
    await store.scoreCandidate(store.currentRecruitment.id, selectedCandidate.value.id, scoreForm.value);
    showScoreModal.value = false;
    toast.success('Calificación guardada exitosamente');
  } catch (err) {
    toast.error('Error al guardar calificación: ' + (err.message || 'Error al calificar'));
  }
};

const handleSelectWinner = async (appId) => {
  if (!store.currentRecruitment) return;
  const ok = await dialog.confirm({
    title: 'Seleccionar ganador de plaza',
    message: '¿Confirma la selección de este candidato como ganador de la plaza institucional?<br><span style="font-size:0.85rem">Esta acción cierra el proceso de reclutamiento y queda registrada en la auditoría.</span>',
    variant: 'success',
    confirmLabel: 'Confirmar selección',
    cancelLabel: 'Cancelar',
  });
  if (ok) {
    try {
      await store.selectWinner(store.currentRecruitment.id, appId);
      toast.success('Ganador seleccionado exitosamente');
    } catch (err) {
      toast.error('Error al seleccionar ganador: ' + (err.message || 'Error en selección'));
    }
  }
};
</script>

<style scoped>
.status-select-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  border: 1px solid var(--color-border, #cbd5e1);
}

.actions-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
