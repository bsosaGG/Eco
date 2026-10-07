<template>
  <ModalBase :model-value="true" :titulo="titulo" :subtitulo="descripcion" size="sm" persistente @update:model-value="$emit('cancelado')">
    <div v-if="error" class="bg-red-50 text-red-600 p-2 rounded-lg text-xs mb-3">{{ error }}</div>

    <div class="space-y-4">
      <div class="flex items-center gap-2 text-sm text-accent bg-blue-50 rounded-lg px-3 py-2">
        <ShieldCheck class="w-4 h-4 shrink-0" />
        <span>Esta firma deja constancia de quién autoriza.</span>
      </div>
      <div>
        <label class="etiqueta">Usuario</label>
        <input :value="usuarioActual" type="text" disabled class="campo bg-gray-100 text-gray-500" />
      </div>
      <div>
        <label class="etiqueta">Contraseña</label>
        <input v-model="password" type="password" placeholder="Ingrese su contraseña" @keyup.enter="confirmar" class="campo" />
      </div>
      <label class="flex items-start gap-2 text-sm text-gray-600">
        <input v-model="confirmo" type="checkbox" class="mt-0.5 accent-accent" />
        <span>Confirmo que soy yo quien autoriza esta acción y dejo constancia de ello.</span>
      </label>
    </div>

    <template #footer>
      <button type="button" @click="$emit('cancelado')" :disabled="loading" class="btn-secundario">Cancelar</button>
      <button type="button" @click="confirmar" :disabled="loading || !password || !confirmo" class="btn-primario">
        {{ loading ? 'Verificando...' : 'Firmar y autorizar' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref } from 'vue';
import { ShieldCheck } from 'lucide-vue-next';
import authService from '../../services/auth.service';
import ModalBase from './ModalBase.vue';
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
