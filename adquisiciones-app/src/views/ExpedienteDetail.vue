<template>
  <div v-if="loading" class="text-center text-gray-400 py-12">Cargando expediente...</div>
  <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

  <div v-else-if="expediente" class="space-y-6">
    <!-- Encabezado -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-wrap justify-between items-start gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h3 class="text-xl font-bold text-gray-800">{{ expediente.codigo_expediente }}</h3>
          <span class="px-2 py-1 rounded-full text-xs font-medium" :class="badgeClass(expediente.estado_color)">
            {{ expediente.estado }}
          </span>
        </div>
        <p class="text-gray-600">{{ expediente.objeto_compra }}</p>
        <p class="text-sm text-gray-400 mt-1">
          {{ expediente.unidad_solicitante }} &middot; Solicitado por {{ expediente.usuario_solicitante_nombre }}
        </p>
      </div>
      <div class="text-right text-sm text-gray-500">
        <p>Monto estimado</p>
        <p class="text-xl font-semibold text-gray-800">{{ formatMonto(expediente.monto_estimado) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Detalle -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Justificación</h4>
          <p class="text-gray-700 whitespace-pre-line max-h-32 overflow-y-auto">{{ expediente.justificacion }}</p>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Renglones Solicitados</h4>

          <div class="max-h-56 overflow-y-auto">
            <!-- Vista de tabla (md en adelante) -->
            <table class="hidden md:table w-full text-sm">
              <thead class="text-gray-400 text-xs uppercase">
                <tr>
                  <th class="text-left py-2 px-2">Descripción</th>
                  <th class="text-right py-2 px-2">Cantidad</th>
                  <th class="text-left py-2 px-2">Unidad</th>
                  <th class="text-right py-2 px-2">Costo Unit.</th>
                  <th class="text-right py-2 px-2">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in expediente.items || []" :key="item.id_item">
                  <td class="py-2 px-2">{{ item.descripcion }}</td>
                  <td class="py-2 px-2 text-right">{{ item.cantidad }}</td>
                  <td class="py-2 px-2">{{ item.unidad_medida }}</td>
                  <td class="py-2 px-2 text-right">{{ formatMonto(item.costo_unitario_estimado) }}</td>
                  <td class="py-2 px-2 text-right font-medium">{{ formatMonto(item.subtotal_estimado) }}</td>
                </tr>
                <tr v-if="!expediente.items || expediente.items.length === 0">
                  <td colspan="5" class="py-4 text-center text-gray-400">Sin renglones registrados.</td>
                </tr>
              </tbody>
            </table>

            <!-- Vista de tarjetas (mobile) -->
            <div class="md:hidden space-y-3">
              <div v-for="item in expediente.items || []" :key="item.id_item"
                class="border border-gray-200 rounded-lg p-3 text-sm">
                <p class="font-medium text-gray-800 mb-2">{{ item.descripcion }}</p>
                <div class="grid grid-cols-2 gap-y-1 text-gray-500">
                  <span>Cantidad</span>
                  <span class="text-right text-gray-800">{{ item.cantidad }} {{ item.unidad_medida }}</span>
                  <span>Costo Unit.</span>
                  <span class="text-right text-gray-800">{{ formatMonto(item.costo_unitario_estimado) }}</span>
                  <span>Subtotal</span>
                  <span class="text-right font-medium text-gray-800">{{ formatMonto(item.subtotal_estimado) }}</span>
                </div>
              </div>
              <p v-if="!expediente.items || expediente.items.length === 0" class="py-4 text-center text-gray-400">
                Sin renglones registrados.
              </p>
            </div>
          </div>
        </div>

        <!-- Stepper del proceso -->
        <ExpedienteStepper :steps="pasos" :estado="expediente.estado" :current="pasoActualKey" @select="irAPaso" />

        <!-- Carrusel de pasos del proceso -->
        <div v-if="pasoActual">
          <div class="flex items-center justify-between mb-2 px-1">
            <button type="button" @click="pasoAnterior" :disabled="carouselIndex === 0"
              class="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft class="w-4 h-4 text-gray-500" />
            </button>
            <p class="text-xs text-gray-400">
              Paso {{ carouselIndex + 1 }} de {{ pasosVisibles.length }} &middot; {{ pasoActual.label }}
            </p>
            <button type="button" @click="pasoSiguiente" :disabled="carouselIndex === pasosVisibles.length - 1"
              class="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight class="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div class="max-h-[55vh] overflow-y-auto">
            <component :is="componentesPorPaso[pasoActual.key]" :expediente="expediente" @updated="load" />
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 italic">
          Todavía no hay pasos del proceso disponibles para este expediente.
        </p>
      </div>

      <!-- Acciones -->
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Acciones</h4>

          <div v-if="actionError" class="bg-red-50 text-red-600 p-2 rounded text-xs mb-3">{{ actionError }}</div>
          <div v-if="actionSuccess" class="bg-green-50 text-green-600 p-2 rounded text-xs mb-3">{{ actionSuccess }}</div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Asignar a un funcionario</label>
              <div class="flex gap-2">
                <input v-model="asignacionInput" type="text" placeholder="Nombre del analista"
                  class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                <button @click="handleAsignar" :disabled="actionLoading"
                  class="bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
                  Asignar
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Cambiar estado</label>
              <div class="flex gap-2">
                <select v-model="estadoSeleccionado" class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm">
                  <option value="" disabled>Selecciona un estado</option>
                  <option v-for="e in estados" :key="e.value" :value="e.value">{{ e.text }}</option>
                </select>
                <button @click="handleCambiarEstado" :disabled="actionLoading || !estadoSeleccionado"
                  class="bg-accent text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 disabled:opacity-50">
                  Aplicar
                </button>
              </div>
            </div>

            <button @click="showDevolver = !showDevolver"
              class="text-sm text-red-500 hover:underline pt-2">
              Devolver con observaciones
            </button>
            <div v-if="showDevolver" class="space-y-2 pt-2 border-t border-gray-100">
              <input v-model="devolucion.etapa_origen" type="text" placeholder="Etapa (ej. Cotización)"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <input v-model="devolucion.motivo" type="text" placeholder="Motivo"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <textarea v-model="devolucion.descripcion" rows="2" placeholder="Descripción / checklist a corregir"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"></textarea>
              <button @click="handleDevolver" :disabled="actionLoading"
                class="w-full bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 disabled:opacity-50">
                Confirmar devolución
              </button>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700">
          Este panel cubre el proceso completo de Baja Cuantía: solicitud inicial, cotizaciones,
          CDP, Orden de Compra, recepción y documentos de soporte, y la fase financiera
          (compromiso, devengado y solicitud de pago), además de los flujos transversales
          (bitácora y devolución).
        </div>

        <!-- Bitácora -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Bitácora de Trazabilidad</h4>
          <ol class="space-y-4 max-h-80 overflow-y-auto pr-1">
            <li v-for="log in bitacora" :key="log.id_bitacora" class="flex gap-3">
              <div class="w-2 h-2 mt-2 rounded-full bg-accent flex-shrink-0"></div>
              <div>
                <p class="text-sm text-gray-800 font-medium">{{ log.accion }}</p>
                <p v-if="log.observacion" class="text-sm text-gray-500">{{ log.observacion }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ log.usuario_nombre }} &middot; {{ formatFechaHora(log.fecha_hora) }}</p>
              </div>
            </li>
            <li v-if="bitacora.length === 0" class="text-sm text-gray-400 italic">Sin movimientos registrados todavía.</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import adquisicionesService from '../services/adquisiciones.service';
import ExpedienteStepper from '../components/adquisiciones/ExpedienteStepper.vue';
import CotizacionesCard from '../components/adquisiciones/CotizacionesCard.vue';
import CdpCard from '../components/adquisiciones/CdpCard.vue';
import OrdenCompraCard from '../components/adquisiciones/OrdenCompraCard.vue';
import RecepcionDocumentosCard from '../components/adquisiciones/RecepcionDocumentosCard.vue';
import FaseFinancieraCard from '../components/adquisiciones/FaseFinancieraCard.vue';

const route = useRoute();
const expediente = ref(null);
const bitacora = ref([]);
const estados = ref([]);
const loading = ref(true);
const error = ref('');

const ETAPA_ORDER = ['Solicitud', 'Cotizacion', 'CDP', 'OrdenCompra', 'Recepcion', 'Financiero', 'Cierre'];
const pasos = computed(() => {
  if (!expediente.value) return [];
  const currentIdx = ETAPA_ORDER.indexOf(expediente.value.estado_etapa);
  const statusFor = (etapa) => {
    if (currentIdx === -1) return 'pendiente';
    const idx = ETAPA_ORDER.indexOf(etapa);
    if (idx < currentIdx) return 'completado';
    if (idx === currentIdx) return 'activo';
    return 'pendiente';
  };
  return [
    { key: 'cotizacion', label: 'Cotizaciones', status: statusFor('Cotizacion') },
    { key: 'cdp', label: 'CDP', status: statusFor('CDP') },
    { key: 'oc', label: 'Orden de Compra', status: statusFor('OrdenCompra') },
    { key: 'recepcion', label: 'Recepción y Docs.', status: statusFor('Recepcion') },
    {
      key: 'financiera',
      label: 'Fase Financiera',
      status: statusFor('Financiero'),
      subpasos: [
        { key: 'compromiso', done: !!expediente.value.compromiso },
        { key: 'devengado', done: !!expediente.value.devengado },
        { key: 'pago', done: expediente.value.solicitud_pago?.estado === 'Tramitado' },
      ],
    },
  ];
});

// --- Carrusel de pasos del proceso (una tarjeta visible a la vez) ---
const componentesPorPaso = {
  cotizacion: CotizacionesCard,
  cdp: CdpCard,
  oc: OrdenCompraCard,
  recepcion: RecepcionDocumentosCard,
  financiera: FaseFinancieraCard,
};
const carouselIndex = ref(0);
const pasosVisibles = computed(() => pasos.value.filter((p) => p.status !== 'pendiente'));
const pasoActual = computed(() => pasosVisibles.value[carouselIndex.value] || null);
const pasoActualKey = computed(() => pasoActual.value?.key || '');

const irAPaso = (key) => {
  const idx = pasosVisibles.value.findIndex((p) => p.key === key);
  if (idx !== -1) carouselIndex.value = idx;
};
const pasoAnterior = () => {
  if (carouselIndex.value > 0) carouselIndex.value -= 1;
};
const pasoSiguiente = () => {
  if (carouselIndex.value < pasosVisibles.value.length - 1) carouselIndex.value += 1;
};
const sincronizarCarrusel = () => {
  const visibles = pasosVisibles.value;
  const idxActivo = visibles.findIndex((p) => p.status === 'activo');
  if (idxActivo !== -1) {
    carouselIndex.value = idxActivo;
  } else if (carouselIndex.value >= visibles.length) {
    carouselIndex.value = Math.max(0, visibles.length - 1);
  }
};

const asignacionInput = ref('');
const estadoSeleccionado = ref('');
const showDevolver = ref(false);
const devolucion = ref({ etapa_origen: '', motivo: '', descripcion: '' });
const actionLoading = ref(false);
const actionError = ref('');
const actionSuccess = ref('');

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
const formatFechaHora = (f) => (f ? new Date(f).toLocaleString('es-GT') : '—');

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const id = route.params.id;
    expediente.value = await adquisicionesService.getExpedienteById(id);
    bitacora.value = await adquisicionesService.getBitacora(id);
    sincronizarCarrusel();
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar el expediente.';
  } finally {
    loading.value = false;
  }
};

const runAction = async (fn) => {
  actionLoading.value = true;
  actionError.value = '';
  actionSuccess.value = '';
  try {
    await fn();
    actionSuccess.value = 'Acción aplicada correctamente.';
    await load();
  } catch (err) {
    console.error(err);
    actionError.value = err.response?.data?.message || 'No se pudo completar la acción.';
  } finally {
    actionLoading.value = false;
  }
};

const handleAsignar = () =>
  runAction(() => adquisicionesService.asignarExpediente(expediente.value.id_expediente, asignacionInput.value));

const handleCambiarEstado = () =>
  runAction(() =>
    adquisicionesService.cambiarEstado(expediente.value.id_expediente, estadoSeleccionado.value, 'Cambio manual desde el panel.')
  );

const handleDevolver = () =>
  runAction(() => adquisicionesService.devolverExpediente(expediente.value.id_expediente, devolucion.value));

onMounted(async () => {
  await load();
  try {
    estados.value = await adquisicionesService.getEstados();
  } catch (err) {
    console.error('No se pudieron cargar los estados', err);
  }
});
</script>
