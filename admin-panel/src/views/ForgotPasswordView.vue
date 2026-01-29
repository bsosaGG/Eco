<template>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title text-center mb-4">Recuperar Contraseña</h3>
                        <form @submit.prevent="handleForgot">
                            <div class="mb-3">
                                <label for="email" class="form-label">Correo Electrónico</label>
                                <input type="email" class="form-control" id="email" v-model="email" required>
                            </div>
                            <div v-if="error" class="alert alert-danger">{{ error }}</div>
                            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
                            <button type="submit" class="btn btn-primary w-100" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm" role="status"
                                    aria-hidden="true"></span>
                                {{ loading ? 'Enviando...' : 'Enviar correo' }}
                            </button>
                            <div class="mt-3 text-center">
                                <router-link to="/login">Volver al inicio de sesión</router-link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

const email = ref('');
const error = ref('');
const successMessage = ref('');
const loading = ref(false);

const authStore = useAuthStore();

const handleForgot = async () => {
    error.value = '';
    successMessage.value = '';
    loading.value = true;
    try {
        await authStore.forgotPassword(email.value);
        successMessage.value = 'Se ha enviado un correo con las instrucciones.';
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Ocurrió un error. Intente de nuevo.';
    } finally {
        loading.value = false;
    }
};
</script>
