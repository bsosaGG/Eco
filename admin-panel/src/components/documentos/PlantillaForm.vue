<template>
    <form @submit.prevent="submitForm">
        <div class="mb-3">
            <label for="plantillaNombre" class="form-label">Nombre de la Plantilla <span
                    class="text-danger">*</span></label>
            <input type="text" class="form-control" id="plantillaNombre" v-model="form.nombre" required>
            <div class="form-text">Un nombre descriptivo y único para identificar la plantilla.</div>
        </div>

        <div class="mb-3">
            <label for="plantillaDescripcion" class="form-label">Descripción</label>
            <textarea class="form-control" id="plantillaDescripcion" v-model="form.descripcion" rows="3"></textarea>
        </div>

        <div v-if="!isEditing" class="mb-3">
            <label for="plantillaFile" class="form-label">Archivo de Plantilla (.docx) <span
                    class="text-danger">*</span></label>
            <input type="file" class="form-control" id="plantillaFile" @change="handleFileChange"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required>
        </div>
        <div v-if="isEditing" class="alert alert-info small">
            <i class="bi bi-info-circle-fill me-2"></i>
            La edición solo permite modificar los metadatos. Para cambiar el archivo .docx, por favor, elimina esta
            plantilla y sube una nueva.
        </div>

        <div v-if="apiError" class="alert alert-danger mt-3">
            {{ apiError }}
        </div>

        <hr>

        <!-- CORRECCIÓN: Los botones vuelven a estar dentro del formulario. -->
        <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"
                    aria-hidden="true"></span>
                {{ submitButtonText }}
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref, watch, computed, type PropType } from 'vue';
import { useDocumentosStore, type Plantilla } from '@/stores/documentos.store';

const props = defineProps({
    initialData: {
        type: Object as PropType<Plantilla | null>,
        default: null,
    },
});

const emit = defineEmits(['success', 'cancel']);
const documentosStore = useDocumentosStore();

const isSubmitting = ref(false);
const apiError = ref<string | null>(null);
const form = ref({
    nombre: '',
    descripcion: '',
    file: null as File | null,
});

const isEditing = computed(() => !!props.initialData);
const submitButtonText = computed(() => {
    if (isSubmitting.value) {
        return isEditing.value ? 'Guardando...' : 'Añadiendo...';
    }
    return isEditing.value ? 'Guardar Cambios' : 'Añadir Plantilla';
});

watch(() => props.initialData, (newData) => {
    apiError.value = null;
    if (newData) {
        form.value.nombre = newData.nombre;
        form.value.descripcion = newData.descripcion || '';
        form.value.file = null;
    } else {
        form.value.nombre = '';
        form.value.descripcion = '';
        form.value.file = null;
    }
}, { immediate: true });

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        form.value.file = target.files[0];
    }
};

const submitForm = async () => {
    isSubmitting.value = true;
    apiError.value = null;

    try {
        if (isEditing.value && props.initialData) {
            await documentosStore.updatePlantilla(props.initialData.id_plantilla, {
                nombre: form.value.nombre,
                descripcion: form.value.descripcion,
            });
        } else {
            const formData = new FormData();
            formData.append('nombre', form.value.nombre);
            formData.append('descripcion', form.value.descripcion);
            if (form.value.file) {
                formData.append('plantilla', form.value.file);
            }
            await documentosStore.addPlantilla(formData);
        }
        emit('success');
    } catch (error: any) {
        apiError.value = documentosStore.error;
    } finally {
        isSubmitting.value = false;
    }
};
</script>