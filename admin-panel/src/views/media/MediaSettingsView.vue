<template>
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary fw-bold mb-0">
                <i class="bi bi-gear-fill me-2"></i>Configuración General
            </h2>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-body">
                <form @submit.prevent="saveConfig">
                    <div class="mb-3">
                        <label for="maxTopics" class="form-label fw-bold">Máximo de Temas Prioritarios</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-list-ol"></i></span>
                            <input type="number" id="maxTopics" class="form-control"
                                v-model="config.max_temas_prioritarios" min="1" max="20" required>
                        </div>
                        <div class="form-text">Define cuántos temas prioritarios pueden enviar los medios en el
                            formulario público.</div>
                    </div>

                    <div class="d-flex justify-content-end">
                        <button type="submit" class="btn btn-primary" :disabled="loading">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"
                                aria-hidden="true"></span>
                            <i v-else class="bi bi-save me-2"></i> Guardar Configuración
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import Swal from 'sweetalert2';

const config = ref({
    max_temas_prioritarios: 5
});
const loading = ref(false);
const authStore = useAuthStore();

const fetchConfig = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        // Usamos el endpoint público para leer, ya que devuelve lo mismo y es más simple
        const response = await axios.get(`${apiUrl}/media-listening/public/config`);
        if (response.data.max_temas_prioritarios) {
            config.value.max_temas_prioritarios = parseInt(response.data.max_temas_prioritarios);
        }
    } catch (error) {
        console.error('Error al cargar configuración:', error);
        Swal.fire('Error', 'No se pudo cargar la configuración.', 'error');
    }
};

const saveConfig = async () => {
    loading.value = true;
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        await axios.put(`${apiUrl}/media-listening/config`, config.value, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        Swal.fire({
            icon: 'success',
            title: 'Guardado',
            text: 'La configuración ha sido actualizada.',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        Swal.fire('Error', 'No se pudo guardar la configuración.', 'error');
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchConfig();
});
</script>
