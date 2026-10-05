<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/50" @click="$emit('cancelado')"></div>

    <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <div class="flex items-center gap-2 mb-1">
        <ShieldCheck class="w-5 h-5 text-accent flex-shrink-0" />
        <h3 class="text-lg font-bold text-gray-800">{{ titulo }}</h3>
      </div>
      <p v-if="descripcion" class="text-sm text-gray-500 mb-4">{{ descripcion }}</p>

      <div v-if="error" class="bg-red-50 text-red-600 p-2 rounded text-xs mb-3">{{ error }}</div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Usuario</label>
          <input :value="usuarioActual" type="text" disabled
            class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-100 text-gray-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Contraseña</label>
          <input v-model="password" type="password" placeholder="Ingresa tu contraseña"
            @keyup.enter="confirmar"
            class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
        <label class="flex items-start gap-2 text-sm text-gray-600 pt-1">
          <input v-model="confirmo" type="checkbox" class="mt-0.5" />
          <span>Confirmo que soy yo quien autoriza esta acción y dejo constancia de ello.</span>
        </label>
      </div>

      <div class="flex gap-2 mt-5">
        <button @click="$emit('cancelado')" :disabled="loading"
          class="flex-1 border border-gray-300 text-gray-600 px-3 py-2 rounded text-sm hover:bg-gray-50 disabled:opacity-50">
          Cancelar
        </button>
        <button @click="confirmar" :disabled="loading || !password || !confirmo"
          class="flex-1 bg-accent text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50">
          {{ loading ? 'Verificando...' : 'Firmar y autorizar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ShieldCheck } from 'lucide-vue-next';
import authService from '../../services/auth.service';
import { errorMessage } from '../../utils/errors';

defineProps({
  titulo: { type: String, required: true },
  descripcion: { type: String, default: '' },
});
const emit = defineEmits(['confirmado', 'cancelado']);

const usuarioActual = authService.getCurrentUser()?.email || authService.getCurrentUser()?.name || '';
const password = ref('');
const confirmo = ref(false);
const loading = ref(false);
const error = ref('');

const confirmar = async () => {
  if (!password.value || !confirmo.value) return;
  loading.value = true;
  error.value = '';
  try {
    const valido = await authService.verificarContrasenia(password.value);
    if (!valido) {
      error.value = 'Contraseña incorrecta.';
      return;
    }
    emit('confirmado');
  } catch (err) {
    console.error(err);
    error.value = errorMessage(err, 'No se pudo verificar la contraseña.');
  } finally {
    loading.value = false;
  }
};
</script>
