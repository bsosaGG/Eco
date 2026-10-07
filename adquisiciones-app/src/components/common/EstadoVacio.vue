<template>
  <div class="flex flex-col items-center justify-center gap-2 text-center py-10 px-4">
    <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
      <component :is="icono" class="w-6 h-6" />
    </div>
    <p class="text-sm font-medium text-gray-600">{{ titulo }}</p>
    <p v-if="detalle" class="text-xs text-gray-400 max-w-xs">{{ detalle }}</p>
    <slot />
  </div>
</template>

<script setup>
import { Inbox } from 'lucide-vue-next';

// Estado vacío con un ícono: invita a hacer algo en vez de mostrar un texto seco.
defineProps({
  titulo: { type: String, required: true },
  detalle: { type: String, default: '' },
  icono: { type: [Object, Function], default: () => Inbox },
});
</script>
