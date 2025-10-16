<template>
    <div>
        <div class="alert alert-secondary">
            Estás a punto de generar un documento usando la plantilla:
            <br>
            <strong class="text-dark">{{ plantilla?.nombre }}</strong>
        </div>

        <form @submit.prevent="submitGeneration">
            <div class="mb-3">
                <label for="jsonData" class="form-label">Datos de la Plantilla (en formato JSON)</label>
                <textarea class="form-control" id="jsonData" rows="10" v-model="jsonInput" placeholder='{
  "nombre": "Juan Pérez",
  "items": [
    { "producto": "Laptop", "precio": 1200 },
    { "producto": "Mouse", "precio": 25 }
  ]
}' :class="{ 'is-invalid': jsonError }"></textarea>
                <div v-if="jsonError" class="invalid-feedback">
                    {{ jsonError }}
                </div>
                <div v-else class="form-text">
                    Pega aquí el objeto JSON con los datos para rellenar la plantilla.
                </div>
            </div>

            <div v-if="apiError" class="alert alert-danger">
                <strong>Error de la API:</strong> {{ apiError }}
            </div>

            <hr>

            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Cancelar</button>
                <button type="submit" class="btn btn-success" :disabled="isGenerating || !!jsonError">
                    <span v-if="isGenerating" class="spinner-border spinner-border-sm" role="status"
                        aria-hidden="true"></span>
                    {{ isGenerating ? 'Generando...' : 'Generar y Descargar' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';
import { useDocumentosStore, type Plantilla } from '@/stores/documentos.store';

const props = defineProps({
    plantilla: {
        type: Object as PropType<Plantilla | null>,
        required: true,
    },
});

const emit = defineEmits(['cancel']);

const documentosStore = useDocumentosStore();

const isGenerating = ref(false);
const jsonInput = ref('');
const jsonError = ref<string | null>(null);
const apiError = ref<string | null>(null);

// Watcher para validar el JSON en tiempo real mientras el usuario escribe
watch(jsonInput, (newVal) => {
    apiError.value = null; // Limpiar errores de API anteriores
    if (newVal.trim() === '') {
        jsonError.value = 'El campo JSON no puede estar vacío.';
        return;
    }
    try {
        JSON.parse(newVal);
        jsonError.value = null; // El JSON es válido
    } catch (e) {
        jsonError.value = 'El texto introducido no es un JSON válido.';
    }
});

const submitGeneration = async () => {
    if (jsonError.value || !props.plantilla) return;

    isGenerating.value = true;
    apiError.value = null;

    try {
        const datos = JSON.parse(jsonInput.value);
        const { url, filename } = await documentosStore.generateDocumento(props.plantilla.id_plantilla, datos);

        // Creamos un enlace <a> invisible, lo "clicamos" para iniciar la descarga y luego lo eliminamos.
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Limpieza
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Éxito, cerramos el modal
        emit('cancel');

    } catch (error: any) {
        apiError.value = error.message || 'Ocurrió un error inesperado.';
    } finally {
        isGenerating.value = false;
    }
};
</script>

<style scoped>
.form-control {
    font-family: monospace;
    font-size: 0.9rem;
}
</style>