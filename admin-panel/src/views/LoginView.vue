<template>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title text-center mb-4">Iniciar Sesión</h3>
                        <form @submit.prevent="handleLogin">
                            <div class="mb-3">
                                <label for="email" class="form-label">Correo Electrónico</label>
                                <input type="email" class="form-control" id="email" v-model="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Contraseña</label>
                                <input type="password" class="form-control" id="password" v-model="password" required>
                            </div>
                            <div v-if="error" class="alert alert-danger">{{ error }}</div>

                            <!-- Contenedor del reCAPTCHA v2 -->
                            <div class="mb-3 d-flex justify-content-center">
                                <div class="g-recaptcha" data-sitekey="6Lcf_UkrAAAAALdn2fskpNXv7UxmtapFZQkBUqYI"></div>
                            </div>

                            <button type="submit" class="btn btn-primary w-100" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm" role="status"
                                    aria-hidden="true"></span>
                                {{ loading ? 'Ingresando...' : 'Ingresar' }}
                            </button>
                            <div class="mt-3 text-center">
                                <router-link to="/signup" class="d-block mb-2">¿No tienes cuenta?
                                    Regístrate</router-link>
                                <router-link to="/forgot-password">¿Olvidaste tu contraseña?</router-link>
                            </div>
                            <!-- Optional: Show message if redirected from reset password -->
                            <div v-if="$route.query.message === 'password_updated'" class="alert alert-success mt-3">
                                Contraseña actualizada. Por favor inicia sesión.
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
declare var grecaptcha: any;

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const authStore = useAuthStore();

const handleLogin = async () => {
    error.value = '';

    // 1. Obtener el token generado por el usuario en el navegador
    const token = grecaptcha.getResponse();

    // 2. Si no hay token, exigir que marquen la casilla
    if (!token) {
        error.value = 'Por favor, complete el reCAPTCHA.';
        return;
    }

    loading.value = true;
    try {
        // Enviaremos el token como tercer parámetro al Store
        await authStore.login(email.value, password.value, token);
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Ocurrió un error. Intente de nuevo.';
        // 3. Resetear el reCAPTCHA visual si el login falla para obligar una nueva verificación
        grecaptcha.reset();
    } finally {
        loading.value = false;
    }
};
</script>