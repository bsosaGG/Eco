<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Justificación</h4>
    <p class="text-gray-700 whitespace-pre-line max-h-32 overflow-y-auto">{{ expediente.justificacion }}</p>
  </div>

  <div v-if="expediente.tiene_anexo" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Anexo</h4>
    <div v-if="expediente.anexo_caracteristicas_tecnicas">
      <p class="text-xs font-medium text-gray-500 mb-1">Características Técnicas</p>
      <p class="text-gray-700 whitespace-pre-line text-sm">{{ expediente.anexo_caracteristicas_tecnicas }}</p>
    </div>
    <div v-if="expediente.anexo_especificaciones_especiales">
      <p class="text-xs font-medium text-gray-500 mb-1">Especificaciones Especiales</p>
      <p class="text-gray-700 whitespace-pre-line text-sm">{{ expediente.anexo_especificaciones_especiales }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  expediente: { type: Object, required: true },
});
</script>
