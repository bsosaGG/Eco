<template>
  <div class="climate-view">
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <h2 class="font-heading">Clima Laboral, Cultura y Bienestar</h2>
          <p class="text-muted text-sm mt-1">
            Evaluación periódica del clima institucional mediante voto ciego criptográfico (SHA-256) garantizando 100% de anonimato y confidencialidad.
          </p>
        </div>
      </div>
    </div>

    <!-- PESTAÑAS -->
    <div class="tabs-nav mb-4">
      <button class="tabs-nav__btn" :class="{ 'tabs-nav__btn--active': activeTab === 'survey' }" @click="activeTab = 'survey'">
        Encuesta Institucional Activa
      </button>
      <button class="tabs-nav__btn" :class="{ 'tabs-nav__btn--active': activeTab === 'results' }" @click="handleSelectResultsTab">
        Resultados y eNPS Institucional
      </button>
      <button class="tabs-nav__btn" :class="{ 'tabs-nav__btn--active': activeTab === 'campaigns' }" @click="activeTab = 'campaigns'">
        Campañas Históricas
      </button>
    </div>

    <!-- TAB 1: FORMULARIO DE ENCUESTA ACTIVA -->
    <div v-if="activeTab === 'survey'">
      <div v-if="store.hasParticipated" class="card mb-4">
        <div class="card__body text-center">
          <div class="badge badge--success mb-2">Participación Completada</div>
          <h4 class="font-heading">¡Gracias por participar en la Encuesta de Clima Laboral!</h4>
          <p class="text-muted text-sm mt-2">
            Su voto ciego ya ha sido asentado mediante token criptográfico no asociable a su identidad.
            Sus respuestas forman parte de las métricas agregadas de bienestar institucional.
          </p>
        </div>
      </div>

      <div v-else-if="store.activeCampaign" class="card">
        <div class="card__header">
          <h4 class="font-heading">{{ store.activeCampaign.titulo }}</h4>
          <p class="text-muted text-sm mt-1">{{ store.activeCampaign.descripcion }}</p>
        </div>
        <div class="card__body">
          <form @submit.prevent="handleSubmitSurvey">
            <div v-for="(q, idx) in store.activeQuestions" :key="q.id" class="card mb-3">
              <div class="card__body">
                <div class="d-flex justify-between align-center mb-2">
                  <span class="text-bold">{{ idx + 1 }}. {{ q.pregunta_texto }}</span>
                  <span class="badge badge--neutral">{{ q.dimension }}</span>
                </div>

                <!-- Tipo ESCALA / LIKERT -->
                <div v-if="q.tipo_respuesta !== 'TEXTO_ABIERTO'" class="d-flex align-center gap-3">
                  <span class="text-xs text-muted">1 (En desacuerdo)</span>
                  <input
                    v-model.number="answers[q.id].valor_escala"
                    type="range"
                    min="1"
                    :max="q.tipo_respuesta === 'ENPS_0_10' ? 10 : 5"
                    class="form-group__control"
                  />
                  <span class="text-xs text-muted">{{ q.tipo_respuesta === 'ENPS_0_10' ? '10 (Totalmente)' : '5 (Totalmente)' }}</span>
                  <span class="badge badge--info">{{ answers[q.id].valor_escala }} pts</span>
                </div>

                <!-- COMENTARIO OPCIONAL -->
                <div class="mt-2">
                  <input
                    v-model="answers[q.id].texto_comentario"
                    class="form-group__control"
                    placeholder="Comentario o sugerencia anónima (opcional)..."
                  />
                </div>
              </div>
            </div>

            <div class="d-flex justify-between align-center mt-4">
              <span class="text-xs text-muted">
                🛡️ Su identidad está protegida criptográficamente. Ningún dato personal es almacenado con sus respuestas.
              </span>
              <button type="submit" class="btn btn--primary" :disabled="submitting">
                {{ submitting ? 'Enviando Voto Ciego...' : 'Emitir Respuestas Anónimas' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-else class="card">
        <div class="card__body text-center text-muted">
          No hay encuestas de clima laboral activas en este momento.
        </div>
      </div>
    </div>

    <!-- TAB 2: RESULTADOS Y eNPS -->
    <div v-if="activeTab === 'results'">
      <div v-if="store.surveyResults" class="mb-4">
        <!-- METRICAS eNPS -->
        <div class="grid-adaptive mb-4">
          <div class="card">
            <div class="card__body">
              <span class="text-muted text-sm">Employee Net Promoter Score (eNPS)</span>
              <h2 class="font-heading mt-1" :class="store.surveyResults.enps.enps >= 0 ? 'text-success' : 'text-danger'">
                {{ store.surveyResults.enps.enps > 0 ? '+' : '' }}{{ store.surveyResults.enps.enps }}
              </h2>
              <span class="text-xs text-muted">Rango: -100 a +100</span>
            </div>
          </div>
          <div class="card">
            <div class="card__body">
              <span class="text-muted text-sm">Promotores (9-10 pts)</span>
              <h3 class="font-heading mt-1 text-success">{{ store.surveyResults.enps.pctPromoters }}%</h3>
              <span class="text-xs text-muted">{{ store.surveyResults.enps.promoters }} colaboradores</span>
            </div>
          </div>
          <div class="card">
            <div class="card__body">
              <span class="text-muted text-sm">Pasivos (7-8 pts)</span>
              <h3 class="font-heading mt-1">{{ store.surveyResults.enps.passives }}</h3>
              <span class="text-xs text-muted">Neutros</span>
            </div>
          </div>
          <div class="card">
            <div class="card__body">
              <span class="text-muted text-sm">Detractores (0-6 pts)</span>
              <h3 class="font-heading mt-1 text-danger">{{ store.surveyResults.enps.pctDetractors }}%</h3>
              <span class="text-xs text-muted">{{ store.surveyResults.enps.detractors }} colaboradores</span>
            </div>
          </div>
        </div>

        <!-- DIMENSIONES EVALUADAS -->
        <div class="card mb-4">
          <div class="card__header">
            <h4 class="font-heading">Promedio por Dimensión Institucional</h4>
          </div>
          <div class="card__body">
            <div v-for="d in store.surveyResults.dimensiones" :key="d.dimension" class="mb-3">
              <div class="d-flex justify-between align-center mb-1">
                <span class="text-bold text-sm">{{ d.dimension }}</span>
                <span class="badge badge--info">{{ d.average }} / 5.0 pts</span>
              </div>
              <div class="badge badge--neutral text-xs">{{ d.count }} respuestas registradas</div>
            </div>
          </div>
        </div>

        <!-- COMENTARIOS ANONIMOS -->
        <div class="card">
          <div class="card__header">
            <h4 class="font-heading">Buzón de Sugerencias y Comentarios Anónimos</h4>
          </div>
          <div class="card__body">
            <div v-if="!store.surveyResults.comentarios?.length" class="text-muted text-center">
              No hay comentarios registrados en esta campaña.
            </div>
            <div v-for="(c, i) in store.surveyResults.comentarios" :key="i" class="card mb-2">
              <div class="card__body">
                <p class="text-sm">"{{ c.texto_comentario }}"</p>
                <div class="d-flex justify-between align-center mt-2">
                  <span class="badge badge--neutral text-xs">{{ c.dimension }}</span>
                  <span class="text-xs text-muted">{{ formatDate(c.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="card">
        <div class="card__body text-center text-muted">
          Cargando métricas consolidadas de la encuesta...
        </div>
      </div>
    </div>

    <!-- TAB 3: CAMPAÑAS HISTORICAS -->
    <div v-if="activeTab === 'campaigns'" class="card">
      <div class="card__header">
        <h4 class="font-heading">Campañas de Clima Institucional</h4>
      </div>
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__th">Título</th>
                <th class="data-table__th">Año</th>
                <th class="data-table__th">Vigencia</th>
                <th class="data-table__th">Participantes</th>
                <th class="data-table__th">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in store.surveys" :key="c.id" class="data-table__row">
                <td class="data-table__td text-bold">{{ c.titulo }}</td>
                <td class="data-table__td">{{ c.periodo_anio || c.anio_gestion }}</td>
                <td class="data-table__td">{{ formatDateRange(c.fecha_inicio, c.fecha_cierre || c.fecha_fin) }}</td>
                <td class="data-table__td">{{ c.total_participantes || c.total_respuestas || 0 }} votos</td>
                <td class="data-table__td">
                  <span class="badge" :class="c.estado === 'ACTIVA' ? 'badge--success' : 'badge--neutral'">
                    {{ c.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useClimateStore } from "../stores/climate.store";
import { useToast } from "../composables/useToast";
import { formatDate, formatDateRange } from "../utils/date";

const store = useClimateStore();
const toast = useToast();
const activeTab = ref("survey");
const submitting = ref(false);
const answers = ref({});

function initAnswers() {
  if (store.activeQuestions && store.activeQuestions.length) {
    const obj = {};
    store.activeQuestions.forEach((q) => {
      obj[q.id] = {
        pregunta_id: q.id,
        valor_escala: q.tipo_respuesta === "ENPS_0_10" ? 8 : 4,
        texto_comentario: "",
      };
    });
    answers.value = obj;
  }
}

async function handleSelectResultsTab() {
  activeTab.value = "results";
  if (store.activeCampaign?.id) {
    await store.fetchSurveyResults(store.activeCampaign.id);
  }
}

async function handleSubmitSurvey() {
  submitting.value = true;
  try {
    const respuestasArray = Object.values(answers.value);
    await store.submitAnonymousResponse(store.activeCampaign.id, {
      respuestas: respuestasArray,
    });
    toast.success("¡Sus respuestas fueron registradas exitosamente de forma anónima!");
  } catch (err) {
    toast.error("Error al emitir encuesta: " + (err.response?.data?.message || err.message));
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await store.fetchActiveSurvey();
  await store.fetchSurveys();
  initAnswers();
});
</script>
