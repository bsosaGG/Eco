<template>
  <div class="pm pm-page pm-narrow">
    <header class="pm-header">
      <h1>Nuevo expediente</h1>
      <p>
        Cargue el Brief unificado para crear un nuevo expediente. El análisis y las recomendaciones de medios se
        extraen del mismo documento.
      </p>
      <p class="pm-header-links">
        <router-link :to="{ name: 'Expedientes' }">Ver expedientes existentes →</router-link>
      </p>
    </header>

    <section class="card">
      <AlertMessage type="error" :text="error" />

      <form @submit.prevent="submit">
        <div class="field">
          <label for="brief">Brief</label>
          <input id="brief" ref="fileInput" type="file" accept=".pdf,.docx" required @change="onFile" />
          <span class="help">Formatos permitidos: PDF y DOCX. Máximo 25 MB.</span>
          <span v-if="file && file.name.toLowerCase().endsWith('.pdf')" class="help">
            Un PDF no se lee automáticamente: el formulario se creará en blanco para llenarlo manualmente.
          </span>
        </div>

        <button type="submit" :disabled="uploading || !file">
          {{ uploading ? 'Creando expediente…' : 'Crear expediente' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AlertMessage from '../components/common/AlertMessage.vue';
import service from '../services/planMedios.service';
import { errorMessage } from '../services/api';

const MAX_BYTES = 25 * 1024 * 1024;

const router = useRouter();
const file = ref(null);
const uploading = ref(false);
const error = ref('');

function onFile(event) {
  error.value = '';
  const selected = event.target.files[0] || null;
  if (selected && selected.size > MAX_BYTES) {
    error.value = 'Brief: El archivo supera el límite de 25 MB.';
    event.target.value = '';
    file.value = null;
    return;
  }
  file.value = selected;
}

async function submit() {
  if (!file.value) return;
  uploading.value = true;
  error.value = '';
  try {
    const created = await service.createExpediente(file.value);
    router.push({ name: 'ExpedienteDetail', params: { id: created.expediente_id }, query: { stage: '1' } });
  } catch (e) {
    error.value = errorMessage(e, 'No fue posible crear el expediente.');
  } finally {
    uploading.value = false;
  }
}
</script>
