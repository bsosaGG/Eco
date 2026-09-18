<template>
  <div>
    <!-- Filtros -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
        <input v-model="search" @input="debouncedLoad" type="text" placeholder="Código u objeto de compra..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent" />
      </div>
      <div class="min-w-[200px]">
        <label class="block text-xs font-medium text-gray-500 mb-1">Estado</label>
        <select v-model="estadoFiltro" @change="() => { page = 1; load(); }"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent">
          <option value="">Todos</option>
          <option v-for="e in estados" :key="e.value" :value="e.value">{{ e.text }}</option>
        </select>
      </div>
      <router-link :to="{ name: 'ExpedienteCreate' }"
        class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center gap-2">
        <Plus class="w-4 h-4" /> Nueva Solicitud
      </router-link>
    </div>

    <!-- Estado de carga / error -->
    <div v-if="loading" class="text-center text-gray-400 py-12">Cargando expedientes...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

    <!-- Tabla (md en adelante) -->
    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3">Código</th>
            <th class="text-left px-4 py-3">Unidad Solicitante</th>
            <th class="text-left px-4 py-3">Objeto de la Compra</th>
            <th class="text-right px-4 py-3">Monto Estimado</th>
            <th class="text-left px-4 py-3">Estado</th>
            <th class="text-left px-4 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="exp in expedientes" :key="exp.id_expediente"
            @click="$router.push({ name: 'ExpedienteDetail', params: { id: exp.id_expediente } })"
            class="hover:bg-gray-50 cursor-pointer transition-colors">
            <td class="px-4 py-3 font-medium text-primary">{{ exp.codigo_expediente }}</td>
            <td class="px-4 py-3 text-gray-600">{{ exp.unidad_solicitante }}</td>
            <td class="px-4 py-3 text-gray-800 max-w-xs truncate">{{ exp.objeto_compra }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ formatMonto(exp.monto_estimado) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium"
                :class="badgeClass(exp.estado_color)">{{ exp.estado }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatFecha(exp.fecha_creacion) }}</td>
          </tr>
          <tr v-if="expedientes.length === 0">
            <td colspan="6" class="text-center text-gray-400 py-10">No hay expedientes que coincidan con el filtro.</td>
          </tr>
        </tbody>
      </table>

      <!-- Tarjetas (mobile) -->
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="exp in expedientes" :key="exp.id_expediente"
          @click="$router.push({ name: 'ExpedienteDetail', params: { id: exp.id_expediente } })"
          class="p-4 active:bg-gray-50 cursor-pointer">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-medium text-primary text-sm">{{ exp.codigo_expediente }}</span>
            <span class="px-2 py-1 rounded-full text-xs font-medium shrink-0"
              :class="badgeClass(exp.estado_color)">{{ exp.estado }}</span>
          </div>
          <p class="text-gray-800 text-sm truncate">{{ exp.objeto_compra }}</p>
          <div class="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>{{ exp.unidad_solicitante }}</span>
            <span>{{ formatFecha(exp.fecha_creacion) }}</span>
          </div>
          <p class="text-right text-sm text-gray-600 mt-1">{{ formatMonto(exp.monto_estimado) }}</p>
        </div>
        <div v-if="expedientes.length === 0" class="text-center text-gray-400 py-10 text-sm">
          No hay expedientes que coincidan con el filtro.
        </div>
      </div>

      <!-- Paginado -->
      <div class="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-sm">
        <span class="text-gray-500">Página {{ page }}</span>
        <div class="flex items-center gap-2">
          <button type="button" @click="prevPage" :disabled="page === 1"
            class="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1">
            <ChevronLeft class="w-4 h-4" /> Anterior
          </button>
          <button type="button" @click="nextPage" :disabled="!hasNextPage"
            class="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1">
            Siguiente <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import adquisicionesService from '../services/adquisiciones.service';

const expedientes = ref([]);
const estados = ref([]);
const search = ref('');
const estadoFiltro = ref('');
const loading = ref(true);
const error = ref('');
let debounceTimer = null;

const page = ref(1);
const pageSize = 15;
const hasNextPage = ref(false);

const colorMap = {
  secondary: 'bg-gray-100 text-gray-600',
  primary: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-sky-100 text-sky-700',
  success: 'bg-green-100 text-green-700',
  danger: 'bg-red-100 text-red-700',
  dark: 'bg-slate-200 text-slate-700',
};
const badgeClass = (color) => colorMap[color] || colorMap.secondary;

const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);
const formatFecha = (f) => (f ? new Date(f).toLocaleDateString('es-GT') : '—');

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const rows = await adquisicionesService.getExpedientes({
      search: search.value || undefined,
      estado: estadoFiltro.value || undefined,
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
    });
    expedientes.value = rows;
    // El endpoint no devuelve un total; usamos si la página vino llena como
    // indicio de que puede haber una página siguiente.
    hasNextPage.value = rows.length === pageSize;
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar la bandeja de expedientes.';
  } finally {
    loading.value = false;
  }
};

const debouncedLoad = () => {
  page.value = 1;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 350);
};

const prevPage = () => {
  if (page.value === 1) return;
  page.value -= 1;
  load();
};

const nextPage = () => {
  if (!hasNextPage.value) return;
  page.value += 1;
  load();
};

onMounted(async () => {
  try {
    estados.value = await adquisicionesService.getEstados();
  } catch (err) {
    console.error('No se pudieron cargar los estados', err);
  }
  await load();
});
</script>
