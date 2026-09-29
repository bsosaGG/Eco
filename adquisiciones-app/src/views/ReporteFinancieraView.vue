<template>
  <div>
    <div class="flex gap-2 mb-6 flex-wrap">
      <button type="button" @click="tab = 'compromisos'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'compromisos' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">
        Compromisos ({{ data.compromisos.length }})
      </button>
      <button type="button" @click="tab = 'devengados'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'devengados' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">
        Devengados ({{ data.devengados.length }})
      </button>
      <button type="button" @click="tab = 'pagos'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'pagos' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">
        Solicitudes de Pago ({{ data.solicitudes_pago.length }})
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <label class="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
      <input v-model="search" type="text" placeholder="Número o código de expediente..."
        class="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent" />
    </div>

    <div v-if="loading" class="text-center text-gray-400 py-12">Cargando...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

    <!-- Compromisos -->
    <div v-else-if="tab === 'compromisos'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3">Compromiso</th>
            <th class="text-left px-4 py-3">Expediente</th>
            <th class="text-right px-4 py-3">Monto Comprometido</th>
            <th class="text-left px-4 py-3">Estado</th>
            <th class="text-left px-4 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="c in compromisosFiltrados" :key="c.id_compromiso" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ c.numero_comp || '—' }}</td>
            <td class="px-4 py-3">
              <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'compromiso', id: c.id_compromiso } }"
                class="font-medium text-accent hover:underline">{{ c.codigo_expediente }}</router-link>
            </td>
            <td class="px-4 py-3 text-right font-medium text-gray-800">{{ formatMonto(c.monto_comprometido) }}</td>
            <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{{ c.estado }}</span></td>
            <td class="px-4 py-3 text-xs text-gray-400">{{ formatFecha(c.fecha_registro) }}</td>
          </tr>
          <tr v-if="compromisosFiltrados.length === 0">
            <td colspan="5" class="text-center text-gray-400 py-10">No hay compromisos que coincidan con la búsqueda.</td>
          </tr>
        </tbody>
      </table>
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="c in compromisosFiltrados" :key="c.id_compromiso" class="p-4">
          <p class="font-medium text-gray-800 text-sm">{{ c.numero_comp || '—' }}</p>
          <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'compromiso', id: c.id_compromiso } }"
            class="text-accent hover:underline text-sm">{{ c.codigo_expediente }}</router-link>
          <p class="text-sm font-medium text-gray-800">{{ formatMonto(c.monto_comprometido) }}</p>
        </div>
        <div v-if="compromisosFiltrados.length === 0" class="text-center text-gray-400 py-10 text-sm">Sin resultados.</div>
      </div>
    </div>

    <!-- Devengados -->
    <div v-else-if="tab === 'devengados'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3">Devengado</th>
            <th class="text-left px-4 py-3">Expediente</th>
            <th class="text-right px-4 py-3">Monto Devengado</th>
            <th class="text-right px-4 py-3">Retención ISR</th>
            <th class="text-left px-4 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="d in devengadosFiltrados" :key="d.id_devengado" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ d.numero_dev || '—' }}</td>
            <td class="px-4 py-3">
              <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'devengado', id: d.id_devengado } }"
                class="font-medium text-accent hover:underline">{{ d.codigo_expediente }}</router-link>
            </td>
            <td class="px-4 py-3 text-right font-medium text-gray-800">{{ formatMonto(d.monto_devengado) }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ formatMonto(d.retencion_isr) }}</td>
            <td class="px-4 py-3 text-xs text-gray-400">{{ formatFecha(d.fecha_registro) }}</td>
          </tr>
          <tr v-if="devengadosFiltrados.length === 0">
            <td colspan="5" class="text-center text-gray-400 py-10">No hay devengados que coincidan con la búsqueda.</td>
          </tr>
        </tbody>
      </table>
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="d in devengadosFiltrados" :key="d.id_devengado" class="p-4">
          <p class="font-medium text-gray-800 text-sm">{{ d.numero_dev || '—' }}</p>
          <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'devengado', id: d.id_devengado } }"
            class="text-accent hover:underline text-sm">{{ d.codigo_expediente }}</router-link>
          <p class="text-sm font-medium text-gray-800">{{ formatMonto(d.monto_devengado) }}</p>
        </div>
        <div v-if="devengadosFiltrados.length === 0" class="text-center text-gray-400 py-10 text-sm">Sin resultados.</div>
      </div>
    </div>

    <!-- Solicitudes de Pago -->
    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3">Expediente</th>
            <th class="text-left px-4 py-3">Entidad Bancaria</th>
            <th class="text-right px-4 py-3">Monto</th>
            <th class="text-left px-4 py-3">Estado</th>
            <th class="text-left px-4 py-3">Solicitada</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="p in pagosFiltrados" :key="p.id_solicitud_pago" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'solicitud-pago', id: p.id_solicitud_pago } }"
                class="font-medium text-accent hover:underline">{{ p.codigo_expediente }}</router-link>
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ p.entidad_bancaria || '—' }}
              <p class="text-xs text-gray-400">{{ p.tipo_cuenta }} {{ p.numero_cuenta }}</p>
            </td>
            <td class="px-4 py-3 text-right font-medium text-gray-800">{{ formatMonto(p.monto_devengado) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium"
                :class="p.estado === 'Tramitado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
                {{ p.estado }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-400">{{ formatFecha(p.fecha_solicitud) }}</td>
          </tr>
          <tr v-if="pagosFiltrados.length === 0">
            <td colspan="5" class="text-center text-gray-400 py-10">No hay solicitudes de pago que coincidan con la búsqueda.</td>
          </tr>
        </tbody>
      </table>
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="p in pagosFiltrados" :key="p.id_solicitud_pago" class="p-4">
          <div class="flex items-center justify-between gap-2 mb-1">
            <router-link :to="{ name: 'ReporteRegistroDetalle', params: { tipo: 'solicitud-pago', id: p.id_solicitud_pago } }"
              class="text-accent hover:underline text-sm">{{ p.codigo_expediente }}</router-link>
            <span class="px-2 py-1 rounded-full text-xs font-medium"
              :class="p.estado === 'Tramitado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
              {{ p.estado }}
            </span>
          </div>
          <p class="text-sm text-gray-600">{{ p.entidad_bancaria || '—' }}</p>
          <p class="text-sm font-medium text-gray-800">{{ formatMonto(p.monto_devengado) }}</p>
        </div>
        <div v-if="pagosFiltrados.length === 0" class="text-center text-gray-400 py-10 text-sm">Sin resultados.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adquisicionesService from '../services/adquisiciones.service';

const tab = ref('compromisos');
const data = ref({ compromisos: [], devengados: [], solicitudes_pago: [] });
const loading = ref(true);
const error = ref('');
const search = ref('');

const compromisosFiltrados = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return data.value.compromisos;
  return data.value.compromisos.filter(
    (c) => c.numero_comp?.toLowerCase().includes(q) || c.codigo_expediente?.toLowerCase().includes(q)
  );
});
const devengadosFiltrados = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return data.value.devengados;
  return data.value.devengados.filter(
    (d) => d.numero_dev?.toLowerCase().includes(q) || d.codigo_expediente?.toLowerCase().includes(q)
  );
});
const pagosFiltrados = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return data.value.solicitudes_pago;
  return data.value.solicitudes_pago.filter(
    (p) => p.codigo_expediente?.toLowerCase().includes(q) || p.entidad_bancaria?.toLowerCase().includes(q)
  );
});

const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);
const formatFecha = (f) => (f ? new Date(f).toLocaleDateString('es-GT') : '—');

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    data.value = await adquisicionesService.getReporteFinanciera();
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar la información de la fase financiera.';
  } finally {
    loading.value = false;
  }
});
</script>
