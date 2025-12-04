<template>
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary fw-bold mb-0">
                <i class="bi bi-inbox-fill me-2"></i>Buzón de Escucha a Medios
            </h2>
            <button class="btn btn-outline-secondary btn-sm" @click="() => fetchSubmissions(1)">
                <i class="bi bi-arrow-clockwise me-1"></i> Actualizar
            </button>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-4">Fecha</th>
                                <th>Medio</th>
                                <th>Periodista</th>
                                <th>Email</th>
                                <th>Temas Prioritarios</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="loading">
                                <td colspan="4" class="text-center py-5">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </div>
                                </td>
                            </tr>
                            <tr v-else-if="submissions.length === 0">
                                <td colspan="5" class="text-center py-5 text-muted">
                                    <i class="bi bi-inbox display-4 d-block mb-3"></i>
                                    No hay respuestas registradas aún.
                                </td>
                            </tr>
                            <tr v-for="sub in submissions" :key="sub.id">
                                <td class="ps-4 text-nowrap text-muted">
                                    {{ formatDate(sub.fecha_creacion) }}
                                </td>
                                <td>
                                    <span class="fw-bold text-dark">{{ sub.nombre_medio }}</span>
                                    <div v-if="sub.nombre_medio_otro" class="small text-muted fst-italic">
                                        ({{ sub.nombre_medio_otro }})
                                    </div>
                                </td>
                                <td>{{ sub.nombre_periodista }}</td>
                                <td class="text-muted small">{{ sub.email || '-' }}</td>
                                <td>
                                    <ul class="list-unstyled mb-0">
                                        <li v-for="(tema, idx) in sub.temas" :key="idx" class="mb-1">
                                            <span class="badge bg-primary me-2 rounded-pill">{{ tema.prioridad }}</span>
                                            {{ tema.descripcion }}
                                        </li>
                                    </ul>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer bg-white py-3">
                <div class="d-flex justify-content-center align-items-center" v-if="totalPages > 1">
                    <button class="btn btn-outline-secondary btn-sm me-2" :disabled="currentPage === 1"
                        @click="changePage(currentPage - 1)">
                        <i class="bi bi-chevron-left"></i>
                    </button>

                    <div class="d-flex align-items-center">
                        <span class="me-2 text-muted small">Página</span>
                        <select class="form-select form-select-sm" style="width: auto;" :value="currentPage"
                            @change="handlePageChange">
                            <option v-for="page in totalPages" :key="page" :value="page">
                                {{ page }}
                            </option>
                        </select>
                        <span class="ms-2 text-muted small">de {{ totalPages }}</span>
                    </div>

                    <button class="btn btn-outline-secondary btn-sm ms-2" :disabled="currentPage === totalPages"
                        @click="changePage(currentPage + 1)">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import Swal from 'sweetalert2';

interface Tema {
    prioridad: number;
    descripcion: string;
}

interface Submission {
    id: number;
    nombre_medio: string;
    nombre_medio_otro: string | null;
    nombre_periodista: string;
    email: string | null;
    fecha_creacion: string;
    temas: Tema[];
}

const submissions = ref<Submission[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const totalPages = ref(0);
const limit = 10;
const authStore = useAuthStore();

const fetchSubmissions = async (page = 1) => {
    loading.value = true;
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await axios.get(`${apiUrl}/media-listening/submissions`, {
            params: { page, limit },
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        // Soporte para respuesta paginada o array simple (compatibilidad)
        if (response.data.data) {
            submissions.value = response.data.data;
            currentPage.value = response.data.meta.page;
            totalPages.value = response.data.meta.totalPages;
        } else {
            submissions.value = response.data;
            totalPages.value = 1;
        }
    } catch (error) {
        console.error('Error al cargar respuestas:', error);
        Swal.fire('Error', 'No se pudieron cargar las respuestas.', 'error');
    } finally {
        loading.value = false;
    }
};

const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
        fetchSubmissions(page);
    }
};

const handlePageChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const page = parseInt(target.value);
    changePage(page);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

onMounted(() => {
    fetchSubmissions();
});
</script>
