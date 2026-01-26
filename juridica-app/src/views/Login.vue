<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
      <!-- Header -->
      <div class="bg-blue-600 p-8 text-center">
        <h1 class="text-3xl font-bold text-white tracking-wider">JURISGESTIÓN</h1>
        <p class="text-blue-100 mt-2 text-sm">Sistema de Control de Procesos Jurídicos</p>
      </div>

      <!-- Form -->
      <div class="p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
            {{ error }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div class="relative">
                <input 
                    v-model="email"
                    type="email" 
                    required
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="usuario@scspr.gob.gt"
                />
                <User class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div class="relative">
                <input 
                    v-model="password"
                    type="password" 
                    required
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                />
                 <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-slate-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <span v-if="loading">Ingresando...</span>
            <span v-else>Iniciar Sesión</span>
            <ArrowRight v-if="!loading" class="w-4 h-4" />
          </button>
        </form>
        
        <div class="mt-6 text-center text-xs text-gray-400">
            SCSPR &copy; {{ new Date().getFullYear() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock, ArrowRight } from 'lucide-vue-next';
import authService from '../services/auth.service';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
    error.value = '';
    loading.value = true;
    try {
        await authService.login(email.value, password.value);
        router.push('/dashboard');
    } catch (err) {
        console.error(err);
        if (err.response && err.response.data && err.response.data.message) {
             error.value = err.response.data.message;
        } else {
             error.value = 'Credenciales inválidas o error de conexión.';
        }
    } finally {
        loading.value = false;
    }
};
</script>
