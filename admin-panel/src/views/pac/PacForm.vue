<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>{{ isEditing ? 'Editar Solicitud' : 'Nueva Solicitud de Compra' }}</h1>
            <RouterLink to="/pac" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-2"></i>Volver al Dashboard
            </RouterLink>
        </div>

        <div v-if="isLoading" class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        </div>

        <div v-else class="card">
            <div class="card-body">
                <form @submit.prevent="handleSubmit">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="unidad" class="form-label">Unidad Solicitante</label>
                            <select id="unidad" class="form-select" v-model="formData.id_unidad_solicitante" required>
                                <option disabled value="">Seleccione una unidad</option>
                                <option v-for="u in catalogStore.unidades" :key="u.value" :value="u.value">{{ u.text }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="modalidad" class="form-label">Modalidad de Compra</label>
                            <select id="modalidad" class="form-select" v-model="formData.id_modalidad_compra" required>
                                <option disabled value="">Seleccione una modalidad</option>
                                <option v-for="m in catalogStore.modalidades" :key="m.value" :value="m.value">{{ m.text
                                    }}</option>
                            </select>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="renglon" class="form-label">Renglón Presupuestario</label>
                            <select id="renglon" class="form-select" v-model="formData.id_renglon" required>
                                <option disabled value="">Seleccione un renglón</option>
                                <option v-for="r in catalogStore.renglones" :key="r.value" :value="r.value">{{ r.text }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="unidadMedida" class="form-label">Unidad de Medida</label>
                            <input type="text" id="unidadMedida" class="form-control" v-model="formData.unidad_medida"
                                placeholder="Ej: Servicio, Unidad..." required />
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="descripcion" class="form-label">Descripción Detallada</label>
                        <textarea id="descripcion" class="form-control" rows="3" v-model="formData.descripcion"
                            required></textarea>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="bajaCuantia"
                            v-model="formData.es_baja_cuantia">
                        <label class="form-check-label" for="bajaCuantia">
                            Es Compra de Baja Cuantía
                        </label>
                    </div>

                    <hr>

                    <h5 class="mt-4">Planificación Mensual (Opcional)</h5>
                    <div class="row">
                        <div v-for="month in months" :key="month.key" class="col-12 col-md-6 col-lg-3 mb-3">
                            <div class="card bg-light">
                                <div class="card-header text-center fw-bold">{{ month.name }}</div>
                                <div class="card-body">
                                    <label :for="`cantidad_${month.key}`" class="form-label small">Cantidad</label>
                                    <input type="number" :id="`cantidad_${month.key}`"
                                        class="form-control form-control-sm"
                                        v-model.number="formData[`cantidad_${month.key}`]">

                                    <label :for="`monto_${month.key}`" class="form-label small mt-2">Monto (Q)</label>
                                    <input type="number" :id="`monto_${month.key}`" class="form-control form-control-sm"
                                        step="0.01" v-model.number="formData[`monto_${month.key}`]">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex justify-content-end mt-4">
                        <RouterLink to="/pac" class="btn btn-secondary me-2">Cancelar</RouterLink>
                        <button type="submit" class="btn btn-primary" :disabled="pacStore.isLoading">
                            <span v-if="pacStore.isLoading" class="spinner-border spinner-border-sm" role="status"
                                aria-hidden="true"></span>
                            {{ isEditing ? 'Guardar Cambios' : 'Crear Solicitud' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useCatalogStore } from '@/stores/catalog.store';
import { usePacStore } from '@/stores/pac.store';

const route = useRoute();
const router = useRouter();
const catalogStore = useCatalogStore();
const pacStore = usePacStore();

const isEditing = ref(false);
const isLoading = ref(false); // Estado de carga local para el llenado inicial
const requestId = ref<string | null>(null);

const months = [
    { key: 'enero', name: 'Enero' }, { key: 'febrero', name: 'Febrero' }, { key: 'marzo', name: 'Marzo' },
    { key: 'abril', name: 'Abril' }, { key: 'mayo', name: 'Mayo' }, { key: 'junio', name: 'Junio' },
    { key: 'julio', name: 'Julio' }, { key: 'agosto', name: 'Agosto' }, { key: 'septiembre', name: 'Septiembre' },
    { key: 'octubre', name: 'Octubre' }, { key: 'noviembre', name: 'Noviembre' }, { key: 'diciembre', name: 'Diciembre' },
];

// Inicializar formData con todos los campos necesarios
const formData = reactive<any>({
    id_unidad_solicitante: '',
    id_modalidad_compra: '',
    id_renglon: '',
    descripcion: '',
    unidad_medida: '',
    es_baja_cuantia: false,
});

months.forEach(month => {
    formData[`cantidad_${month.key}`] = 0;
    formData[`monto_${month.key}`] = 0;
});


onMounted(async () => {
    isLoading.value = true;
    await catalogStore.fetchAllCatalogs();

    if (route.params.id) {
        isEditing.value = true;
        requestId.value = route.params.id as string;
        const existingData = await pacStore.fetchRequestById(requestId.value);
        if (existingData) {
            // Llenar el formulario con los datos existentes
            Object.assign(formData, existingData);
        }
    }
    isLoading.value = false;
});

const handleSubmit = async () => {
    try {
        if (isEditing.value && requestId.value) {
            await pacStore.updateRequest(requestId.value, formData);
        } else {
            await pacStore.createRequest(formData);
        }
    } catch (error) {
        console.error("Error al guardar la solicitud:", error);
        // Aquí podrías mostrar una notificación de error al usuario
    }
};
</script>

<style scoped>
/* Estilos opcionales para mejorar la apariencia */
.card-header {
    background-color: #f8f9fa;
}
</style>