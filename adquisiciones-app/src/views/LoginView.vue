<template>
    <div class="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <!-- Header -->
            <div class="pt-10 pb-6 px-8 text-center bg-white">
                <img :src="logo" alt="Secretaría de Comunicación Social de la Presidencia" class="h-16 mx-auto mb-4" />
                <h1 class="text-2xl font-bold text-slate-900">Adquisiciones</h1>
                <p class="text-blue-600 text-sm mt-1">SICOMPRAS · Baja Cuantía</p>
            </div>

            <!-- Form -->
            <div class="px-8 pb-8">
                <form @submit.prevent="handleLogin" class="space-y-5">
                    <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                        {{ error }}
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                        <div class="relative">
                            <User class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                v-model="email"
                                type="email"
                                required
                                autocomplete="email"
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="usuario@scspr.gob.gt"
                            />
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                        <div class="relative">
                            <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                v-model="password"
                                type="password"
                                required
                                autocomplete="current-password"
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        :disabled="loading"
                        class="w-full bg-slate-900 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        <span v-if="loading">Ingresando...</span>
                        <span v-else>Iniciar Sesión</span>
                        <ArrowRight v-if="!loading" class="w-4 h-4" />
                    </button>
                </form>

                <div class="mt-6 text-center text-xs text-gray-400">
                    Secretaría de Comunicación Social de la Presidencia &copy; {{ new Date().getFullYear() }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Lock, ArrowRight } from 'lucide-vue-next';
import authService from '../services/auth.service';
import logo from '../assets/logo-scspr-blue.svg';

const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
    error.value = '';
    loading.value = true;
    try {
        await authService.login(email.value, password.value);
        const redirectPath = route.query.redirect || '/dashboard';
        router.push(redirectPath);
    } catch (err) {
        error.value = err.response?.data?.message || 'Credenciales inválidas o error de conexión.';
    } finally {
        loading.value = false;
    }
};
</script>
