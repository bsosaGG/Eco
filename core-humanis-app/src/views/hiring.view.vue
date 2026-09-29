<template>
  <div class="hiring-view">
    <!-- Header Institucional -->
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Módulo de Contratación de Personal</h2>
          <p class="text-muted hiring-header__desc">
            Flujo reglamentario: <strong>Persona ➔ Candidato ➔ Empleado ➔ Contrato</strong>.
            Garantía estricta de CUI/DPI único y un solo contrato activo por colaborador.
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--primary" @click="startDirectHiring">
            + Nueva Contratación Directa
          </button>
        </div>
      </div>
    </div>

    <!-- Navegación de Pestañas -->
    <div class="tabs-nav">
      <button 
        class="tabs-nav__btn" 
        :class="{ 'tabs-nav__btn--active': activeTab === 'pipeline' }"
        @click="activeTab = 'pipeline'"
      >
        Candidatos en Terna ({{ hiringStore.pipeline.length }})
      </button>
      <button 
        class="tabs-nav__btn" 
        :class="{ 'tabs-nav__btn--active': activeTab === 'stepper' }"
        @click="activeTab = 'stepper'"
      >
        Formalización de Contrato
        <span v-if="hiringStore.hasDraft" class="badge badge--warning ml-1">Borrador en curso</span>
      </button>
    </div>

    <!-- TAB 1: PIPELINE DE CANDIDATOS -->
    <div v-if="activeTab === 'pipeline'" class="card">
      <div class="card__header">
        <h4 class="font-heading">Candidatos Preseleccionados para Alta Institucional</h4>
        <span class="badge badge--info">{{ hiringStore.pipeline.length }} candidatos</span>
      </div>
      <div class="card__body">
        <div class="data-table-container table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">CUI / DPI</th>
                <th class="data-table__th">Candidato</th>
                <th class="data-table__th">Plaza / Convocatoria</th>
                <th class="data-table__th">Renglón</th>
                <th class="data-table__th">Puntuación</th>
                <th class="data-table__th">Honorarios / Salario</th>
                <th class="data-table__th">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!hiringStore.pipeline.length">
                <td colspan="7" class="data-table__td data-table__td--empty">
                  No hay candidatos preseleccionados pendientes de contratación.
                </td>
              </tr>
              <tr v-for="cand in hiringStore.pipeline" :key="cand.id" class="data-table__row">
                <td class="data-table__td font-mono">{{ cand.cui }}</td>
                <td class="data-table__td">
                  <strong>{{ cand.nombres }} {{ cand.apellidos }}</strong>
                  <div class="text-muted text-xs">{{ cand.email }}</div>
                </td>
                <td class="data-table__td">
                  {{ cand.titulo_plaza }}
                  <div class="text-muted text-xs">{{ cand.convocatoria_correlativo }}</div>
                </td>
                <td class="data-table__td">
                  <span class="badge badge--neutral">{{ cand.renglon_presupuestario || '029' }}</span>
                </td>
                <td class="data-table__td text-center">
                  <span class="badge badge--success">{{ cand.punteo_total }} pts</span>
                </td>
                <td class="data-table__td font-semibold">
                  Q. {{ parseFloat(cand.salario_convocatoria || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 }) }}
                </td>
                <td class="data-table__td">
                  <button 
                    class="btn btn--sm btn--primary" 
                    @click="handleStartHiring(cand)"
                  >
                    Formalizar Contratación ➔
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: STEPPER DE CONTRATACIÓN -->
    <div v-if="activeTab === 'stepper'">
      <div v-if="successData" class="card hiring-success-card">
        <div class="card__body text-center">
          <div class="hiring-success-icon">✓</div>
          <h3 class="font-heading text-success">¡Contratación Formalizada Exitosamente!</h3>
          <p class="text-muted">
            Se ha completado el ciclo completo <strong>Persona ➔ Candidato ➔ Empleado ➔ Contrato</strong>.
          </p>
          <div class="hiring-success-meta">
            <div>
              <span class="text-muted text-xs">Código de Empleado:</span>
              <div class="font-bold">{{ successData.empleado?.codigo_empleado }}</div>
            </div>
            <div>
              <span class="text-muted text-xs">Número de Contrato:</span>
              <div class="font-bold">{{ successData.contrato?.numero_contrato }}</div>
            </div>
            <div>
              <span class="text-muted text-xs">Renglón:</span>
              <div class="font-bold">{{ successData.contrato?.renglon_codigo }}</div>
            </div>
          </div>
          <div class="hiring-success-actions">
            <button class="btn btn--primary" @click="handleBackToPipeline">
              Volver a Candidatos Preseleccionados
            </button>
            <router-link :to="`/collaborators/${successData.persona?.id}`" class="btn btn--secondary">
              Ver Ficha de Colaborador
            </router-link>
          </div>
        </div>
      </div>

      <HiringStepper 
        v-else 
        :selectedCandidate="selectedCandidate" 
        @completed="onHiringCompleted" 
        @cancel="handleBackToPipeline"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useHiringStore } from '../stores/hiring.store';
import { useCollaboratorsStore } from '../stores/collaborators.store';
import HiringStepper from '../components/hiring/hiring-stepper.vue';

const hiringStore = useHiringStore();
const colabStore = useCollaboratorsStore();

const activeTab = ref('pipeline');
const selectedCandidate = ref(null);
const successData = ref(null);

onMounted(async () => {
  hiringStore.loadDraft();
  await Promise.all([
    hiringStore.fetchPipeline(),
    colabStore.fetchCatalogos()
  ]);
});

function handleStartHiring(cand) {
  selectedCandidate.value = cand;
  hiringStore.selectCandidate(cand);
  successData.value = null;
  activeTab.value = 'stepper';
}

function startDirectHiring() {
  selectedCandidate.value = null;
  // Si no hay borrador o ya se está continuando uno, cargar draft
  if (!hiringStore.hasDraft) {
    hiringStore.resetForm();
  } else {
    hiringStore.loadDraft();
  }
  successData.value = null;
  activeTab.value = 'stepper';
}

function onHiringCompleted(result) {
  successData.value = result;
  hiringStore.fetchPipeline();
}

function handleBackToPipeline() {
  successData.value = null;
  selectedCandidate.value = null;
  hiringStore.resetForm();
  activeTab.value = 'pipeline';
}
</script>

<style scoped>
.hiring-header__desc {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.data-table__td--empty {
  text-align: center;
  color: var(--color-text-muted, #64748b);
  padding: 2.5rem;
}

.font-mono {
  font-family: monospace;
}

.font-semibold {
  font-weight: 600;
}

.font-bold {
  font-weight: 700;
}

.text-xs {
  font-size: 0.75rem;
}

.text-center {
  text-align: center;
}

.hiring-success-card {
  max-width: 600px;
  margin: 2rem auto;
}

.hiring-success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-success, #16a34a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin: 0 auto 1rem auto;
}

.hiring-success-meta {
  display: flex;
  justify-content: space-around;
  background: var(--color-bg-alt, #f8fafc);
  padding: 12px;
  border-radius: 6px;
  margin: 1.5rem 0;
}

.hiring-success-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
