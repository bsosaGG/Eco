<template>
    <div class="card h-100">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
                <i class="bi bi-hdd-stack me-2"></i>
                {{ server.nombre }}
            </h5>
            <span :class="statusBadgeClass" class="badge">
                <i :class="statusIconClass" class="me-1"></i>
                {{ statusText }}
            </span>
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
                    <li class="list-group-item px-0"><strong>CPU</strong>
                        <div class="progress" role="progressbar">
                            <div class="progress-bar" :style="{ width: statusData.cpuUsagePercent + '%' }">{{
                                statusData.cpuUsagePercent }}%</div>
                        </div>
                    </li>
                    <li class="list-group-item px-0"><strong>RAM</strong>
                        <div class="progress" role="progressbar">
                            <div class="progress-bar" :style="{ width: statusData.ramUsagePercent + '%' }">{{
                                statusData.ramUsagePercent }}%</div>
                        </div>
                    </li>
                    <li class="list-group-item px-0"><strong>Disco</strong>
                        <div class="progress" role="progressbar">
                            <div class="progress-bar" :style="{ width: statusData.diskUsagePercent + '%' }">{{
                                statusData.diskUsagePercent }}%</div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <div class="card-footer text-body-secondary small d-flex justify-content-between align-items-center">
            <span>{{ server.direccion_ip }}:{{ server.puerto_ssh }}</span>
            <div>
                <button class="btn btn-sm btn-outline-primary me-2" @click="$emit('edit', server)" title="Editar"><i
                        class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', server)" title="Eliminar"><i
                        class="bi bi-trash"></i></button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, type PropType } from 'vue';
import type { Server } from '@/stores/monitoring.store';
import apiClient from '@/services/api.service';

const props = defineProps({ server: { type: Object as PropType<Server>, required: true } });
const emit = defineEmits(['edit', 'delete']);

const isLoading = ref(true);
const statusData = ref<any>(null);
const error = ref<string | null>(null);
let intervalId: number | null = null;

const fetchStatus = async () => { try { const response = await apiClient.get(`/monitoring/servers/${props.server.id_servidor}/status`, { timeout: 95000 }); statusData.value = response.data; if (!response.data.online) { error.value = response.data.error || 'El servidor está fuera de línea.'; } else { error.value = null; } } catch (err: any) { error.value = err.response?.data?.message || 'No se pudo contactar al API.'; statusData.value = null; } finally { isLoading.value = false; } };
onMounted(() => { fetchStatus(); intervalId = window.setInterval(fetchStatus, 30000); });
onUnmounted(() => { if (intervalId) clearInterval(intervalId); });

const isOnline = computed(() => statusData.value?.online === true);
const statusText = computed(() => { if (isLoading.value) return 'Verificando'; return isOnline.value ? 'En Línea' : 'Fuera de Línea'; });
const statusBadgeClass = computed(() => isOnline.value ? 'bg-success' : 'bg-danger');
const statusIconClass = computed(() => isOnline.value ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill');
</script>

<style scoped>
.progress {
    height: 20px;
    font-size: 0.8rem;
}

.card-header h5 {
    font-size: 1rem;
}
</style>