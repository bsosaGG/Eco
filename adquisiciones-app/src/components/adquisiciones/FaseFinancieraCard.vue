<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Fase Financiera</h4>

    <p v-if="!['Fase Financiera / Liquidación', 'Pagado y Archivado'].includes(expediente.estado)" class="text-sm text-gray-400 italic">
      Se requiere trasladar el expediente a Contabilidad antes de iniciar la fase financiera.
    </p>

    <template v-else>
      <!-- Compromiso -->
      <div class="mb-5">
        <h5 class="text-xs font-semibold text-gray-400 uppercase mb-2">Compromiso presupuestario</h5>
        <div v-if="expediente.compromiso" class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-800">{{ expediente.compromiso.numero_comp }}</span>
            <span class="text-sm text-gray-800">{{ formatMonto(expediente.compromiso.monto_comprometido) }}</span>
          </div>
          <p class="text-xs text-gray-400">Registrado por {{ expediente.compromiso.registrado_por_nombre }}</p>
        </div>
        <div v-else-if="canRegistrarCompromiso">
          <button @click="showNuevoCompromiso = !showNuevoCompromiso" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
            <Plus class="w-4 h-4" /> Registrar compromiso
          </button>
          <div v-if="showNuevoCompromiso" class="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div v-if="compromisoError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ compromisoError }}</div>
            <input v-model.number="nuevoCompromiso.monto_comprometido" type="number" min="0" step="0.01" placeholder="Monto comprometido (Q)"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            <button @click="handleRegistrarCompromiso" :disabled="loading || !nuevoCompromiso.monto_comprometido"
              class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
              Guardar compromiso
            </button>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 italic">Todavía no se ha registrado el compromiso.</p>
      </div>

      <!-- Devengado -->
      <div class="mb-5 border-t border-gray-100 pt-4">
        <h5 class="text-xs font-semibold text-gray-400 uppercase mb-2">Devengado</h5>
        <p v-if="!expediente.compromiso" class="text-sm text-gray-400 italic">Se requiere el compromiso presupuestario primero.</p>
        <template v-else>
          <div v-if="expediente.devengado" class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-800">{{ expediente.devengado.numero_dev }}</span>
              <span class="text-sm text-gray-800">{{ formatMonto(expediente.devengado.monto_devengado) }}</span>
            </div>
            <p class="text-xs text-gray-500">Retención ISR: {{ formatMonto(expediente.devengado.retencion_isr) }}</p>
            <p class="text-xs text-gray-400">Registrado por {{ expediente.devengado.registrado_por_nombre }}</p>
          </div>
          <div v-else-if="canRegistrarDevengado">
            <button @click="showNuevoDevengado = !showNuevoDevengado" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
              <Plus class="w-4 h-4" /> Registrar devengado
            </button>
            <div v-if="showNuevoDevengado" class="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div v-if="devengadoError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ devengadoError }}</div>
              <input v-model.number="nuevoDevengado.monto_devengado" type="number" min="0" step="0.01" placeholder="Monto devengado (Q)"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <input v-model.number="nuevoDevengado.retencion_isr" type="number" min="0" step="0.01" placeholder="Retención ISR (Q, opcional)"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <button @click="handleRegistrarDevengado" :disabled="loading || !nuevoDevengado.monto_devengado"
                class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
                Guardar devengado
              </button>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 italic">Todavía no se ha registrado el devengado.</p>
        </template>
      </div>

      <!-- Solicitud de Pago -->
      <div class="border-t border-gray-100 pt-4">
        <h5 class="text-xs font-semibold text-gray-400 uppercase mb-2">Solicitud de pago</h5>
        <p v-if="!expediente.devengado" class="text-sm text-gray-400 italic">Se requiere el devengado primero.</p>
        <template v-else>
          <div v-if="expediente.solicitud_pago" class="space-y-2">
            <span class="px-2 py-1 rounded-full text-xs font-medium"
              :class="expediente.solicitud_pago.estado === 'Tramitado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
              {{ expediente.solicitud_pago.estado }}
            </span>
            <p class="text-sm text-gray-600">
              {{ expediente.solicitud_pago.entidad_bancaria }} &middot; {{ expediente.solicitud_pago.tipo_cuenta }} #{{ expediente.solicitud_pago.numero_cuenta }}
            </p>
            <p class="text-xs text-gray-400">Solicitado por {{ expediente.solicitud_pago.solicitado_por_nombre }}</p>
            <p v-if="expediente.solicitud_pago.tramitado_por_nombre" class="text-xs text-gray-400">
              Tramitado por {{ expediente.solicitud_pago.tramitado_por_nombre }} &middot;
              {{ formatFechaHora(expediente.solicitud_pago.fecha_tramite) }}
            </p>

            <button v-if="expediente.solicitud_pago.estado === 'Pendiente' && canAutorizarPago" @click="handleAutorizarPago"
              :disabled="loading"
              class="w-full bg-accent text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 disabled:opacity-50">
              Autorizar y archivar
            </button>
          </div>
          <div v-else-if="canSolicitarPago">
            <button @click="showNuevaSolicitudPago = !showNuevaSolicitudPago" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
              <Plus class="w-4 h-4" /> Trasladar solicitud de pago
            </button>
            <div v-if="showNuevaSolicitudPago" class="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div v-if="solicitudPagoError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ solicitudPagoError }}</div>
              <input v-model="nuevaSolicitudPago.entidad_bancaria" type="text" placeholder="Entidad bancaria"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <input v-model="nuevaSolicitudPago.tipo_cuenta" type="text" placeholder="Tipo de cuenta (ej. Monetaria)"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <input v-model="nuevaSolicitudPago.numero_cuenta" type="text" placeholder="Número de cuenta"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <input v-model="nuevaSolicitudPago.numero_transferencia_cheque" type="text" placeholder="No. transferencia / cheque (opcional)"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <button @click="handleSolicitarPago"
                :disabled="loading || !nuevaSolicitudPago.entidad_bancaria || !nuevaSolicitudPago.tipo_cuenta || !nuevaSolicitudPago.numero_cuenta"
                class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
                Guardar solicitud de pago
              </button>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 italic">Todavía no se ha trasladado la solicitud de pago.</p>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Plus } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';

