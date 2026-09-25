<template>
  <div>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
        <input v-model="search" type="text" placeholder="Proveedor, NIT o código de expediente..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Adjudicación</label>
        <select v-model="filtroAdjudicada" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todas</option>
          <option value="si">Adjudicadas</option>
          <option value="no">No adjudicadas</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="text-center text-gray-400 py-12">Cargando cotizaciones...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3">Expediente</th>
            <th class="text-left px-4 py-3">Proveedor</th>
            <th class="text-right px-4 py-3">Monto</th>
            <th class="text-right px-4 py-3">Plazo</th>
            <th class="text-left px-4 py-3">Cumple</th>
            <th class="text-left px-4 py-3">Adjudicación</th>
            <th class="text-left px-4 py-3">Registrada</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="c in filtradas" :key="c.id_cotizacion" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <router-link :to="{ name: 'ExpedienteDetail', params: { id: c.id_expediente } }"
                class="font-medium text-accent hover:underline">
                {{ c.codigo_expediente }}
              </router-link>
              <p class="text-xs text-gray-400 truncate max-w-[220px]">{{ c.objeto_compra }}</p>
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ c.proveedor_nombre }}
              <p class="text-xs text-gray-400">{{ c.proveedor_nit }}</p>
            </td>
            <td class="px-4 py-3 text-right font-medium text-gray-800">{{ formatMonto(c.monto_ofertado) }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ c.plazo_entrega_dias ?? '—' }} días</td>
            <td class="px-4 py-3 text-gray-600">{{ c.cumple_especificaciones === null ? '—' : (c.cumple_especificaciones ? 'Sí' : 'No') }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium"
                :class="c.es_adjudicada ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ c.es_adjudicada ? 'Adjudicada' : 'No adjudicada' }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-400">{{ formatFecha(c.fecha_registro) }}</td>
          </tr>
          <tr v-if="filtradas.length === 0">
            <td colspan="7" class="text-center text-gray-400 py-10">No hay cotizaciones que coincidan con la búsqueda.</td>
          </tr>
        </tbody>
      </table>

      <!-- Tarjetas (mobile) -->
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="c in filtradas" :key="c.id_cotizacion" class="p-4">
          <div class="flex items-center justify-between gap-2 mb-1">
            <router-link :to="{ name: 'ExpedienteDetail', params: { id: c.id_expediente } }"
              class="font-medium text-accent hover:underline text-sm">
              {{ c.codigo_expediente }}
            </router-link>
            <span class="px-2 py-1 rounded-full text-xs font-medium shrink-0"
              :class="c.es_adjudicada ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
              {{ c.es_adjudicada ? 'Adjudicada' : 'No adjudicada' }}
            </span>
          </div>
          <p class="text-sm text-gray-600">{{ c.proveedor_nombre }}</p>
          <p class="text-sm font-medium text-gray-800">{{ formatMonto(c.monto_ofertado) }}</p>
          <p class="text-xs text-gray-400">{{ c.plazo_entrega_dias ?? '—' }} días &middot; {{ formatFecha(c.fecha_registro) }}</p>
        </div>
        <div v-if="filtradas.length === 0" class="text-center text-gray-400 py-10 text-sm">
          No hay cotizaciones que coincidan con la búsqueda.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adquisicionesService from '../services/adquisiciones.service';

const cotizaciones = ref([]);
const loading = ref(true);
const error = ref('');
const search = ref('');
const filtroAdjudicada = ref('');

const filtradas = computed(() => {
  const q = search.value.trim().toLowerCase();
  return cotizaciones.value.filter((c) => {
    if (filtroAdjudicada.value === 'si' && !c.es_adjudicada) return false;
    if (filtroAdjudicada.value === 'no' && c.es_adjudicada) return false;
    if (!q) return true;
    return (
      c.proveedor_nombre?.toLowerCase().includes(q) ||
      c.proveedor_nit?.toLowerCase().includes(q) ||
      c.codigo_expediente?.toLowerCase().includes(q)
    );
  });
});

const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);
const formatFecha = (f) => (f ? new Date(f).toLocaleDateString('es-GT') : '—');

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    cotizaciones.value = await adquisicionesService.getReporteCotizaciones();
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar el listado de cotizaciones.';
  } finally {
    loading.value = false;
  }
});
</script>
