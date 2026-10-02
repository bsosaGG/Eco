<template>
  <form class="purchase-request-card" @submit.prevent="generate">
    <h4>Solicitud de Compra {{ index + 1 }}</h4>
    <p class="purchase-profile">Perfil público del servicio: <strong>{{ publicProfile }}</strong></p>

    <div class="purchase-grid">
      <div class="purchase-field"><label>No. correlativo</label>
        <input v-model="form.request_number" type="text" placeholder="Ej. UM-000/2026" /></div>
      <div class="purchase-field"><label>Fecha</label>
        <input v-model="form.request_date" type="text" placeholder="Se usará la fecha actual si queda vacío" /></div>
      <div class="purchase-field"><label>Renglón presupuestario</label>
        <input v-model="form.budget_line" type="text" /></div>
      <div class="purchase-field"><label>Código de insumo</label>
        <input v-model="form.supply_code" type="text" /></div>
      <div class="purchase-field"><label>Cantidad</label>
        <input v-model="form.quantity" type="text" /></div>
      <div class="purchase-field"><label>Unidad de medida</label>
        <input v-model="form.unit" type="text" /></div>
    </div>

    <details class="purchase-preview">
      <summary>Ver descripción y características técnicas</summary>
      <p><strong>Descripción</strong></p>
      <pre class="purchase-description">{{ preview.description }}</pre>
      <p><strong>Características técnicas</strong></p>
      <pre class="purchase-technical">{{ preview.technical }}</pre>
    </details>

    <div class="purchase-field">
      <label>Justificación</label>
      <textarea v-model="form.justification" class="purchase-justification"
        placeholder="Preparando justificación base…"></textarea>
      <span class="help">Este texto es editable y será el que se incorpore a la Solicitud de Compra.</span>
    </div>

    <div class="ai-justification-tools">
      <p><strong>IA local experimental.</strong> Puede solicitar una redacción alternativa mediante Ollama. En el
        servidor actual la respuesta puede tardar varios minutos. El texto nunca se aplica automáticamente.</p>
      <button type="button" class="ai-generate-button" :disabled="ai.loading" @click="generateDraft">
        {{ ai.loading ? 'Generando con IA…' : 'Generar texto con IA' }}
      </button>
      <p class="ai-status" :class="ai.error ? 'error-text' : ai.draft ? 'success-text' : ''" aria-live="polite">
        {{ ai.status }}
      </p>
      <div v-if="ai.draft" class="ai-draft">
        <textarea :value="ai.draft" readonly></textarea>
        <button type="button" class="ai-use-button" @click="useDraft">Usar texto generado</button>
      </div>
    </div>

    <p v-if="error" class="ai-status error-text" role="alert">{{ error }}</p>
    <button type="submit" class="purchase-generate-button" :disabled="generating">
      {{ generating ? 'Generando…' : 'Generar Solicitud de Compra' }}
    </button>
  </form>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import service from '../../services/planMedios.service';
import { errorMessage, errorMessageFromBlob } from '../../services/api';
import { useExpedienteStore } from '../../stores/expediente.store';
import { saveBlob } from '../../utils/format';

const props = defineProps({
  index: { type: Number, required: true },
  entry: { type: Object, required: true },
});

const store = useExpedienteStore();

// Si la solicitud ya se generó antes, el formulario arranca con esos datos.
const previous = store.meta.purchaseRequests.find((r) => r.media_entry_index === props.index) || {};
const form = reactive({
  request_number: previous.request_number || '',
  request_date: previous.request_date || '',
  budget_line: previous.budget_line || '',
  supply_code: previous.supply_code || 'N/A',
  quantity: previous.quantity || '1',
  unit: previous.unit || 'SERVICIO',
  justification: previous.justification || '',
});
const preview = reactive({ description: 'Preparando…', technical: 'Preparando…' });
const ai = reactive({ loading: false, status: '', draft: '', error: false });
const error = ref('');
const generating = ref(false);

const publicProfile = computed(
  () => props.entry.profile || props.entry.category || 'Servicio de comunicación'
);

// La descripción y la justificación base las arma el servidor (no identifican al medio ni al proveedor).
async function prepare() {
  try {
    const result = await service.prepararSolicitud(store.id, props.index, { ...form });
    preview.description = result.request.description || '';
    preview.technical = result.request.technical_specifications || '';
    if (!form.justification.trim()) form.justification = result.request.justification || '';
  } catch (e) {
    preview.description = errorMessage(e, 'No fue posible preparar la solicitud.');
    preview.technical = '';
  }
}

async function generateDraft() {
  ai.loading = true;
  ai.error = false;
  ai.draft = '';
  ai.status = 'Ollama está generando el borrador. Puede continuar revisando el formulario mientras espera.';
  try {
    const data = await service.justificacionIA(store.id, props.index);
    ai.draft = data.justification || '';
    const seconds = data.performance?.total_duration_seconds;
    ai.status = seconds
      ? `Borrador generado con ${data.model} en ${seconds} segundos. Revíselo antes de usarlo.`
      : `Borrador generado con ${data.model}. Revíselo antes de usarlo.`;
  } catch (e) {
    ai.error = true;
    ai.status = errorMessage(e, 'No fue posible generar el texto con IA.');
  } finally {
    ai.loading = false;
  }
}

function useDraft() {
  form.justification = ai.draft;
  ai.error = false;
  ai.status = 'El borrador fue aplicado al campo de Justificación. Puede editarlo antes de generar el Excel.';
}

async function generate() {
  generating.value = true;
  error.value = '';
  try {
    const response = await service.generarSolicitud(store.id, props.index, { ...form });
    saveBlob(response.data, `solicitud_compra_${store.id}_${props.index + 1}.xlsx`);
  } catch (e) {
    error.value = `No fue posible generar la Solicitud de Compra: ${await errorMessageFromBlob(e, 'error desconocido')}`;
  } finally {
    generating.value = false;
  }
}

onMounted(prepare);
</script>
