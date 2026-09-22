<template>
  <div class="evaluations-view">
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Evaluación del Desempeño Institucional</h2>
          <p class="text-muted text-sm mt-1">
            Gestión de evaluaciones periódicas según normativas ONSEC (011/022) y cumplimiento de TDR (029/18).
          </p>
        </div>
        <div class="adaptive-bar__actions">
          <button class="btn btn--primary" @click="openCreateModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Evaluación
          </button>
        </div>
      </div>
    </div>

    <!-- TABLA DE EVALUACIONES -->
    <div class="card">
      <div class="card__header d-flex justify-between align-center">
        <h4 class="font-heading">Evaluaciones Realizadas</h4>
        <span class="badge badge--info">{{ store.evaluations.length }} registradas</span>
      </div>
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">Correlativo</th>
                <th class="data-table__th">Colaborador</th>
                <th class="data-table__th">Renglón</th>
                <th class="data-table__th">Período</th>
                <th class="data-table__th">Calificación</th>
                <th class="data-table__th">Escala</th>
                <th class="data-table__th">Plan de Mejora</th>
                <th class="data-table__th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.evaluations.length">
                <td colspan="8" class="data-table__td text-center text-muted">
                  No hay evaluaciones registradas en el sistema.
                </td>
              </tr>
              <tr v-for="ev in store.evaluations" :key="ev.id" class="data-table__row">
                <td class="data-table__td text-bold">{{ ev.correlativo }}</td>
                <td class="data-table__td">{{ ev.primer_nombre }} {{ ev.primer_apellido }}</td>
                <td class="data-table__td">
                  <span class="badge badge--neutral">{{ ev.renglon_codigo || '011' }}</span>
                </td>
                <td class="data-table__td">{{ ev.periodo_evaluado }}</td>
                <td class="data-table__td text-bold">{{ ev.calificacion_total }} / 100</td>
                <td class="data-table__td">
                  <span class="badge" :class="getScaleBadge(ev.resultado_escala)">
                    {{ ev.resultado_escala }}
                  </span>
                </td>
                <td class="data-table__td">
                  <span v-if="ev.requiere_plan_mejora" class="badge badge--danger">REQUERIDO (90d)</span>
                  <span v-else class="badge badge--success">NO REQUERIDO</span>
                </td>
                <td class="data-table__td">
                  <button class="btn btn--sm btn--secondary" @click="viewDetail(ev.id)">
                    Ver Factores
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA EVALUACIÓN -->
    <div v-if="showModal" class="modal__overlay" @click.self="showModal = false">
      <div class="modal__content">
        <div class="modal__header">
          <h4 class="font-heading">Registrar Evaluación de Desempeño</h4>
          <button class="btn-close" @click="showModal = false">✕</button>
        </div>
        <div class="modal__body">
          <form @submit.prevent="handleSaveEvaluation">
            <div class="grid--2">
              <div class="form-group">
                <label class="form-group__label">Colaborador Institucional</label>
                <select v-model="form.persona_id" class="form-group__control" required>
                  <option value="" disabled>Seleccione un colaborador...</option>
                  <option v-for="c in colabStore.colaboradores" :key="c.id" :value="c.id">
                    {{ c.primer_nombre }} {{ c.primer_apellido }} ({{ c.renglon_codigo || '011' }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-group__label">Período a Evaluar</label>
                <input v-model="form.periodo_evaluado" class="form-group__control" placeholder="Ej: 2026-S1 o Anual 2025" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-group__label">Instrumento de Evaluación</label>
              <select v-model="form.tipo_instrumento" class="form-group__control" @change="onInstrumentChange">
                <option value="ONSEC_011_022">Escala ONSEC (100 pts - Renglones 011 y 022)</option>
                <option value="TDR_029_18">Cumplimiento de TDR (100 pts - Renglones 029 / 18)</option>
              </select>
            </div>

            <!-- Desglose de Factores -->
            <div class="mb-3">
              <h5 class="font-heading mb-2">Ponderación por Factores</h5>
              <div v-for="f in form.factores" :key="f.factor_clave" class="card mb-2">
                <div class="card__body">
                  <div class="d-flex justify-between align-center mb-1">
                    <span class="text-bold text-sm">{{ f.factor_descripcion }}</span>
                    <span class="badge badge--info">{{ f.puntaje_obtenido }} / {{ f.ponderacion_maxima }} pts</span>
                  </div>
                  <input
                    v-model.number="f.puntaje_obtenido"
                    type="range"
                    min="0"
                    :max="f.ponderacion_maxima"
                    class="form-group__control"
                  />
                </div>
              </div>
            </div>

            <!-- Puntaje Total Estimado y Alertas -->
            <div class="card glass-panel mb-3">
              <div class="card__body d-flex justify-between align-center">
                <div>
                  <span class="text-muted text-sm">Calificación Total Calculada:</span>
                  <div class="font-heading text-bold">{{ computedScore }} / 100 pts</div>
                </div>
                <div>
                  <span v-if="computedScore < 70" class="badge badge--danger">
                    Plan de Mejora Obligatorio (< 70 pts)
                  </span>
                  <span v-else class="badge badge--success">Aprobatoria</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-group__label">Observaciones del Evaluador</label>
              <textarea v-model="form.observaciones_evaluador" class="form-group__control" rows="2" placeholder="Comentarios del desempeño..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-group__label">Compromisos del Colaborador</label>
              <textarea v-model="form.compromisos_colaborador" class="form-group__control" rows="2" placeholder="Compromisos de capacitación o entrega..."></textarea>
            </div>

            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showModal = false">Cancelar</button>
              <button type="submit" class="btn btn--primary" :disabled="store.loading">Guardar Evaluación</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL VER DETALLE DE FACTORES -->
    <div v-if="showDetailModal && store.currentEvaluation" class="modal__overlay" @click.self="showDetailModal = false">
      <div class="modal__content">
        <div class="modal__header">
          <h4 class="font-heading">Detalle: {{ store.currentEvaluation.correlativo }}</h4>
          <button class="btn-close" @click="showDetailModal = false">✕</button>
        </div>
        <div class="modal__body">
          <div class="mb-3">
            <span class="text-bold">{{ store.currentEvaluation.primer_nombre }} {{ store.currentEvaluation.primer_apellido }}</span>
            <div class="text-muted text-sm">{{ store.currentEvaluation.puesto_nominal || 'Puesto Institucional' }} | {{ store.currentEvaluation.periodo_evaluado }}</div>
          </div>

          <div class="mb-3">
            <h5 class="font-heading mb-2">Desglose de Calificación</h5>
            <div v-for="fac in store.currentEvaluation.factores" :key="fac.id" class="card mb-2">
              <div class="card__body d-flex justify-between align-center">
                <span>{{ fac.factor_descripcion }}</span>
                <span class="badge badge--info text-bold">{{ fac.puntaje_obtenido }} / {{ fac.ponderacion_maxima }} pts</span>
              </div>
            </div>
          </div>

          <div class="card glass-panel mb-2">
            <div class="card__body">
              <div class="d-flex justify-between align-center">
                <span class="text-bold">Resultado Final:</span>
                <span class="badge" :class="getScaleBadge(store.currentEvaluation.resultado_escala)">
                  {{ store.currentEvaluation.calificacion_total }}/100 ({{ store.currentEvaluation.resultado_escala }})
                </span>
              </div>
              <div v-if="store.currentEvaluation.requiere_plan_mejora" class="text-danger text-sm mt-2">
                ⚠️ Requiere Plan de Mejora a 90 días (Reevaluación: {{ store.currentEvaluation.fecha_reevaluacion }})
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" @click="showDetailModal = false">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEvaluationsStore } from '../stores/evaluations.store';
import { useCollaboratorsStore } from '../stores/collaborators.store';

const store = useEvaluationsStore();
const colabStore = useCollaboratorsStore();

const showModal = ref(false);
const showDetailModal = ref(false);

const form = ref({
  persona_id: '',
  periodo_evaluado: '2026-S1',
  tipo_instrumento: 'ONSEC_011_022',
  observaciones_evaluador: '',
  compromisos_colaborador: '',
  factores: [],
});

const computedScore = computed(() => {
  return form.value.factores.reduce((acc, f) => acc + (Number(f.puntaje_obtenido) || 0), 0);
});

onMounted(async () => {
  await Promise.all([
    store.fetchEvaluations(),
    colabStore.fetchColaboradores ? colabStore.fetchColaboradores() : Promise.resolve(),
  ]);
});

const getScaleBadge = (escala) => {
  if (escala === 'EXCELENTE') return 'badge--success';
  if (escala === 'MUY_BUENO') return 'badge--info';
  if (escala === 'SATISFACTORIO') return 'badge--warning';
  return 'badge--danger';
};

const openCreateModal = async () => {
  await onInstrumentChange();
  showModal.value = true;
};

const onInstrumentChange = async () => {
  const defaultFactors = await store.fetchDefaultFactors(form.value.tipo_instrumento);
  form.value.factores = defaultFactors.map((f) => ({
    ...f,
    puntaje_obtenido: Math.round(f.ponderacion_maxima * 0.85),
  }));
};

const handleSaveEvaluation = async () => {
  await store.createEvaluation(form.value);
  showModal.value = false;
};

const viewDetail = async (id) => {
  await store.fetchEvaluationById(id);
  showDetailModal.value = true;
};
</script>
