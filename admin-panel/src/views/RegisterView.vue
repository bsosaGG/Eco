<template>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title text-center mb-4">Registro</h3>
                        <form @submit.prevent="handleRegister">
                            <div class="mb-3">
                                <label for="name" class="form-label">Nombre Completo</label>
                                <input type="text" class="form-control" id="name" v-model="name" required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Correo Electrónico</label>
                                <input type="email" class="form-control" id="email" v-model="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Contraseña</label>
                                <input type="password" class="form-control" id="password" v-model="password" required>
                            </div>
                            <div class="mb-3">
                                <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
                                <input type="password" class="form-control" id="confirmPassword"
                                    v-model="confirmPassword" required>
                            </div>
                            <div v-if="error" class="alert alert-danger">{{ error }}</div>
                            <button type="submit" class="btn btn-primary w-100" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm" role="status"
                                    aria-hidden="true"></span>
                                {{ loading ? 'Registrando...' : 'Registrarse' }}
                            </button>
                            <div class="mt-3 text-center">
                                <router-link to="/login">¿Ya tienes cuenta? Inicia sesión</router-link>
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
import { useRouter } from 'vue-router';

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleRegister = async () => {
    error.value = '';
    if (password.value !== confirmPassword.value) {
        error.value = 'Las contraseñas no coinciden';
        return;
    }

    loading.value = true;
    try {
        await authStore.register({
            nombre_completo: name.value,
            email: email.value,
            password: password.value,
            confirm_password: confirmPassword.value
        });
        router.push('/login');
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Ocurrió un error. Intente de nuevo.';
    } finally {
        loading.value = false;
    }
};
</script>
