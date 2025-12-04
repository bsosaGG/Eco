<template>
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary fw-bold mb-0">
                <i class="bi bi-list-check me-2"></i>Catálogo de Medios
            </h2>
            <button class="btn btn-primary" @click="openModal()">
                <i class="bi bi-plus-lg me-1"></i> Nuevo Medio
            </button>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-4">ID</th>
                                <th>Nombre</th>
                                <th>Requiere Especificar</th>
                                <th>Estado</th>
                                <th class="text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="loading">
                                <td colspan="5" class="text-center py-5">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </div>
                                </td>
                            </tr>
                            <tr v-for="media in mediaList" :key="media.id">
                                <td class="ps-4 text-muted">#{{ media.id }}</td>
                                <td class="fw-bold">{{ media.nombre }}</td>
                                <td>
                                    <span v-if="media.requiere_especificar" class="badge bg-info text-dark">Sí</span>
                                    <span v-else class="text-muted">-</span>
                                </td>
                                <td>
                                    <span v-if="media.activo" class="badge bg-success">Activo</span>
                                    <span v-else class="badge bg-secondary">Inactivo</span>
                                </td>
                                <td class="text-end pe-4">
                                    <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(media)">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="deleteMedia(media.id)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div class="modal fade" id="mediaModal" tabindex="-1" aria-hidden="true" ref="modalRef">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ isEditing ? 'Editar Medio' : 'Nuevo Medio' }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="saveMedia">
                            <div class="mb-3">
                                <label for="nombre" class="form-label">Nombre del Medio</label>
                                <input type="text" class="form-control" id="nombre" v-model="form.nombre" required>
                            </div>
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="requiereEspecificar"
                                    v-model="form.requiere_especificar">
                                <label class="form-check-label" for="requiereEspecificar">Requiere especificar (Opción
                                    "Otro")</label>
                            </div>
                            <div class="mb-3 form-check" v-if="isEditing">
                                <input type="checkbox" class="form-check-input" id="activo" v-model="form.activo">
                                <label class="form-check-label" for="activo">Activo</label>
                            </div>
                            <div class="d-flex justify-content-end mt-4">
                                <button type="button" class="btn btn-secondary me-2"
                                    data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">{{ isEditing ? 'Actualizar' : 'Guardar'
                                    }}</button>
                            </div>
                        </form>
                    </div>
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
import { Modal } from 'bootstrap';

interface Media {
    id: number;
    nombre: string;
    requiere_especificar: boolean;
    activo: boolean;
}

const mediaList = ref<Media[]>([]);
const loading = ref(false);
const authStore = useAuthStore();
const modalRef = ref<HTMLElement | null>(null);
let modalInstance: Modal | null = null;

const isEditing = ref(false);
const form = ref({
    id: 0,
    nombre: '',
    requiere_especificar: false,
    activo: true
});

const fetchCatalog = async () => {
    loading.value = true;
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await axios.get(`${apiUrl}/media-listening/catalog`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        mediaList.value = response.data;
    } catch (error) {
        console.error('Error al cargar catálogo:', error);
        Swal.fire('Error', 'No se pudo cargar el catálogo.', 'error');
    } finally {
        loading.value = false;
    }
};

const openModal = (media?: Media) => {
    if (media) {
        isEditing.value = true;
        form.value = { ...media };
    } else {
        isEditing.value = false;
        form.value = { id: 0, nombre: '', requiere_especificar: false, activo: true };
    }
    modalInstance?.show();
};

const saveMedia = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const headers = { Authorization: `Bearer ${authStore.token}` };

        if (isEditing.value) {
            await axios.put(`${apiUrl}/media-listening/catalog/${form.value.id}`, form.value, { headers });
        } else {
            await axios.post(`${apiUrl}/media-listening/catalog`, form.value, { headers });
        }

        modalInstance?.hide();
        fetchCatalog();
        Swal.fire('Éxito', 'Operación realizada correctamente', 'success');
    } catch (error) {
        console.error('Error al guardar:', error);
        Swal.fire('Error', 'No se pudo guardar el medio.', 'error');
    }
};

const deleteMedia = async (id: number) => {
    const confirm = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esto. Si el medio tiene respuestas, no se podrá eliminar.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            await axios.delete(`${apiUrl}/media-listening/catalog/${id}`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });
            fetchCatalog();
            Swal.fire('Eliminado', 'El medio ha sido eliminado.', 'success');
        } catch (error: any) {
            console.error('Error al eliminar:', error);
            const msg = error.response?.data?.error || 'No se pudo eliminar el medio.';
            Swal.fire('Error', msg, 'error');
        }
    }
};

onMounted(() => {
    fetchCatalog();
    if (modalRef.value) {
        modalInstance = new Modal(modalRef.value);
    }
});
</script>
