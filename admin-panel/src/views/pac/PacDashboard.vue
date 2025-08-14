<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Plan Anual de Compras</h1>
            <RouterLink v-if="authStore.hasPermission('pac-item:create')" to="/pac/create" class="btn btn-primary">
                <i class="bi bi-plus-circle me-2"></i>Crear Solicitud
            </RouterLink>
        </div>

        <div class="card">
            <div class="card-body">
                <h5 class="card-title mb-3">Filtros</h5>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="unidadFiltro" class="form-label">Unidad Solicitante</label>
                        <select id="unidadFiltro" class="form-select" v-model="filters.unidad">
                            <option :value="null">Todas</option>
                            <option v-for="u in catalogStore.unidades" :key="u.value" :value="u.value">
                                {{ u.text }}
                            </option>
                        </select>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="estadoFiltro" class="form-label">Estado</label>
                        <select id="estadoFiltro" class="form-select" v-model="filters.estado">
                            <option :value="null">Todos</option>
                            <option v-for="e in catalogStore.estados" :key="e.value" :value="e.value">
                                {{ e.text }}
                            </option>
                        </select>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="busquedaFiltro" class="form-label">Búsqueda</label>
                        <input type="text" id="busquedaFiltro" class="form-control"
                            placeholder="Código o descripción..." v-model="filters.search">
                    </div>
                </div>
            </div>
        </div>

        <div class="card mt-4">
            <div class="card-body">
                <div v-if="pacStore.isLoading" class="text-center p-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
                <div v-else-if="pacStore.error" class="alert alert-danger">
                    {{ pacStore.error }}
                </div>
                <div v-else class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Unidad</th>
                                <th class="text-end">Monto Total</th>
                                <th class="text-center">Estado</th>
                                <th class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="pacStore.requests.length === 0">
                                <td colspan="6" class="text-center text-muted">No se encontraron solicitudes.</td>
                            </tr>
                            <tr v-for="req in pacStore.requests" :key="req.id_solicitud">
                                <td><strong>{{ req.codigo_solicitud }}</strong></td>
                                <td>{{ req.descripcion }}</td>
                                <td>{{ req.unidad_solicitante }}</td>
                                <td class="text-end">{{ req.monto_total }}</td>
                                <td class="text-center">
                                    <span class="badge" :class="`bg-${ req.estado_color }`">{{ req.estado }}</span>
                                </td>
                                <td class="text-center">
                                    <div class="btn-group">
                                        <RouterLink :to="`/pac/detail/${encodeURIComponent(req.codigo_solicitud)}`"
                                            class="btn btn-sm btn-outline-secondary" title="Ver Detalle">
                                            <i class="bi bi-eye"></i>
                                        </RouterLink>
                                        <RouterLink v-if="authStore.hasPermission('pac-item:update')"
                                            :to="`/pac/edit/${encodeURIComponent(req.codigo_solicitud)}`"
                                            class="btn btn-sm btn-outline-secondary" title="Editar">
                                            <i class="bi bi-pencil"></i>
                                        </RouterLink>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { usePacStore } from '@/stores/pac.store';
import { useAuthStore } from '@/stores/auth.store';
import { useCatalogStore } from '@/stores/catalog.store';

const pacStore = usePacStore();
const authStore = useAuthStore();
const catalogStore = useCatalogStore();

const filters = reactive({
    unidad: null,
    estado: null,
    search: ''
});

let searchTimeout: number;

watch(filters, (newFilters) => {
    // Lógica de debounce (sin cambios)
    clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
        pacStore.fetchRequests(newFilters);
    }, 500);
}, { deep: true });

onMounted(() => {
    pacStore.fetchRequests();
    catalogStore.fetchAllCatalogs();
});
</script>