<template>
  <div>
    <div class="flex gap-2 mb-6">
      <button type="button" @click="tab = 'cdp'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'cdp' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">
        CDP ({{ cdps.length }})
      </button>
      <button type="button" @click="tab = 'oc'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'oc' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">
        Órdenes de Compra ({{ ordenes.length }})
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
        <input v-model="search" type="text" placeholder="Número, expediente o proveedor..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent" />
      </div>
    </div>

    <div v-if="loading" class="text-center text-gray-400 py-12">Cargando...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

    <!-- Tabla CDP -->
    <div v-else-if="tab === 'cdp'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3">CDP</th>
            <th class="text-left px-4 py-3">Expediente</th>
            <th class="text-right px-4 py-3">Monto Reservado</th>
            <th class="text-left px-4 py-3">Estado CDP</th>
            <th class="text-left px-4 py-3">Elaborado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="c in cdpsFiltrados" :key="c.id_cdp" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ c.numero_cdp || '—' }}</td>
            <td class="px-4 py-3">
              <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'cdp', id: c.id_cdp } }"
                class="font-medium text-accent hover:underline">
                {{ c.codigo_expediente }}
              </router-link>
              <p class="text-xs text-gray-400 truncate max-w-[220px]">{{ c.objeto_compra }}</p>
            </td>
            <td class="px-4 py-3 text-right font-medium text-gray-800">{{ formatMonto(c.monto_reservado) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium" :class="cdpEstadoBadge(c.estado)">{{ c.estado }}</span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-400">{{ formatFecha(c.fecha_elaboracion) }}</td>
          </tr>
          <tr v-if="cdpsFiltrados.length === 0">
            <td colspan="5" class="text-center text-gray-400 py-10">No hay CDP que coincidan con la búsqueda.</td>
          </tr>
        </tbody>
      </table>

      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="c in cdpsFiltrados" :key="c.id_cdp" class="p-4">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-medium text-gray-800 text-sm">{{ c.numero_cdp || '—' }}</span>
            <span class="px-2 py-1 rounded-full text-xs font-medium" :class="cdpEstadoBadge(c.estado)">{{ c.estado }}</span>
          </div>
          <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'cdp', id: c.id_cdp } }"
            class="text-accent hover:underline text-sm">{{ c.codigo_expediente }}</router-link>
          <p class="text-sm font-medium text-gray-800">{{ formatMonto(c.monto_reservado) }}</p>
          <p class="text-xs text-gray-400">{{ formatFecha(c.fecha_elaboracion) }}</p>
        </div>
        <div v-if="cdpsFiltrados.length === 0" class="text-center text-gray-400 py-10 text-sm">
          No hay CDP que coincidan con la búsqueda.
        </div>
      </div>
    </div>

    <!-- Tabla Órdenes de Compra -->
    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3">Orden de Compra</th>
            <th class="text-left px-4 py-3">Expediente</th>
            <th class="text-left px-4 py-3">Proveedor</th>
            <th class="text-right px-4 py-3">Monto Total</th>
            <th class="text-left px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="o in ordenesFiltradas" :key="o.id_orden_compra" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ o.numero_oc || '—' }}</td>
            <td class="px-4 py-3">
              <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'orden-compra', id: o.id_orden_compra } }"
                class="font-medium text-accent hover:underline">
                {{ o.codigo_expediente }}
              </router-link>
              <p class="text-xs text-gray-400 truncate max-w-[220px]">{{ o.objeto_compra }}</p>
            </td>
            <td class="px-4 py-3 text-gray-700">{{ o.proveedor_nombre }}</td>
            <td class="px-4 py-3 text-right font-medium text-gray-800">{{ formatMonto(o.monto_total) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium" :class="ocEstadoBadge(o.estado)">{{ o.estado }}</span>
            </td>
          </tr>
          <tr v-if="ordenesFiltradas.length === 0">
            <td colspan="5" class="text-center text-gray-400 py-10">No hay Órdenes de Compra que coincidan con la búsqueda.</td>
          </tr>
        </tbody>
      </table>

      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="o in ordenesFiltradas" :key="o.id_orden_compra" class="p-4">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-medium text-gray-800 text-sm">{{ o.numero_oc || '—' }}</span>
            <span class="px-2 py-1 rounded-full text-xs font-medium" :class="ocEstadoBadge(o.estado)">{{ o.estado }}</span>
          </div>
          <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'orden-compra', id: o.id_orden_compra } }"
            class="text-accent hover:underline text-sm">{{ o.codigo_expediente }}</router-link>
          <p class="text-sm text-gray-600">{{ o.proveedor_nombre }}</p>
          <p class="text-sm font-medium text-gray-800">{{ formatMonto(o.monto_total) }}</p>
        </div>
        <div v-if="ordenesFiltradas.length === 0" class="text-center text-gray-400 py-10 text-sm">
          No hay Órdenes de Compra que coincidan con la búsqueda.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adquisicionesService from '../services/adquisiciones.service';

const tab = ref('cdp');
const cdps = ref([]);
const ordenes = ref([]);
const loading = ref(true);
const error = ref('');
const search = ref('');

const cdpsFiltrados = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return cdps.value;
  return cdps.value.filter(
    (c) => c.numero_cdp?.toLowerCase().includes(q) || c.codigo_expediente?.toLowerCase().includes(q)
  );
});
const ordenesFiltradas = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return ordenes.value;
  return ordenes.value.filter(
    (o) =>
      o.numero_oc?.toLowerCase().includes(q) ||
      o.codigo_expediente?.toLowerCase().includes(q) ||
      o.proveedor_nombre?.toLowerCase().includes(q)
  );
});

const cdpEstadoBadge = (estado) => {
  if (estado === 'Aprobado') return 'bg-green-100 text-green-700';
  if (estado === 'Aprobado Técnicamente') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
};
const ocEstadoBadge = (estado) => {
  if (estado === 'Emitida') return 'bg-green-100 text-green-700';
  if (estado === 'Aprobada Jefatura') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
};
const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);
const formatFecha = (f) => (f ? new Date(f).toLocaleDateString('es-GT') : '—');

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    [cdps.value, ordenes.value] = await Promise.all([
      adquisicionesService.getReporteCdp(),
      adquisicionesService.getReporteOrdenesCompra(),
    ]);
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar el listado de CDP y Órdenes de Compra.';
  } finally {
    loading.value = false;
  }
});
</script>
