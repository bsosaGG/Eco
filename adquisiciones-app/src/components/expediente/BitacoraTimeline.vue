<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Bitácora de Trazabilidad</h4>
    <ol class="space-y-4 max-h-80 overflow-y-auto pr-1">
      <li v-for="log in eventos" :key="log.id_bitacora" class="flex gap-3">
        <div class="w-2 h-2 mt-2 rounded-full bg-accent flex-shrink-0"></div>
        <div>
          <p class="text-sm text-gray-800 font-medium">{{ log.accion }}</p>
          <p v-if="log.observacion" class="text-sm text-gray-500">{{ log.observacion }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ log.usuario_nombre }} &middot; {{ formatFechaHora(log.fecha_hora) }}</p>
        </div>
      </li>
      <li v-if="eventos.length === 0" class="text-sm text-gray-400 italic">Sin movimientos registrados todavía.</li>
    </ol>
  </div>
</template>

<script setup>
import { formatFechaHora } from '../../utils/format';

defineProps({
  eventos: { type: Array, default: () => [] },
});
</script>
