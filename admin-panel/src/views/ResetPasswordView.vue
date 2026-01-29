<template>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title text-center mb-4">Restablecer Contraseña</h3>
                        <form @submit.prevent="handleReset">
                            <div class="mb-3">
                                <label for="password" class="form-label">Nueva Contraseña</label>
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
                                {{ loading ? 'Restableciendo...' : 'Restablecer' }}
                            </button>
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
import { useRoute, useRouter } from 'vue-router';

const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const handleReset = async () => {
    error.value = '';

    if (password.value !== confirmPassword.value) {
        error.value = 'Las contraseñas no coinciden';
        return;
    }

    loading.value = true;
    try {
        const token = route.params.token as string;
        await authStore.resetPassword(token, password.value, confirmPassword.value);
        router.push({ path: '/login', query: { message: 'password_updated' } });
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Ocurrió un error. Intente de nuevo.';
    } finally {
        loading.value = false;
    }
};
</script>
