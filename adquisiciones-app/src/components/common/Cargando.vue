<template>
  <div class="flex flex-col items-center justify-center gap-3 text-gray-400 py-12">
    <Loader2 class="w-7 h-7 animate-spin text-accent" />
    <span class="text-sm">{{ mensaje }}</span>
  </div>
</template>

<script setup>
import { Loader2 } from 'lucide-vue-next';

defineProps({
  mensaje: { type: String, default: 'Cargando...' },
});
</script>
