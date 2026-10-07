<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
      Certificado de Disponibilidad Presupuestaria (CDP)
    </h4>

    <div v-if="expediente.cdp" class="space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p class="font-medium text-gray-800">{{ expediente.cdp.numero_cdp }}</p>
          <p class="text-sm text-gray-500">{{ expediente.cdp.partida_texto }}</p>
        </div>
        <div class="text-right">
          <span class="px-2 py-1 rounded-full text-xs font-medium" :class="estadoDocumentoBadge(expediente.cdp.estado)">
            {{ expediente.cdp.estado }}
          </span>
          <p class="text-lg font-semibold text-gray-800 mt-1">{{ formatMonto(expediente.cdp.monto_reservado) }}</p>
        </div>
      </div>

      <!-- Avance de las tres firmas del CDP -->
      <ol class="space-y-2 border-t border-gray-100 pt-3 text-sm">
        <li class="flex items-start gap-2">
          <CheckCircle2 class="w-5 h-5 text-green-500 shrink-0" />
          <span>Elaborado por <b class="font-medium">{{ expediente.cdp.elaborado_por_nombre }}</b>
            <span class="text-xs text-gray-400"> &middot; {{ formatFechaHora(expediente.cdp.fecha_elaboracion) }}</span></span>
        </li>
        <li class="flex items-start gap-2">
          <CheckCircle2 v-if="expediente.cdp.aprobado_presupuesto_nombre" class="w-5 h-5 text-green-500 shrink-0" />
          <CircleDashed v-else class="w-5 h-5 text-amber-500 shrink-0" />
          <span v-if="expediente.cdp.aprobado_presupuesto_nombre">Aprobado técnicamente por <b class="font-medium">{{ expediente.cdp.aprobado_presupuesto_nombre }}</b>
            <span class="text-xs text-gray-400"> &middot; {{ formatFechaHora(expediente.cdp.fecha_aprobacion_presupuesto) }}</span></span>
          <span v-else class="text-gray-500">Aprobación técnica pendiente · Encargado de Presupuesto</span>
        </li>
        <li class="flex items-start gap-2">
          <CheckCircle2 v-if="expediente.cdp.vobo_udaf_nombre" class="w-5 h-5 text-green-500 shrink-0" />
          <CircleDashed v-else class="w-5 h-5 text-gray-300 shrink-0" />
          <span v-if="expediente.cdp.vobo_udaf_nombre">Vo.Bo. financiero de <b class="font-medium">{{ expediente.cdp.vobo_udaf_nombre }}</b>
            <span class="text-xs text-gray-400"> &middot; {{ formatFechaHora(expediente.cdp.fecha_vobo_udaf) }}</span></span>
          <span v-else class="text-gray-400">Vo.Bo. financiero pendiente · Jefe UDAF</span>
        </li>
      </ol>

      <div class="flex flex-wrap gap-2">
        <button v-if="expediente.cdp.estado === 'Borrador' && canAprobarCdp" @click="firmaPendiente = 'aprobar'"
          :disabled="loading" class="btn-primario">
          <ShieldCheck class="w-4 h-4" /> Aprobar técnicamente
        </button>
        <button v-if="expediente.cdp.estado === 'Aprobado Técnicamente' && canVoboCdp" @click="firmaPendiente = 'vobo'"
          :disabled="loading" class="btn-acento">
          <ShieldCheck class="w-4 h-4" /> Dar Vo.Bo. financiero
        </button>
      </div>
    </div>

    <div v-else>
      <EstadoVacio :icono="FileText" titulo="Este expediente todavía no tiene un CDP"
        :detalle="canElaborarCdp ? 'Seleccione la partida presupuestaria y el monto a reservar.' : 'Lo elabora el Asistente de Presupuesto.'">
        <button v-if="canElaborarCdp" type="button" @click="showNuevoCdp = true" class="btn-primario mt-2">
          <Plus class="w-4 h-4" /> Elaborar CDP
        </button>
      </EstadoVacio>
    </div>

    <!-- Elaborar el CDP -->
    <ModalBase v-model="showNuevoCdp" titulo="Elaborar CDP" :subtitulo="`Expediente ${expediente.codigo_expediente}`">
      <div class="space-y-4">
        <div>
          <label class="etiqueta">Partida presupuestaria *</label>
          <select v-model="nuevoCdp.id_partida" class="campo">
            <option value="" disabled>Seleccione una partida</option>
            <option v-for="p in partidas" :key="p.value" :value="p.value">
              {{ p.text }} — saldo {{ formatMonto(p.monto_disponible) }}
            </option>
          </select>
        </div>
        <div>
          <label class="etiqueta">Monto a reservar (Q) *</label>
          <input v-model.number="nuevoCdp.monto_reservado" type="number" min="0" step="0.01" class="campo" />
          <p class="text-xs text-gray-400 mt-1">No puede superar el saldo de la partida. El saldo se descuenta cuando el Jefe UDAF da el Vo.Bo.</p>
        </div>
      </div>
      <template #footer>
        <button type="button" @click="showNuevoCdp = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleElaborarCdp" :disabled="loading || !nuevoCdp.id_partida || !nuevoCdp.monto_reservado" class="btn-primario">
          {{ loading ? 'Guardando...' : 'Guardar CDP' }}
        </button>
      </template>
    </ModalBase>
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
import { Plus, FileText, CheckCircle2, CircleDashed, ShieldCheck } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import FirmaModal from '../common/FirmaModal.vue';
import ModalBase from '../common/ModalBase.vue';
import EstadoVacio from '../common/EstadoVacio.vue';
import authService from '../../services/auth.service';
import { formatMonto, formatFechaHora } from '../../utils/format';
import { estadoDocumentoBadge } from '../../utils/estados';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';
import { notificar } from '../../utils/alertas';