const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const loading = ref(false);
const canRegistrarCompromiso = authService.hasPermission('adquisiciones:registrar-compromiso');
const canRegistrarDevengado = authService.hasPermission('adquisiciones:registrar-devengado');
const canSolicitarPago = authService.hasPermission('adquisiciones:solicitar-pago');
const canAutorizarPago = authService.hasPermission('adquisiciones:autorizar-pago');

const showNuevoCompromiso = ref(false);
const compromisoError = ref('');
const nuevoCompromiso = ref({ monto_comprometido: null });

const showNuevoDevengado = ref(false);
const devengadoError = ref('');
const nuevoDevengado = ref({ monto_devengado: null, retencion_isr: null });

const showNuevaSolicitudPago = ref(false);
const solicitudPagoError = ref('');
const nuevaSolicitudPago = ref({
  entidad_bancaria: '',
  tipo_cuenta: '',
  numero_cuenta: '',
  numero_transferencia_cheque: '',
});

const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);
const formatFechaHora = (f) => (f ? new Date(f).toLocaleString('es-GT') : '—');

const handleRegistrarCompromiso = async () => {
  loading.value = true;
  compromisoError.value = '';
  try {
    await adquisicionesService.registrarCompromiso(props.expediente.id_expediente, nuevoCompromiso.value);
    nuevoCompromiso.value = { monto_comprometido: null };
    showNuevoCompromiso.value = false;
    emit('updated');
  } catch (err) {
    console.error(err);
    compromisoError.value = err.response?.data?.message || 'No se pudo registrar el compromiso.';
  } finally {
    loading.value = false;
  }
};

const handleRegistrarDevengado = async () => {
  loading.value = true;
  devengadoError.value = '';
  try {
    await adquisicionesService.registrarDevengado(props.expediente.compromiso.id_compromiso, nuevoDevengado.value);
    nuevoDevengado.value = { monto_devengado: null, retencion_isr: null };
    showNuevoDevengado.value = false;
    emit('updated');
  } catch (err) {
    console.error(err);
    devengadoError.value = err.response?.data?.message || 'No se pudo registrar el devengado.';
  } finally {
    loading.value = false;
  }
};

const handleSolicitarPago = async () => {
  loading.value = true;
  solicitudPagoError.value = '';
  try {
    await adquisicionesService.solicitarPago(props.expediente.devengado.id_devengado, nuevaSolicitudPago.value);
    nuevaSolicitudPago.value = { entidad_bancaria: '', tipo_cuenta: '', numero_cuenta: '', numero_transferencia_cheque: '' };
    showNuevaSolicitudPago.value = false;
    emit('updated');
  } catch (err) {
    console.error(err);
    solicitudPagoError.value = err.response?.data?.message || 'No se pudo trasladar la solicitud de pago.';
  } finally {
    loading.value = false;
  }
};

const handleAutorizarPago = async () => {
  loading.value = true;
  try {
    await adquisicionesService.autorizarPago(props.expediente.solicitud_pago.id_solicitud_pago);
    emit('updated');
  } catch (err) {
    console.error(err);
    solicitudPagoError.value = err.response?.data?.message || 'No se pudo autorizar el pago.';
  } finally {
    loading.value = false;
  }
};
</script>
