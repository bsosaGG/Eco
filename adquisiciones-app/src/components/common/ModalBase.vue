<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="!persistente && cerrar()"></div>

        <div class="modal-panel relative bg-white rounded-xl shadow-2xl w-full flex flex-col max-h-[90vh]" :class="anchos[size]"
          role="dialog" aria-modal="true" :aria-label="titulo">
          <header class="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-gray-100">
            <div class="min-w-0">
              <h3 class="text-lg font-semibold text-gray-800">{{ titulo }}</h3>
              <p v-if="subtitulo" class="text-sm text-gray-500 mt-0.5">{{ subtitulo }}</p>
            </div>
            <button type="button" @click="cerrar" aria-label="Cerrar"
              class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors shrink-0">
              <X class="w-5 h-5" />
            </button>
          </header>

          <div class="px-6 py-4 overflow-y-auto">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-2">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue';
import { X } from 'lucide-vue-next';

// Ventana modal con animación. v-model abre y cierra; Escape y clic fuera la cierran (salvo `persistente`).
// Contenido en el slot por defecto y botones en el slot "footer".
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg
  persistente: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'cerrado']);

const anchos = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

const cerrar = () => {
  emit('update:modelValue', false);
  emit('cerrado');
};

const alTeclear = (evento) => {
  if (evento.key === 'Escape' && !props.persistente) cerrar();
};

// Mientras hay un modal abierto: Escape lo cierra y la página de atrás no se desplaza.
watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      document.addEventListener('keydown', alTeclear);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = '';
    }
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  document.removeEventListener('keydown', alTeclear);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(14px) scale(0.97);
  opacity: 0;
}
</style>
