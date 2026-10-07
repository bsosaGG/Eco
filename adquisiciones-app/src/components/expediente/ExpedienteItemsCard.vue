<template>
  <div>
    <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Renglones solicitados ({{ items.length }})</h4>

    <!-- Vista de tabla (md en adelante) -->
    <table class="hidden md:table w-full text-sm">
      <thead class="text-gray-400 text-xs uppercase">
        <tr>
          <th class="text-left py-2 px-2">Descripción</th>
          <th class="text-right py-2 px-2">Cantidad</th>
          <th class="text-left py-2 px-2">Unidad</th>
          <th class="text-left py-2 px-2">Cód. Insumo</th>
          <th class="text-left py-2 px-2">Renglón</th>
          <th class="text-right py-2 px-2">Costo Unit.</th>
          <th class="text-right py-2 px-2">Subtotal</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="item in items" :key="item.id_item">
          <td class="py-2 px-2">{{ item.descripcion }}</td>
          <td class="py-2 px-2 text-right">{{ item.cantidad }}</td>
          <td class="py-2 px-2">{{ item.unidad_medida }}</td>
          <td class="py-2 px-2">{{ item.codigo_insumo || '—' }}</td>
          <td class="py-2 px-2">{{ item.renglon_numero ? `${item.renglon_numero} — ${item.renglon_nombre}` : '—' }}</td>
          <td class="py-2 px-2 text-right">{{ formatMonto(item.costo_unitario_estimado) }}</td>
          <td class="py-2 px-2 text-right font-medium">{{ formatMonto(item.subtotal_estimado) }}</td>
        </tr>
        <tr v-if="items.length === 0">
          <td colspan="7" class="py-4 text-center text-gray-400">Sin renglones registrados.</td>
        </tr>
      </tbody>
      <tfoot v-if="total > 0">
        <tr class="border-t border-gray-200">
          <td colspan="6" class="py-2 px-2 text-right text-gray-500">Total estimado</td>
          <td class="py-2 px-2 text-right font-semibold text-gray-800">{{ formatMonto(total) }}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Vista de tarjetas (mobile) -->
    <div class="md:hidden space-y-3">
      <div v-for="item in items" :key="item.id_item"
        class="border border-gray-200 rounded-lg p-3 text-sm">
        <p class="font-medium text-gray-800 mb-2">{{ item.descripcion }}</p>
        <div class="grid grid-cols-2 gap-y-1 text-gray-500">
          <span>Cantidad</span>
          <span class="text-right text-gray-800">{{ item.cantidad }} {{ item.unidad_medida }}</span>
          <span v-if="item.codigo_insumo">Cód. Insumo</span>
          <span v-if="item.codigo_insumo" class="text-right text-gray-800">{{ item.codigo_insumo }}</span>
          <span v-if="item.renglon_numero">Renglón</span>
          <span v-if="item.renglon_numero" class="text-right text-gray-800">{{ item.renglon_numero }} — {{ item.renglon_nombre }}</span>
          <span>Costo Unit.</span>
          <span class="text-right text-gray-800">{{ formatMonto(item.costo_unitario_estimado) }}</span>
          <span>Subtotal</span>
          <span class="text-right font-medium text-gray-800">{{ formatMonto(item.subtotal_estimado) }}</span>
        </div>
      </div>
      <p v-if="items.length === 0" class="py-4 text-center text-gray-400">
        Sin renglones registrados.
      </p>
      <p v-else-if="total > 0" class="text-right text-sm text-gray-500">
        Total estimado: <span class="font-semibold text-gray-800">{{ formatMonto(total) }}</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatMonto } from '../../utils/format';

const props = defineProps({
  expediente: { type: Object, required: true },
});

const items = computed(() => props.expediente.items || []);
// El costo unitario se conoce hasta que se adjudica una cotización; mientras tanto no hay total que mostrar.
const total = computed(() => items.value.reduce((suma, item) => suma + Number(item.subtotal_estimado || 0), 0));
</script>
