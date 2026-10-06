<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Orden de Compra</h4>

    <div v-if="expediente.orden_compra" class="space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p class="font-medium text-gray-800">{{ expediente.orden_compra.numero_oc }}</p>
          <p class="text-sm text-gray-500">Proveedor: {{ expediente.orden_compra.proveedor_nombre }}</p>
        </div>
        <div class="text-right">
          <span class="px-2 py-1 rounded-full text-xs font-medium" :class="estadoDocumentoBadge(expediente.orden_compra.estado)">
            {{ expediente.orden_compra.estado }}
          </span>
          <p class="text-lg font-semibold text-gray-800 mt-1">{{ formatMonto(expediente.orden_compra.monto_total) }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-y-1 text-sm text-gray-500 border-t border-gray-100 pt-3">
        <span>Plazo de entrega</span>
        <span class="text-right text-gray-800">{{ expediente.orden_compra.plazo_entrega || '—' }}</span>
        <span>Lugar de entrega</span>
        <span class="text-right text-gray-800">{{ expediente.orden_compra.lugar_entrega || '—' }}</span>
      </div>

      <ul class="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-3">
        <li>Elaborada por {{ expediente.orden_compra.elaborado_por_nombre }}</li>
        <li v-if="expediente.orden_compra.aprobado_jefe_nombre">
          Aprobada por {{ expediente.orden_compra.aprobado_jefe_nombre }} &middot;
          {{ formatFechaHora(expediente.orden_compra.fecha_aprobacion_jefe) }}
        </li>
        <li v-if="expediente.orden_compra.autorizado_directora_nombre">
          Autorizada y emitida por {{ expediente.orden_compra.autorizado_directora_nombre }} &middot;
          {{ formatFechaHora(expediente.orden_compra.fecha_autorizacion_directora) }}
        </li>
      </ul>

      <button v-if="expediente.orden_compra.estado === 'Borrador' && canAprobarOc" @click="firmaPendiente = 'aprobar'"
        :disabled="loading"
        class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
        Aprobar técnicamente
      </button>
      <button v-if="expediente.orden_compra.estado === 'Aprobada Jefatura' && canAutorizarOc" @click="firmaPendiente = 'autorizar'"
        :disabled="loading"
        class="w-full bg-accent text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 disabled:opacity-50">
        Autorizar y emitir
      </button>
    </div>

    <div v-else>
      <p v-if="!expediente.cdp || expediente.cdp.estado !== 'Aprobado'" class="text-sm text-gray-400 italic">
        Se requiere un CDP aprobado en firme antes de elaborar la Orden de Compra.
      </p>
      <template v-else>
        <p class="text-sm text-gray-400 italic mb-3">Este expediente todavía no tiene una Orden de Compra elaborada.</p>

        <div v-if="canElaborarOc">
          <button @click="showNuevaOc = !showNuevaOc" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
            <Plus class="w-4 h-4" /> Elaborar Orden de Compra
          </button>

          <div v-if="showNuevaOc" class="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div v-if="ocError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ ocError }}</div>

            <input v-model.number="nuevaOc.monto_total" type="number" min="0" step="0.01" placeholder="Monto total (Q)"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            <input v-model="nuevaOc.plazo_entrega" type="text" placeholder="Plazo de entrega (ej. 15 días hábiles)"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            <input v-model="nuevaOc.lugar_entrega" type="text" placeholder="Lugar de entrega"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            <button @click="handleElaborarOc" :disabled="loading || !nuevaOc.monto_total"
              class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
              Guardar Orden de Compra
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>

  <FirmaModal v-if="firmaPendiente"
    :titulo="firmaPendiente === 'aprobar' ? 'Aprobar técnicamente la Orden de Compra' : 'Autorizar y emitir la Orden de Compra'"
    :descripcion="`OC ${expediente.orden_compra?.numero_oc || ''} · ${formatMonto(expediente.orden_compra?.monto_total)}`"
    @confirmado="confirmarFirma"
    @cancelado="firmaPendiente = null"
  />
</template>

<script setup>
import { ref } from 'vue';
import { Plus } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import FirmaModal from '../common/FirmaModal.vue';
import authService from '../../services/auth.service';
import { formatMonto, formatFechaHora } from '../../utils/format';
import { estadoDocumentoBadge } from '../../utils/estados';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';

const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const loading = ref(false);
const canElaborarOc = authService.hasPermission(PERMISOS.ELABORAR_OC);
const canAprobarOc = authService.hasPermission(PERMISOS.APROBAR_OC);
const canAutorizarOc = authService.hasPermission(PERMISOS.AUTORIZAR_OC);
const showNuevaOc = ref(false);
const ocError = ref('');
const nuevaOc = ref({ monto_total: null, plazo_entrega: '', lugar_entrega: '' });
const firmaPendiente = ref(null);

const handleElaborarOc = async () => {
  loading.value = true;
  ocError.value = '';
  try {
    await adquisicionesService.elaborarOrdenCompra(props.expediente.id_expediente, nuevaOc.value);
    nuevaOc.value = { monto_total: null, plazo_entrega: '', lugar_entrega: '' };
    showNuevaOc.value = false;
    emit('updated');
  } catch (err) {
    console.error(err);
    ocError.value = errorMessage(err, 'No se pudo elaborar la Orden de Compra.');
  } finally {
    loading.value = false;
  }
};

const handleAprobarOc = async () => {
  loading.value = true;
  ocError.value = '';
  try {
    await adquisicionesService.aprobarOrdenCompra(props.expediente.orden_compra.id_orden_compra);
    emit('updated');
  } catch (err) {
    console.error(err);
    ocError.value = errorMessage(err, 'No se pudo aprobar la Orden de Compra.');
  } finally {
    loading.value = false;
  }
};

const handleAutorizarOc = async () => {
  loading.value = true;
  ocError.value = '';
  try {
    await adquisicionesService.autorizarOrdenCompra(props.expediente.orden_compra.id_orden_compra);
    emit('updated');
  } catch (err) {
    console.error(err);
    ocError.value = errorMessage(err, 'No se pudo autorizar la Orden de Compra.');
  } finally {
    loading.value = false;
  }
};

const confirmarFirma = async () => {
  const tipo = firmaPendiente.value;
  firmaPendiente.value = null;
  if (tipo === 'aprobar') await handleAprobarOc();
  else if (tipo === 'autorizar') await handleAutorizarOc();
};
</script>
