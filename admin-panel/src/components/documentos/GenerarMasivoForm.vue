<template>
    <div>
        <div class="alert alert-secondary">
            <p class="mb-1">Vas a generar documentos masivamente usando la plantilla:</p>
            <strong class="text-dark">{{ plantilla?.nombre }}</strong>
        </div>

        <form @submit.prevent="submitGeneration">
            <div class="mb-3">
                <label for="spreadsheetFile" class="form-label">Archivo de Hoja de Cálculo (.xlsx, .ods) <span
                        class="text-danger">*</span></label>
                <input type="file" class="form-control" id="spreadsheetFile" @change="handleFileChange"
                    accept=".xlsx,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet"
                    required>
                <div class="form-text">
                    Asegúrate de que los encabezados de la primera fila coincidan con las variables de tu plantilla.
                </div>
            </div>

            <div v-if="apiError" class="alert alert-danger">
                <strong>Error:</strong> {{ apiError }}
            </div>

            <hr>

            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Cancelar</button>
                <button type="submit" class="btn btn-success" :disabled="isGenerating || !file">
                    <span v-if="isGenerating" class="spinner-border spinner-border-sm" role="status"
                        aria-hidden="true"></span>
                    {{ isGenerating ? 'Generando ZIP...' : 'Generar y Descargar ZIP' }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
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
const apiError = ref<string | null>(null);
const file = ref<File | null>(null);

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        file.value = target.files[0];
    } else {
        file.value = null;
    }
};

const submitGeneration = async () => {
    if (!file.value || !props.plantilla) return;

    isGenerating.value = true;
    apiError.value = null;

    const formData = new FormData();
    formData.append('spreadsheet', file.value);

    try {
        const { url, filename } = await documentosStore.generateBulk(props.plantilla.id_plantilla, formData);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        emit('cancel'); // Cerramos el modal si todo fue exitoso

    } catch (error: any) {
        apiError.value = error.message || 'Ocurrió un error inesperado.';
    } finally {
        isGenerating.value = false;
    }
};
</script>