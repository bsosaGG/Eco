<template>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow-sm border-0">
                    <div class="card-body p-4">
                        <h2 class="text-center mb-4 text-primary fw-bold">Escucha a Medios</h2>
                        <p class="text-muted text-center mb-4">
                            Ayúdanos a conocer tus prioridades informativas para brindarte un mejor servicio.
                        </p>

                        <form @submit.prevent="submitForm" v-if="!submitted">
                            <!-- Selección de Medio -->
                            <div class="mb-3">
                                <label for="mediaSelect" class="form-label fw-bold">Medio de Comunicación</label>
                                <select id="mediaSelect" class="form-select" v-model="form.mediaId" required
                                    @change="handleMediaChange">
                                    <option value="" disabled>Selecciona tu medio</option>
                                    <option v-for="media in mediaList" :key="media.id" :value="media.id">
                                        {{ media.nombre }}
                                    </option>
                                </select>
                            </div>

                            <!-- Nombre del Medio (Si es Otro) -->
                            <div class="mb-3" v-if="requiresCustomName">
                                <label for="customMediaName" class="form-label fw-bold">Especifique el nombre del
                                    medio</label>
                                <input type="text" id="customMediaName" class="form-control"
                                    v-model="form.customMediaName" required placeholder="Ej: Radio Local X">
                            </div>

                            <!-- Nombre del Periodista -->
                            <div class="mb-3">
                                <label for="journalistName" class="form-label fw-bold">Nombre del Periodista</label>
                                <input type="text" id="journalistName" class="form-control"
                                    v-model="form.journalistName" required placeholder="Tu nombre completo">
                            </div>

                            <!-- Email -->
                            <div class="mb-3">
                                <label for="email" class="form-label fw-bold">Correo Electrónico</label>
                                <input type="email" id="email" class="form-control" v-model="form.email"
                                    required placeholder="nombre@ejemplo.com">
                            </div>

                            <!-- Temas de Interés -->
                            <div class="mb-4">
                                <label class="form-label fw-bold d-block">Temas de Interés (Prioridad)</label>
                                <small class="text-muted d-block mb-2">Agrega los temas en orden de importancia.</small>

                                <div v-for="(topic, index) in form.topics" :key="index" class="input-group mb-2">
                                    <span class="input-group-text bg-light text-secondary">{{ index + 1 }}</span>
                                    <input type="text" class="form-control" v-model="form.topics[index]"
                                        placeholder="Describe el tema..." required>
                                    <button type="button" class="btn btn-outline-danger" @click="removeTopic(index)"
                                        v-if="form.topics.length > 1">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>

                                <button type="button" class="btn btn-outline-primary btn-sm mt-2" @click="addTopic"
                                    v-if="form.topics.length < maxTopics">
                                    <i class="bi bi-plus-circle me-1"></i> Agregar otro tema
                                </button>
                            </div>

                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                                    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"
                                        aria-hidden="true"></span>
                                    {{ loading ? 'Enviando...' : 'Enviar Prioridades' }}
                                </button>
                            </div>
                        </form>

                        <div v-else class="text-center py-5">
                            <i class="bi bi-check-circle-fill text-success display-1 mb-3"></i>
                            <h3 class="fw-bold text-success">¡Gracias por tu participación!</h3>
                            <p class="text-muted">Hemos recibido tus prioridades correctamente.</p>
                            <button class="btn btn-outline-primary mt-3" @click="resetForm">
                                Enviar otra respuesta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';

// Interfaces
interface Media {
    id: number;
    nombre: string;
    requiere_especificar: boolean;
}

interface FormData {
    mediaId: number | '';
    journalistName: string;
    email: string;
    customMediaName: string;
    topics: string[];
}

// Estado
const mediaList = ref<Media[]>([]);
const loading = ref(false);
const submitted = ref(false);
const maxTopics = ref(5); // Valor por defecto
const form = ref<FormData>({
    mediaId: '',
    journalistName: '',
    email: '',
    customMediaName: '',
    topics: [''] // Iniciar con un campo vacío
});

// Computed
const requiresCustomName = computed(() => {
    if (!form.value.mediaId) return false;
    const selected = mediaList.value.find(m => m.id === form.value.mediaId);
    return selected ? selected.requiere_especificar : false;
});

// Métodos
const fetchConfig = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await axios.get(`${apiUrl}/media-listening/public/config`);
        if (response.data.max_temas_prioritarios) {
            maxTopics.value = parseInt(response.data.max_temas_prioritarios);
        }
    } catch (error) {
        console.error('Error al cargar configuración:', error);
    }
};

const fetchCatalog = async () => {
    try {
        // Usar la URL base de la API definida en variables de entorno o hardcoded por ahora si no tenemos acceso al env del frontend
        // Asumimos que axios tiene configurada la baseURL o usamos relativa si está en el mismo dominio (nginx proxy)
        // En desarrollo local, admin-panel corre en 8080 y api en 3000. Necesitamos la URL completa o proxy.
        // El docker-compose expone api en 3000.
        // Vamos a usar la variable de entorno VITE_API_URL si existe, o fallback.
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await axios.get(`${apiUrl}/media-listening/public/catalog`);
        mediaList.value = response.data;
    } catch (error) {
        console.error('Error al cargar catálogo:', error);
        Swal.fire('Error', 'No se pudo cargar la lista de medios.', 'error');
    }
};

const handleMediaChange = () => {
    if (!requiresCustomName.value) {
        form.value.customMediaName = '';
    }
};

const addTopic = () => {
    if (form.value.topics.length < maxTopics.value) {
        form.value.topics.push('');
    }
};

const removeTopic = (index: number) => {
    form.value.topics.splice(index, 1);
};

const submitForm = async () => {
    // Validaciones básicas
    if (form.value.topics.some(t => !t.trim())) {
        Swal.fire('Atención', 'Por favor completa todos los campos de temas o elimina los vacíos.', 'warning');
        return;
    }

    loading.value = true;
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        await axios.post(`${apiUrl}/media-listening/public/submit`, {
            mediaId: form.value.mediaId,
            journalistName: form.value.journalistName,
            email: form.value.email,
            customMediaName: form.value.customMediaName,
            topics: form.value.topics
        });

        submitted.value = true;
        Swal.fire({
            icon: 'success',
            title: '¡Enviado!',
            text: 'Gracias por compartir tus prioridades.',
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Error al enviar:', error);
        Swal.fire('Error', 'Hubo un problema al enviar tu respuesta. Intenta nuevamente.', 'error');
    } finally {
        loading.value = false;
    }
};

const resetForm = () => {
    form.value = {
        mediaId: '',
        journalistName: '',
        email: '',
        customMediaName: '',
        topics: ['']
    };
    submitted.value = false;
};

// Lifecycle
onMounted(() => {
    fetchConfig();
    fetchCatalog();
});
</script>

<style scoped>
.card {
    border-radius: 1rem;
}
</style>
