<template>
  <div role="tablist" class="flex border-b border-gray-200 px-2 overflow-x-auto">
    <button v-for="pestana in pestanas" :key="pestana.clave" type="button" role="tab"
      :aria-selected="pestana.clave === modelValue"
      @click="emit('update:modelValue', pestana.clave)"
      class="px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors bg-transparent"
      :class="pestana.clave === modelValue
        ? 'border-accent text-gray-900 font-medium'
        : 'border-transparent text-gray-500 hover:text-gray-800'">
      {{ pestana.etiqueta }}
      <span v-if="pestana.conteo != null" class="ml-1 text-xs text-gray-400">({{ pestana.conteo }})</span>
    </button>
  </div>
</template>

<script setup>
// Barra de pestañas (v-model = clave de la pestaña activa). Cada pestaña: { clave, etiqueta, conteo? }.
defineProps({
  pestanas: { type: Array, required: true },
  modelValue: { type: String, required: true },
});
const emit = defineEmits(['update:modelValue']);
</script>
