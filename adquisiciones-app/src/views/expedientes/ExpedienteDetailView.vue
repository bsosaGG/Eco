<template>
  <div v-if="loading" class="text-center text-gray-400 py-12">Cargando expediente...</div>
  <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

  <div v-else-if="expediente" class="space-y-6">
    <ExpedienteHeader :expediente="expediente" />

    <!-- Cuánto estuvo en cada estado y cuánto lleva en el actual -->
    <LineaDeTiempoEstados :historial="expediente.historial_estados" :ahora="expediente.servidor_ahora" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Detalle -->
      <div class="lg:col-span-2 space-y-6">
        <ExpedienteJustificacion :expediente="expediente" />
        <ExpedienteItemsCard :expediente="expediente" />

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
        <AccionesExpediente
          :estados="estados"
          :usuarios="usuariosModulo"
          :can-assign="canAssign"
          :can-devolver="canDevolver"
          :busy="actionLoading"
          :error="actionError"
          :success="actionSuccess"
          @asignar="handleAsignar"
          @cambiar-estado="handleCambiarEstado"
          @devolver="handleDevolver"
        />

        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700">
          Este panel cubre el proceso completo de Baja Cuantía: solicitud inicial, cotizaciones,
          CDP, Orden de Compra, recepción y documentos de soporte, y la fase financiera
          (compromiso, devengado y solicitud de pago), además de los flujos transversales
          (bitácora y devolución).
        </div>

        <BitacoraTimeline :eventos="bitacora" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';
import ExpedienteHeader from '../../components/expediente/ExpedienteHeader.vue';
import LineaDeTiempoEstados from '../../components/expediente/LineaDeTiempoEstados.vue';
import ExpedienteJustificacion from '../../components/expediente/ExpedienteJustificacion.vue';
import ExpedienteItemsCard from '../../components/expediente/ExpedienteItemsCard.vue';
import ExpedienteStepper from '../../components/expediente/ExpedienteStepper.vue';
import AccionesExpediente from '../../components/expediente/AccionesExpediente.vue';
import BitacoraTimeline from '../../components/expediente/BitacoraTimeline.vue';
import CotizacionesCard from '../../components/tramite/CotizacionesCard.vue';
import CdpCard from '../../components/tramite/CdpCard.vue';
import OrdenCompraCard from '../../components/tramite/OrdenCompraCard.vue';
import RecepcionDocumentosCard from '../../components/tramite/RecepcionDocumentosCard.vue';
import FaseFinancieraCard from '../../components/tramite/FaseFinancieraCard.vue';
import { useCarruselPasos } from '../../composables/useCarruselPasos';
import { construirPasos } from '../../utils/pasos';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';

const route = useRoute();
const expediente = ref(null);
const bitacora = ref([]);
const estados = ref([]);
const usuariosModulo = ref([]);
const loading = ref(true);
const error = ref('');

// --- Pasos del proceso: stepper + carrusel (una tarjeta visible a la vez) ---
const componentesPorPaso = {
  cotizacion: CotizacionesCard,
  cdp: CdpCard,
  oc: OrdenCompraCard,
  recepcion: RecepcionDocumentosCard,
  financiera: FaseFinancieraCard,
};
const pasos = computed(() => construirPasos(expediente.value));
const { carouselIndex, pasosVisibles, pasoActual, pasoActualKey, irAPaso, pasoAnterior, pasoSiguiente, sincronizar } =
  useCarruselPasos(pasos);

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const id = route.params.id;
    expediente.value = await adquisicionesService.getExpedienteById(id);
    bitacora.value = await adquisicionesService.getBitacora(id);
    sincronizar();
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar el expediente.';
  } finally {
    loading.value = false;
  }
};

// --- Acciones del panel lateral (asignar, cambiar estado, devolver) ---
const canAssign = authService.hasPermission(PERMISOS.ASSIGN);
const canDevolver = authService.hasPermission(PERMISOS.DEVOLVER);
const actionLoading = ref(false);
const actionError = ref('');
const actionSuccess = ref('');

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
    actionError.value = errorMessage(err, 'No se pudo completar la acción.');
  } finally {
    actionLoading.value = false;
  }
};

const handleAsignar = (usuario) =>
  runAction(() => adquisicionesService.asignarExpediente(expediente.value.id_expediente, usuario.id_usuario));

const handleCambiarEstado = (idEstado) =>
  runAction(() =>
    adquisicionesService.cambiarEstado(expediente.value.id_expediente, idEstado, 'Cambio manual desde el panel.')
  );

const handleDevolver = (devolucion) =>
  runAction(() => adquisicionesService.devolverExpediente(expediente.value.id_expediente, devolucion));

onMounted(async () => {
  await load();
  try {
    estados.value = await adquisicionesService.getEstados();
  } catch (err) {
    console.error('No se pudieron cargar los estados', err);
  }
  if (canAssign) {
    try {
      usuariosModulo.value = await adquisicionesService.getUsuariosModulo();
    } catch (err) {
      console.error('No se pudieron cargar los usuarios del módulo', err);
    }
  }
});
</script>
