<template>
  <ol class="flex items-start" aria-label="Pasos del formulario">
    <li v-for="(paso, idx) in pasos" :key="paso.clave" class="flex items-center" :class="idx < pasos.length - 1 ? 'flex-1' : ''">
      <button type="button" @click="idx < modelValue && emit('update:modelValue', idx)" :disabled="idx >= modelValue"
        class="flex flex-col items-center gap-1 text-center bg-transparent border-0 px-1"
        :class="idx < modelValue ? 'cursor-pointer' : 'cursor-default'">
        <span class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
          :class="idx < modelValue
            ? 'bg-green-500 text-white'
            : idx === modelValue ? 'bg-accent text-white ring-4 ring-blue-100 scale-110' : 'bg-gray-200 text-gray-400'">
          <Check v-if="idx < modelValue" class="w-4 h-4" />
          <span v-else>{{ idx + 1 }}</span>
        </span>
        <span class="text-xs font-medium leading-tight hidden sm:block"
          :class="idx === modelValue ? 'text-gray-800' : idx < modelValue ? 'text-gray-500' : 'text-gray-300'">
          {{ paso.etiqueta }}
        </span>
      </button>
      <div v-if="idx < pasos.length - 1" class="flex-1 h-0.5 mx-1 -mt-0 sm:-mt-4 rounded transition-colors duration-300"
        :class="idx < modelValue ? 'bg-green-400' : 'bg-gray-200'"></div>
    </li>
  </ol>
</template>

<script setup>
import { Check } from 'lucide-vue-next';

// Indicador de pasos de un formulario largo. v-model = índice del paso actual (desde 0); solo se puede
// volver a pasos ya recorridos. Cada paso: { clave, etiqueta }.
defineProps({
  pasos: { type: Array, required: true },
  modelValue: { type: Number, required: true },
});
const emit = defineEmits(['update:modelValue']);
</script>
