<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Orden de Compra</h4>

    <div v-if="expediente.orden_compra" class="space-y-4">
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

      <!-- Avance de las firmas de la orden -->
      <ol class="space-y-2 border-t border-gray-100 pt-3 text-sm">
        <li class="flex items-start gap-2">
          <CheckCircle2 class="w-5 h-5 text-green-500 shrink-0" />
          <span>Elaborada por <b class="font-medium">{{ expediente.orden_compra.elaborado_por_nombre }}</b></span>
        </li>
        <li class="flex items-start gap-2">
          <CheckCircle2 v-if="expediente.orden_compra.aprobado_jefe_nombre" class="w-5 h-5 text-green-500 shrink-0" />
          <CircleDashed v-else class="w-5 h-5 text-amber-500 shrink-0" />
          <span v-if="expediente.orden_compra.aprobado_jefe_nombre">Aprobada por <b class="font-medium">{{ expediente.orden_compra.aprobado_jefe_nombre }}</b>
            <span class="text-xs text-gray-400"> &middot; {{ formatFechaHora(expediente.orden_compra.fecha_aprobacion_jefe) }}</span></span>
          <span v-else class="text-gray-500">Aprobación pendiente · Jefe de Adquisiciones</span>
        </li>
        <li class="flex items-start gap-2">
          <CheckCircle2 v-if="expediente.orden_compra.autorizado_directora_nombre" class="w-5 h-5 text-green-500 shrink-0" />
          <CircleDashed v-else class="w-5 h-5 text-gray-300 shrink-0" />
          <span v-if="expediente.orden_compra.autorizado_directora_nombre">Autorizada y emitida por <b class="font-medium">{{ expediente.orden_compra.autorizado_directora_nombre }}</b>
            <span class="text-xs text-gray-400"> &middot; {{ formatFechaHora(expediente.orden_compra.fecha_autorizacion_directora) }}</span></span>
          <span v-else class="text-gray-400">Autorización pendiente · Directora General</span>
        </li>
      </ol>

      <div class="flex flex-wrap gap-2">
        <button v-if="expediente.orden_compra.estado === 'Borrador' && canAprobarOc" @click="firmaPendiente = 'aprobar'"
          :disabled="loading" class="btn-primario">
          <ShieldCheck class="w-4 h-4" /> Aprobar técnicamente
        </button>
        <button v-if="expediente.orden_compra.estado === 'Aprobada Jefatura' && canAutorizarOc" @click="firmaPendiente = 'autorizar'"
          :disabled="loading" class="btn-acento">
          <ShieldCheck class="w-4 h-4" /> Autorizar y emitir
        </button>
      </div>
    </div>

    <div v-else>
      <EstadoVacio v-if="!expediente.cdp || expediente.cdp.estado !== 'Aprobado'" :icono="Lock"
        titulo="Falta el CDP aprobado" detalle="La Orden de Compra se elabora cuando el CDP está aprobado en firme." />
      <EstadoVacio v-else :icono="ShoppingCart" titulo="Este expediente todavía no tiene Orden de Compra"
        :detalle="canElaborarOc ? 'El proveedor y el CDP se toman del expediente; solo falta el monto y la entrega.' : 'La elabora el Analista de Adquisiciones.'">
        <button v-if="canElaborarOc" type="button" @click="showNuevaOc = true" class="btn-primario mt-2">
          <Plus class="w-4 h-4" /> Elaborar Orden de Compra
        </button>
      </EstadoVacio>
    </div>

    <!-- Elaborar la Orden de Compra -->
    <ModalBase v-model="showNuevaOc" titulo="Elaborar Orden de Compra" :subtitulo="`Expediente ${expediente.codigo_expediente}`">
      <div class="space-y-4">
        <div>
          <label class="etiqueta">Monto total (Q) *</label>
          <input v-model.number="nuevaOc.monto_total" type="number" min="0" step="0.01" class="campo" />
          <p v-if="expediente.cdp" class="text-xs text-gray-400 mt-1">No puede superar lo reservado en el CDP: {{ formatMonto(expediente.cdp.monto_reservado) }}.</p>
        </div>
        <div>
          <label class="etiqueta">Plazo de entrega</label>
          <input v-model="nuevaOc.plazo_entrega" type="text" placeholder="Ej. 15 días hábiles" class="campo" />
        </div>
        <div>
          <label class="etiqueta">Lugar de entrega</label>
          <input v-model="nuevaOc.lugar_entrega" type="text" class="campo" />
        </div>
      </div>
      <template #footer>
        <button type="button" @click="showNuevaOc = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleElaborarOc" :disabled="loading || !nuevaOc.monto_total" class="btn-primario">
          {{ loading ? 'Guardando...' : 'Guardar Orden de Compra' }}
        </button>
      </template>
    </ModalBase>
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
import { Plus, Lock, ShoppingCart, CheckCircle2, CircleDashed, ShieldCheck } from 'lucide-vue-next';
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
const canElaborarOc = authService.hasPermission(PERMISOS.ELABORAR_OC);
const canAprobarOc = authService.hasPermission(PERMISOS.APROBAR_OC);
const canAutorizarOc = authService.hasPermission(PERMISOS.AUTORIZAR_OC);
const showNuevaOc = ref(false);
const nuevaOc = ref({ monto_total: null, plazo_entrega: '', lugar_entrega: '' });
const firmaPendiente = ref(null);

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

const handleElaborarOc = async () => {
  const ok = await ejecutar(
    () => adquisicionesService.elaborarOrdenCompra(props.expediente.id_expediente, nuevaOc.value),
    'Orden de Compra elaborada',
    'No se pudo elaborar la Orden de Compra.'
  );
  if (ok) {
    nuevaOc.value = { monto_total: null, plazo_entrega: '', lugar_entrega: '' };
    showNuevaOc.value = false;
  }
};

// La firma pide la contraseña (FirmaModal) y deja constancia; después se ejecuta el paso.
const confirmarFirma = async () => {
  const tipo = firmaPendiente.value;
  firmaPendiente.value = null;
  const id = props.expediente.orden_compra.id_orden_compra;
  if (tipo === 'aprobar') {
    await ejecutar(() => adquisicionesService.aprobarOrdenCompra(id), 'Orden de Compra aprobada', 'No se pudo aprobar la Orden de Compra.');
  } else if (tipo === 'autorizar') {
    await ejecutar(() => adquisicionesService.autorizarOrdenCompra(id), 'Orden de Compra autorizada y emitida', 'No se pudo autorizar la Orden de Compra.');
  }
};
</script>
