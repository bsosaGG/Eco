<template>
  <div class="pm pm-page">
    <header class="pm-header">
      <h1>Formulario Automatizado de Plan de Medios</h1>
      <p class="pm-header-links">
        <router-link :to="{ name: 'Expedientes' }">← Ver expedientes</router-link>
        <template v-if="store.id && !store.loadError">
          &nbsp;·&nbsp;
          <router-link :to="{ name: 'ExpedienteAudit', params: { id: store.id } }">Ver auditoría de selecciones →</router-link>
        </template>
      </p>
    </header>

    <div v-if="store.loading" class="text-center text-gray-400 py-12">Cargando expediente...</div>

    <section v-else-if="store.loadError" class="card">
      <AlertMessage type="error" :text="store.loadError" />
      <router-link :to="{ name: 'Expedientes' }" class="pm-link">Volver al listado</router-link>
    </section>

    <section v-else class="card summary-card">
      <div class="message-bar">
        <span class="expediente">Expediente: {{ store.id }}</span>
        <StatusPill :status="store.meta.status" />
      </div>
      <AlertMessage :type="store.notice.type" :text="store.notice.text" />

      <h2>Formulario extraído del Brief</h2>
      <p>Los campos fueron extraídos automáticamente del Brief. Revise y edite cualquier información antes de continuar.</p>

      <StageNav :current="store.stage" @go="navigateTo" />

      <div v-show="store.stage === 1"><BriefFieldsStage /></div>
      <div v-show="store.stage === 2"><PrioritiesStage /></div>
      <div v-show="store.stage === 3"><MediaPlanningStage /></div>
      <div v-if="store.stage === 4"><PurchaseRequestsStage /></div>

      <WorkflowActions :stage="store.stage" @prev="navigateTo(store.stage - 1)" @next="navigateTo(store.stage + 1)"
        @save="save" @generate="generate" />
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import AlertMessage from '../components/common/AlertMessage.vue';
import StatusPill from '../components/common/StatusPill.vue';
import StageNav from '../components/expediente/StageNav.vue';
import WorkflowActions from '../components/expediente/WorkflowActions.vue';
import BriefFieldsStage from '../components/stage1/BriefFieldsStage.vue';
import PrioritiesStage from '../components/stage2/PrioritiesStage.vue';
import MediaPlanningStage from '../components/stage3/MediaPlanningStage.vue';
import PurchaseRequestsStage from '../components/stage4/PurchaseRequestsStage.vue';
import { useExpedienteStore } from '../stores/expediente.store';
import { MAX_STAGE, MIN_STAGE } from '../utils/constants';

const route = useRoute();
const router = useRouter();
const store = useExpedienteStore();

const parseStage = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= MIN_STAGE && n <= MAX_STAGE ? n : MIN_STAGE;
};

/** Muestra una etapa y la refleja en la URL (?stage=N) para poder recargar o compartir el enlace. */
function showStage(stage) {
  let target = parseStage(stage);
  // Las solicitudes de compra requieren que todas las justificaciones obligatorias estén completas.
  if (target > 3 && store.missingJustification.size) target = 3;
  store.setStage(target);
  if (parseStage(route.query.stage) !== target) router.replace({ query: { ...route.query, stage: String(target) } });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Avanzar guarda lo editado; retroceder no necesita guardar (los datos siguen en pantalla). */
async function navigateTo(target) {
  const next = parseStage(target);
  if (next === store.stage) return;
  if (next < store.stage) return showStage(next);

  const result = await store.save(next > 3 ? 'continue' : 'draft');
  if (!result.ok) {
    if (result.stage) showStage(result.stage);
    return;
  }
  showStage(next);
}

async function save() {
  const result = await store.save('draft');
  if (!result.ok && result.stage) showStage(result.stage);
}

async function generate() {
  const result = await store.generatePlan();
  if (!result.ok && result.stage) showStage(result.stage);
}

// Aviso antes de cerrar la pestaña con cambios sin guardar.
const warnUnsaved = (event) => {
  if (!store.saved && store.hasSelectedMedia) {
    event.preventDefault();
    event.returnValue = '';
  }
};

async function open() {
  const loaded = await store.load(route.params.id);
  if (loaded) showStage(route.query.stage);
}

onMounted(() => {
  window.addEventListener('beforeunload', warnUnsaved);
  open();
});
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnUnsaved));

// Cambio de expediente dentro de la misma vista, o botón "atrás" del navegador entre etapas.
watch(() => route.params.id, (id, previous) => { if (id && id !== previous) open(); });
watch(() => route.query.stage, (stage) => { if (!store.loading && parseStage(stage) !== store.stage) showStage(stage); });

onBeforeRouteLeave(() => {
  if (!store.saved && store.hasSelectedMedia && store.id) {
    return window.confirm('Hay cambios sin guardar. ¿Desea salir de todos modos?');
  }
  return true;
});
</script>
