<template>
    <div class="card h-100">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="bi bi-globe me-2"></i>{{ site.nombre }}</h5>
            <span :class="statusBadgeClass" class="badge"><i :class="statusIconClass" class="me-1"></i>{{ statusText
                }}</span>
        </div>
        <div class="card-body">
            <div v-if="isLoading" class="text-center">
                <div class="spinner-border spinner-border-sm" role="status"><span
                        class="visually-hidden">Verificando...</span></div>
                <span class="ms-2">Verificando...</span>
            </div>
            <div v-else-if="error">
                <p class="text-danger mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Error:</strong>
                    {{ error }}</p>
            </div>
            <div v-else-if="statusData">
                <ul class="list-group list-group-flush">
                    <li class="list-group-item px-0 d-flex justify-content-between"><span>Código de Estado:</span><span
                            class="fw-bold">{{ statusData.statusCode || 'N/A' }}</span></li>
                    <li class="list-group-item px-0 d-flex justify-content-between"><span>Tiempo de
                            Respuesta:</span><span class="fw-bold">{{ statusData.responseTimeMs }} ms</span></li>
                </ul>
            </div>
        </div>
        <div class="card-footer text-body-secondary small d-flex justify-content-between align-items-center">
            <a :href="site.url" target="_blank" rel="noopener noreferrer" class="text-truncate">{{ site.url }}</a>
            <div>
                <button class="btn btn-sm btn-outline-primary me-2" @click="$emit('edit', site)" title="Editar"><i
                        class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', site)" title="Eliminar"><i
                        class="bi bi-trash"></i></button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, type PropType } from 'vue';
import type { Site } from '@/stores/monitoring.store';
import apiClient from '@/services/api.service';

const props = defineProps({ site: { type: Object as PropType<Site>, required: true } });
const emit = defineEmits(['edit', 'delete']);

const isLoading = ref(true);
const statusData = ref<any>(null);
const error = ref<string | null>(null);
let intervalId: number | null = null;

const fetchStatus = async () => { try { const response = await apiClient.get(`/monitoring/sites/${props.site.id_sitio_web}/status`, { timeout: 35000 }); statusData.value = response.data; if (!response.data.online) { error.value = response.data.error || 'El sitio está fuera de línea.'; } else { error.value = null; } } catch (err: any) { error.value = err.response?.data?.message || 'No se pudo contactar al API.'; statusData.value = null; } finally { isLoading.value = false; } };
onMounted(() => { fetchStatus(); intervalId = window.setInterval(fetchStatus, 60000); });
onUnmounted(() => { if (intervalId) clearInterval(intervalId); });

const isOnline = computed(() => statusData.value?.online === true);
const statusText = computed(() => { if (isLoading.value) return 'Verificando'; return isOnline.value ? 'En Línea' : 'Fuera de Línea'; });
const statusBadgeClass = computed(() => isOnline.value ? 'bg-success' : 'bg-danger');
const statusIconClass = computed(() => isOnline.value ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill');
</script>

<style scoped>
.card-header h5 {
    font-size: 1rem;
}

.card-footer a {
    text-decoration: none;
    color: inherit;
    max-width: 150px;
}

.card-footer a:hover {
    text-decoration: underline;
}
</style>