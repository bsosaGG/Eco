<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
      Certificado de Disponibilidad Presupuestaria (CDP)
    </h4>

    <div v-if="expediente.cdp" class="space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p class="font-medium text-gray-800">{{ expediente.cdp.numero_cdp }}</p>
          <p class="text-sm text-gray-500">{{ expediente.cdp.partida_texto }}</p>
        </div>
        <div class="text-right">
          <span class="px-2 py-1 rounded-full text-xs font-medium" :class="cdpEstadoBadge(expediente.cdp.estado)">
            {{ expediente.cdp.estado }}
          </span>
          <p class="text-lg font-semibold text-gray-800 mt-1">{{ formatMonto(expediente.cdp.monto_reservado) }}</p>
        </div>
      </div>

      <ul class="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-3">
        <li>Elaborado por {{ expediente.cdp.elaborado_por_nombre }} &middot; {{ formatFechaHora(expediente.cdp.fecha_elaboracion) }}</li>
        <li v-if="expediente.cdp.aprobado_presupuesto_nombre">
          Aprobado técnicamente por {{ expediente.cdp.aprobado_presupuesto_nombre }} &middot;
          {{ formatFechaHora(expediente.cdp.fecha_aprobacion_presupuesto) }}
        </li>
        <li v-if="expediente.cdp.vobo_udaf_nombre">
          Vo.Bo. financiero de {{ expediente.cdp.vobo_udaf_nombre }} &middot;
          {{ formatFechaHora(expediente.cdp.fecha_vobo_udaf) }}
        </li>
      </ul>

      <button v-if="expediente.cdp.estado === 'Borrador' && canAprobarCdp" @click="firmaPendiente = 'aprobar'"
        :disabled="loading"
        class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
        Aprobar técnicamente
      </button>
      <button v-if="expediente.cdp.estado === 'Aprobado Técnicamente' && canVoboCdp" @click="firmaPendiente = 'vobo'"
        :disabled="loading"
        class="w-full bg-accent text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 disabled:opacity-50">
        Dar Vo.Bo. financiero
      </button>
    </div>

    <div v-else>
      <p class="text-sm text-gray-400 italic mb-3">Este expediente todavía no tiene un CDP elaborado.</p>

      <div v-if="canElaborarCdp">
        <button @click="showNuevoCdp = !showNuevoCdp" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
          <Plus class="w-4 h-4" /> Elaborar CDP
        </button>

        <div v-if="showNuevoCdp" class="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div v-if="cdpError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ cdpError }}</div>

          <select v-model="nuevoCdp.id_partida" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
            <option value="" disabled>Selecciona una partida presupuestaria</option>
            <option v-for="p in partidas" :key="p.value" :value="p.value">
              {{ p.text }} — saldo {{ formatMonto(p.monto_disponible) }}
            </option>
          </select>
          <input v-model.number="nuevoCdp.monto_reservado" type="number" min="0" step="0.01" placeholder="Monto a reservar (Q)"
            class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
          <button @click="handleElaborarCdp" :disabled="loading || !nuevoCdp.id_partida || !nuevoCdp.monto_reservado"
            class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
            Guardar CDP
          </button>
        </div>
      </div>
    </div>
  </div>

  <FirmaModal v-if="firmaPendiente"
    :titulo="firmaPendiente === 'aprobar' ? 'Aprobar técnicamente el CDP' : 'Dar Vo.Bo. financiero'"
    :descripcion="`CDP ${expediente.cdp?.numero_cdp || ''} · ${formatMonto(expediente.cdp?.monto_reservado)}`"
    @confirmado="confirmarFirma"
    @cancelado="firmaPendiente = null"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import FirmaModal from './FirmaModal.vue';
import authService from '../../services/auth.service';

const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const loading = ref(false);
const canElaborarCdp = true; // TODO: restaurar cuando se trabajen roles y permisos -> authService.hasPermission('adquisiciones:elaborar-cdp')
const canAprobarCdp = true; // TODO: restaurar cuando se trabajen roles y permisos -> authService.hasPermission('adquisiciones:aprobar-cdp')
const canVoboCdp = true; // TODO: restaurar cuando se trabajen roles y permisos -> authService.hasPermission('adquisiciones:vobo-financiero')
const partidas = ref([]);
const showNuevoCdp = ref(false);
const cdpError = ref('');
const nuevoCdp = ref({ id_partida: '', monto_reservado: null });
const firmaPendiente = ref(null);

const cdpEstadoBadge = (estado) => {
  if (estado === 'Aprobado') return 'bg-green-100 text-green-700';
  if (estado === 'Aprobado Técnicamente') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700'; // Borrador
};
const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);
const formatFechaHora = (f) => (f ? new Date(f).toLocaleString('es-GT') : '—');

const loadPartidas = async () => {
  try {
    partidas.value = await adquisicionesService.getPartidas();
  } catch (err) {
    console.error('No se pudieron cargar las partidas presupuestarias', err);
  }
};

const handleElaborarCdp = async () => {
  loading.value = true;
  cdpError.value = '';
  try {
    await adquisicionesService.elaborarCdp(props.expediente.id_expediente, nuevoCdp.value);
    nuevoCdp.value = { id_partida: '', monto_reservado: null };
    showNuevoCdp.value = false;
    emit('updated');
  } catch (err) {
    console.error(err);
    cdpError.value = err.response?.data?.message || 'No se pudo elaborar el CDP.';
  } finally {
    loading.value = false;
  }
};

const handleAprobarCdp = async () => {
  loading.value = true;
  cdpError.value = '';
  try {
    await adquisicionesService.aprobarCdp(props.expediente.cdp.id_cdp);
    emit('updated');
  } catch (err) {
    console.error(err);
    cdpError.value = err.response?.data?.message || 'No se pudo aprobar el CDP.';
  } finally {
    loading.value = false;
  }
};

const handleVoboCdp = async () => {
  loading.value = true;
  cdpError.value = '';
  try {
    await adquisicionesService.voboCdp(props.expediente.cdp.id_cdp);
    emit('updated');
  } catch (err) {
    console.error(err);
    cdpError.value = err.response?.data?.message || 'No se pudo dar el Vo.Bo. financiero.';
  } finally {
    loading.value = false;
  }
};

const confirmarFirma = async () => {
  const tipo = firmaPendiente.value;
  firmaPendiente.value = null;
  if (tipo === 'aprobar') await handleAprobarCdp();
  else if (tipo === 'vobo') await handleVoboCdp();
};

onMounted(async () => {
  if (canElaborarCdp) {
    await loadPartidas();
  }
});
</script>
