<template>
    <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Gestor de Plantillas de Documentos</h1>
            <div class="d-flex flex-wrap justify-content-end gap-2">
                <button class="btn btn-primary" @click="openAddModal">
                    <i class="bi bi-file-earmark-plus me-2"></i>Añadir Plantilla
                </button>
            </div>
        </div>

        <!-- Error general para carga o borrado -->
        <div v-if="apiError" class="alert alert-danger">
            <strong>Error:</strong> {{ apiError }}
        </div>

        <div v-if="documentosStore.isLoading && !documentosStore.plantillas.length" class="text-center mt-5">
            <div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div>
            <p class="mt-2">Cargando plantillas...</p>
        </div>

        <div v-else>
            <div v-if="documentosStore.plantillas.length" class="row g-4">
                <div v-for="plantilla in documentosStore.plantillas" :key="plantilla.id_plantilla"
                    class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <PlantillaCard :plantilla="plantilla" @edit="handleEdit" @delete="handleDelete"
                        @generate="handleOpenGenerate" />
                </div>
            </div>
            <div v-else class="alert alert-info">
                No hay plantillas creadas todavía. ¡Añade la primera!
            </div>
        </div>

        <!-- CORRECCIÓN: Usamos la prop 'hide-footer' para eliminar el pie de página por defecto -->
        <BaseModal :is-open="isFormModalOpen" @close="closeFormModal" :hide-footer="true">
            <template #header>{{ formModalTitle }}</template>
            <template #body>
                <PlantillaForm v-if="isFormModalOpen" :initial-data="plantillaToEdit" @success="closeFormModal"
                    @cancel="closeFormModal" />
            </template>
        </BaseModal>

        <BaseModal :is-open="isGenerateModalOpen" @close="closeGenerateModal" :hide-footer="true">
            <template #header>Generar Documento</template>
            <template #body>
                <GenerarDocumentoForm v-if="isGenerateModalOpen" :plantilla="plantillaToGenerate"
                    @cancel="closeGenerateModal" />
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDocumentosStore, type Plantilla } from '@/stores/documentos.store';
import BaseModal from '@/components/shared/BaseModal.vue';
import PlantillaCard from '@/components/documentos/PlantillaCard.vue';
import PlantillaForm from '@/components/documentos/PlantillaForm.vue';
import GenerarDocumentoForm from '@/components/documentos/GenerarDocumentoForm.vue';

const documentosStore = useDocumentosStore();
const apiError = ref<string | null>(null);

const isFormModalOpen = ref(false);
const plantillaToEdit = ref<Plantilla | null>(null);
const formModalTitle = computed(() => plantillaToEdit.value ? 'Editar Plantilla' : 'Añadir Nueva Plantilla');

const isGenerateModalOpen = ref(false);
const plantillaToGenerate = ref<Plantilla | null>(null);

onMounted(async () => {
    try {
        apiError.value = null;
        await documentosStore.fetchPlantillas();
    } catch {
        apiError.value = documentosStore.error;
    }
});

const openAddModal = () => {
    apiError.value = null;
    plantillaToEdit.value = null;
    isFormModalOpen.value = true;
};

const closeFormModal = () => {
    isFormModalOpen.value = false;
    plantillaToEdit.value = null;
};

const handleEdit = (plantilla: Plantilla) => {
    apiError.value = null;
    plantillaToEdit.value = { ...plantilla };
    isFormModalOpen.value = true;
};

const handleDelete = async (plantilla: Plantilla) => {
    apiError.value = null;
    if (window.confirm(`¿Estás seguro de que quieres eliminar la plantilla "${plantilla.nombre}"?`)) {
        try {
            await documentosStore.deletePlantilla(plantilla.id_plantilla);
        } catch (error) {
            apiError.value = documentosStore.error;
        }
    }
};

const openGenerateModal = () => { isGenerateModalOpen.value = true; };
const closeGenerateModal = () => { isGenerateModalOpen.value = false; plantillaToGenerate.value = null; };
const handleOpenGenerate = (plantilla: Plantilla) => {
    plantillaToGenerate.value = plantilla;
    openGenerateModal();
};
</script>