<template>
    <div class="card h-100 d-flex flex-column">
        <div class="card-header">
            <h5 class="card-title mb-0 text-truncate" :title="plantilla.nombre">
                <i class="bi bi-file-earmark-word me-2"></i>{{ plantilla.nombre }}
            </h5>
        </div>
        <div class="card-body flex-grow-1">
            <p class="card-text">{{ plantilla.descripcion || 'Esta plantilla no tiene una descripción.' }}</p>
        </div>
        <div class="card-footer text-body-secondary small">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>Archivo:</span>
                <span class="fw-bold text-truncate" :title="plantilla.nombre_archivo_original">{{
                    plantilla.nombre_archivo_original }}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <span>Tamaño:</span>
                <span class="fw-bold">{{ formattedFileSize }}</span>
            </div>
        </div>
        <div class="card-footer p-0">
            <div class="d-grid gap-2 d-md-flex justify-content-md-end m-2">
                <button class="btn btn-success btn-sm" @click="$emit('generate', plantilla)">
                    <i class="bi bi-play-fill me-1"></i> Generar
                </button>
                <button class="btn btn-outline-primary btn-sm" @click="$emit('edit', plantilla)">
                    <i class="bi bi-pencil me-1"></i> Editar
                </button>
                <button class="btn btn-outline-danger btn-sm" @click="$emit('delete', plantilla)">
                    <i class="bi bi-trash me-1"></i> Eliminar
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { Plantilla } from '@/stores/documentos.store';

// 1. Definimos las props que el componente recibe del padre
const props = defineProps({
    plantilla: {
        type: Object as PropType<Plantilla>,
        required: true,
    },
});

// 2. Definimos los eventos que el componente puede emitir hacia el padre
const emit = defineEmits(['edit', 'delete', 'generate']);

// 3. Una propiedad computada para formatear el tamaño del archivo de forma legible
const formattedFileSize = computed(() => {
    const sizeInBytes = props.plantilla.tamano_archivo;
    if (sizeInBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
    return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});
</script>

<style scoped>
.card-title {
    font-size: 1.1rem;
}

.card-text {
    font-size: 0.9rem;
}

.text-truncate {
    max-width: 200px;
    /* Ajusta según sea necesario para evitar que el texto se desborde */
}
</style>