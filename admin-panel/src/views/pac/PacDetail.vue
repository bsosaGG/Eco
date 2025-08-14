<template>
    <div>
        <div v-if="pacStore.isLoading && !pacStore.currentRequest" class="text-center p-5">
            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span>
            </div>
        </div>
        <div v-else-if="pacStore.error || !pacStore.currentRequest" class="alert alert-danger">
            {{ pacStore.error || 'No se pudo cargar la solicitud.' }}
        </div>
        <div v-else>
            <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <div>
                    <p class="text-muted mb-0">Plan Anual de Compras / Detalle de Solicitud</p>
                    <h1 class="h2 fw-bold">Detalle: {{ pacStore.currentRequest.codigo_solicitud }}</h1>
                </div>
                <div class="mt-2 mt-md-0">
                    <RouterLink to="/pac" class="btn btn-outline-secondary me-2">
                        <i class="bi bi-arrow-left"></i> Volver
                    </RouterLink>
                    <RouterLink v-if="authStore.hasPermission('pac-item:update')"
                        :to="`/pac/edit/${encodeURIComponent(pacStore.currentRequest.codigo_solicitud)}`"
                        class="btn btn-primary">
                        <i class="bi bi-pencil me-2"></i>Editar
                    </RouterLink>
                </div>
            </div>

            <div class="row">
                <div class="col-lg-7">
                    <div class="card mb-4">
                        <div class="card-header fw-bold">Información General</div>
                        <div class="card-body">
                            <dl class="row">
                                <dt class="col-sm-4 text-muted">Descripción Detallada</dt>
                                <dd class="col-sm-8">{{ pacStore.currentRequest.descripcion }}</dd>

                                <dt class="col-sm-4 text-muted">Unidad Solicitante</dt>
                                <dd class="col-sm-8">{{ pacStore.currentRequest.unidad_solicitante }}</dd>

                                <dt class="col-sm-4 text-muted">Modalidad de Compra</dt>
                                <dd class="col-sm-8">{{ pacStore.currentRequest.modalidad_compra }}</dd>

                                <dt class="col-sm-4 text-muted">Unidad de Medida</dt>
                                <dd class="col-sm-8">{{ pacStore.currentRequest.unidad_medida }}</dd>

                                <dt class="col-sm-4 text-muted">Renglón Presupuestario</dt>
                                <dd class="col-sm-8">{{ pacStore.currentRequest.numero_renglon }} - {{
                                    pacStore.currentRequest.nombre_renglon }}</dd>
                            </dl>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header fw-bold">Historial de Cambios</div>
                        <ul class="list-group list-group-flush"
                            v-if="pacStore.currentRequest.historial && pacStore.currentRequest.historial.length">
                            <li v-for="log in pacStore.currentRequest.historial" :key="log.fecha_cambio"
                                class="list-group-item">
                                <p class="mb-0"><strong>{{ log.estado }}</strong> - <span class="text-muted">{{
                                    log.usuario_cambio }}</span></p>
                                <p v-if="log.comentario" class="mb-0 fst-italic text-muted">"{{ log.comentario }}"</p>
                                <small class="text-muted">{{ new Date(log.fecha_cambio).toLocaleString() }}</small>
                            </li>
                        </ul>
                        <div v-else class="card-body text-muted">No hay historial de cambios.</div>
                    </div>
                </div>
                <div class="col-lg-5">
                    <div class="card mb-4">
                        <div class="card-header fw-bold">Estado y Finanzas</div>
                        <div class="card-body text-center">
                            <h6 class="text-muted text-uppercase small">Fase Actual</h6>
                            <span class="badge fs-6"
                                :class="`bg-${pacStore.currentRequest.estado_color || 'secondary'}`">{{
                                    pacStore.currentRequest.estado }}</span>
                            <hr>
                            <h6 class="text-muted text-uppercase small">Monto Total Estimado</h6>
                            <h2 class="fw-bold text-primary">{{ pacStore.currentRequest.monto_total }}</h2>
                        </div>
                    </div>
                    <div class="card" v-if="authStore.hasPermission('pac-item:manage-status')">
                        <div class="card-header fw-bold">Gestionar Solicitud</div>
                        <div class="card-body">
                            <form @submit.prevent="handleStatusChange">
                                <div class="mb-3">
                                    <label for="nuevoEstado" class="form-label">Cambiar Estado</label>
                                    <select id="nuevoEstado" class="form-select" v-model="statusData.nuevoEstadoId"
                                        required>
                                        <option disabled value="">Seleccione un nuevo estado...</option>
                                        <option v-for="e in catalogStore.estados" :key="e.value" :value="e.value">{{
                                            e.text }}</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="comentario" class="form-label">Comentario (Opcional)</label>
                                    <textarea id="comentario" class="form-control" rows="3"
                                        v-model="statusData.comentario"></textarea>
                                </div>
                                <button type="submit" class="btn btn-secondary w-100" :disabled="pacStore.isLoading">
                                    <span v-if="pacStore.isLoading" class="spinner-border spinner-border-sm"
                                        role="status" aria-hidden="true"></span>
                                    Actualizar Estado
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { usePacStore } from '@/stores/pac.store';
import { useAuthStore } from '@/stores/auth.store';
import { useCatalogStore } from '@/stores/catalog.store';

const route = useRoute();
const pacStore = usePacStore();
const authStore = useAuthStore();
const catalogStore = useCatalogStore();

const statusData = reactive({
    nuevoEstadoId: '',
    comentario: ''
});

onMounted(() => {
    const requestId = decodeURIComponent(route.params.id as string);
    pacStore.fetchRequestById(requestId);
    catalogStore.fetchAllCatalogs();
});

const handleStatusChange = async () => {
    if (!statusData.nuevoEstadoId) {
        alert("Por favor, seleccione un nuevo estado.");
        return;
    }

    const requestId = decodeURIComponent(route.params.id as string);
    try {
        await pacStore.changeRequestStatus(requestId, {
            nuevoEstadoId: parseInt(statusData.nuevoEstadoId, 10),
            comentario: statusData.comentario
        });
        statusData.nuevoEstadoId = '';
        statusData.comentario = '';
    } catch (error) {
        console.error("Error al actualizar el estado:", error);
    }
};
</script>

<style scoped>
/* Agregamos estilos para las listas de descripción (dl, dt, dd) */
dl.row dt {
    font-weight: 600;
}
</style>