const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const loading = ref(false);
const canElaborarCdp = authService.hasPermission(PERMISOS.ELABORAR_CDP);
const canAprobarCdp = authService.hasPermission(PERMISOS.APROBAR_CDP);
const canVoboCdp = authService.hasPermission(PERMISOS.VOBO_FINANCIERO);
const partidas = ref([]);
const showNuevoCdp = ref(false);
const nuevoCdp = ref({ id_partida: '', monto_reservado: null });
const firmaPendiente = ref(null);

const loadPartidas = async () => {
  try {
    partidas.value = await adquisicionesService.getPartidas();
  } catch (err) {
    console.error('No se pudieron cargar las partidas presupuestarias', err);
  }
};

// Ejecuta la llamada, avisa el resultado en la esquina y recarga el expediente.
const ejecutar = async (llamada, exito, falla) => {
  loading.value = true;
  try {
    const resultado = await llamada();
    notificar.exito(exito);
    emit('updated', resultado);
    return true;
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, falla));
    return false;
  } finally {
    loading.value = false;
  }
};

const handleElaborarCdp = async () => {
  const ok = await ejecutar(
    () => adquisicionesService.elaborarCdp(props.expediente.id_expediente, nuevoCdp.value),
    'CDP elaborado',
    'No se pudo elaborar el CDP.'
  );
  if (ok) {
    nuevoCdp.value = { id_partida: '', monto_reservado: null };
    showNuevoCdp.value = false;
  }
};

// La firma pide la contraseña (FirmaModal) y deja constancia; después se ejecuta el paso.
const confirmarFirma = async () => {
  const tipo = firmaPendiente.value;
  firmaPendiente.value = null;
  if (tipo === 'aprobar') {
    await ejecutar(() => adquisicionesService.aprobarCdp(props.expediente.cdp.id_cdp), 'CDP aprobado técnicamente', 'No se pudo aprobar el CDP.');
  } else if (tipo === 'vobo') {
    await ejecutar(() => adquisicionesService.voboCdp(props.expediente.cdp.id_cdp), 'Vo.Bo. financiero dado', 'No se pudo dar el Vo.Bo. financiero.');
  }
};

onMounted(async () => {
  if (canElaborarCdp) {
    await loadPartidas();
  }
});
</script>
