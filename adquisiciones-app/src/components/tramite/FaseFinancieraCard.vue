<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Fase Financiera</h4>

    <EstadoVacio v-if="!['Fase Financiera / Liquidación', 'Pagado y Archivado'].includes(expediente.estado)" :icono="Lock"
      titulo="Todavía no inicia la fase financiera" detalle="Se requiere trasladar el expediente a Contabilidad antes de iniciar la fase financiera." />

    <template v-else>
      <!-- Compromiso -->
      <div class="mb-5">
        <div class="flex items-center justify-between gap-3 mb-2">
          <h5 class="text-xs font-semibold text-gray-400 uppercase">Compromiso presupuestario</h5>
          <button v-if="!expediente.compromiso && canRegistrarCompromiso" type="button" @click="showNuevoCompromiso = true" class="btn-primario">
            <Plus class="w-4 h-4" /> Registrar compromiso
          </button>
        </div>
        <div v-if="expediente.compromiso" class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-800">{{ expediente.compromiso.numero_comp }}</span>
            <span class="text-sm text-gray-800">{{ formatMonto(expediente.compromiso.monto_comprometido) }}</span>
          </div>
          <p class="text-xs text-gray-400">Registrado por {{ expediente.compromiso.registrado_por_nombre }}</p>
        </div>
        <p v-else-if="!canRegistrarCompromiso" class="text-sm text-gray-400 italic">Todavía no se ha registrado el compromiso.</p>
      </div>

      <!-- Devengado -->
      <div class="mb-5 border-t border-gray-100 pt-4">
        <div class="flex items-center justify-between gap-3 mb-2">
          <h5 class="text-xs font-semibold text-gray-400 uppercase">Devengado</h5>
          <button v-if="expediente.compromiso && !expediente.devengado && canRegistrarDevengado" type="button" @click="showNuevoDevengado = true" class="btn-primario">
            <Plus class="w-4 h-4" /> Registrar devengado
          </button>
        </div>
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
          <p v-else-if="!canRegistrarDevengado" class="text-sm text-gray-400 italic">Todavía no se ha registrado el devengado.</p>
        </template>
      </div>

      <!-- Solicitud de Pago -->
      <div class="border-t border-gray-100 pt-4">
        <div class="flex items-center justify-between gap-3 mb-2">
          <h5 class="text-xs font-semibold text-gray-400 uppercase">Solicitud de pago</h5>
          <button v-if="expediente.devengado && !expediente.solicitud_pago && canSolicitarPago" type="button" @click="showNuevaSolicitudPago = true" class="btn-primario">
            <Plus class="w-4 h-4" /> Trasladar solicitud de pago
          </button>
        </div>
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
              :disabled="loading" class="btn-acento">
              <CheckCircle2 class="w-4 h-4" /> Autorizar y archivar
            </button>
          </div>
          <p v-else-if="!canSolicitarPago" class="text-sm text-gray-400 italic">Todavía no se ha trasladado la solicitud de pago.</p>
        </template>
      </div>
    </template>

    <!-- Registrar compromiso -->
    <ModalBase v-model="showNuevoCompromiso" titulo="Registrar compromiso" :subtitulo="`Expediente ${expediente.codigo_expediente}`" size="sm">
      <label class="etiqueta">Monto comprometido (Q) *</label>
      <input v-model.number="nuevoCompromiso.monto_comprometido" type="number" min="0" step="0.01" class="campo" />
      <template #footer>
        <button type="button" @click="showNuevoCompromiso = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleRegistrarCompromiso" :disabled="loading || !nuevoCompromiso.monto_comprometido" class="btn-primario">
          {{ loading ? 'Guardando...' : 'Guardar compromiso' }}
        </button>
      </template>
    </ModalBase>

    <!-- Registrar devengado -->
    <ModalBase v-model="showNuevoDevengado" titulo="Registrar devengado" :subtitulo="`Expediente ${expediente.codigo_expediente}`" size="sm">
      <div class="space-y-4">
        <div>
          <label class="etiqueta">Monto devengado (Q) *</label>
          <input v-model.number="nuevoDevengado.monto_devengado" type="number" min="0" step="0.01" class="campo" />
        </div>
        <div>
          <label class="etiqueta">Retención ISR (Q, opcional)</label>
          <input v-model.number="nuevoDevengado.retencion_isr" type="number" min="0" step="0.01" class="campo" />
        </div>
      </div>
      <template #footer>
        <button type="button" @click="showNuevoDevengado = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleRegistrarDevengado" :disabled="loading || !nuevoDevengado.monto_devengado" class="btn-primario">
          {{ loading ? 'Guardando...' : 'Guardar devengado' }}
        </button>
      </template>
    </ModalBase>

    <!-- Trasladar la solicitud de pago -->
    <ModalBase v-model="showNuevaSolicitudPago" titulo="Solicitud de pago" :subtitulo="`Expediente ${expediente.codigo_expediente}`">
      <div class="space-y-4">
        <div>
          <label class="etiqueta">Entidad bancaria *</label>
          <input v-model="nuevaSolicitudPago.entidad_bancaria" type="text" class="campo" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="etiqueta">Tipo de cuenta *</label>
            <input v-model="nuevaSolicitudPago.tipo_cuenta" type="text" placeholder="Ej. Monetaria" class="campo" />
          </div>
          <div>
            <label class="etiqueta">Número de cuenta *</label>
            <input v-model="nuevaSolicitudPago.numero_cuenta" type="text" class="campo" />
          </div>
        </div>
        <div>
          <label class="etiqueta">No. transferencia / cheque (opcional)</label>
          <input v-model="nuevaSolicitudPago.numero_transferencia_cheque" type="text" class="campo" />
        </div>
      </div>
      <template #footer>
        <button type="button" @click="showNuevaSolicitudPago = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleSolicitarPago"
          :disabled="loading || !nuevaSolicitudPago.entidad_bancaria || !nuevaSolicitudPago.tipo_cuenta || !nuevaSolicitudPago.numero_cuenta" class="btn-primario">
          {{ loading ? 'Guardando...' : 'Guardar solicitud de pago' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Plus, Lock, CheckCircle2 } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';
import ModalBase from '../common/ModalBase.vue';
import EstadoVacio from '../common/EstadoVacio.vue';
import { formatMonto, formatFechaHora } from '../../utils/format';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';
import { confirmar, notificar } from '../../utils/alertas';

const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const loading = ref(false);
const canRegistrarCompromiso = authService.hasPermission(PERMISOS.REGISTRAR_COMPROMISO);
const canRegistrarDevengado = authService.hasPermission(PERMISOS.REGISTRAR_DEVENGADO);
const canSolicitarPago = authService.hasPermission(PERMISOS.SOLICITAR_PAGO);
const canAutorizarPago = authService.hasPermission(PERMISOS.AUTORIZAR_PAGO);

const showNuevoCompromiso = ref(false);
const nuevoCompromiso = ref({ monto_comprometido: null });
const showNuevoDevengado = ref(false);
const nuevoDevengado = ref({ monto_devengado: null, retencion_isr: null });
const showNuevaSolicitudPago = ref(false);
const solicitudPagoVacia = () => ({ entidad_bancaria: '', tipo_cuenta: '', numero_cuenta: '', numero_transferencia_cheque: '' });
const nuevaSolicitudPago = ref(solicitudPagoVacia());

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

const handleRegistrarCompromiso = async () => {
  const ok = await ejecutar(
    () => adquisicionesService.registrarCompromiso(props.expediente.id_expediente, nuevoCompromiso.value),
    'Compromiso registrado',
    'No se pudo registrar el compromiso.'
  );
  if (ok) {
    nuevoCompromiso.value = { monto_comprometido: null };
    showNuevoCompromiso.value = false;
  }
};

const handleRegistrarDevengado = async () => {
  const ok = await ejecutar(
    () => adquisicionesService.registrarDevengado(props.expediente.compromiso.id_compromiso, nuevoDevengado.value),
    'Devengado registrado',
    'No se pudo registrar el devengado.'
  );
  if (ok) {
    nuevoDevengado.value = { monto_devengado: null, retencion_isr: null };
    showNuevoDevengado.value = false;
  }
};

const handleSolicitarPago = async () => {
  const ok = await ejecutar(
    () => adquisicionesService.solicitarPago(props.expediente.devengado.id_devengado, nuevaSolicitudPago.value),
    'Solicitud de pago trasladada',
    'No se pudo trasladar la solicitud de pago.'
  );
  if (ok) {
    nuevaSolicitudPago.value = solicitudPagoVacia();
    showNuevaSolicitudPago.value = false;
  }
};

const handleAutorizarPago = async () => {
  const seguro = await confirmar({
    titulo: '¿Autorizar el pago y archivar?',
    texto: 'El expediente quedará como Pagado y Archivado. Esta acción cierra el trámite.',
    confirmar: 'Sí, autorizar y archivar',
  });
  if (!seguro) return;
  await ejecutar(
    () => adquisicionesService.autorizarPago(props.expediente.solicitud_pago.id_solicitud_pago),
    'Pago autorizado y expediente archivado',
    'No se pudo autorizar el pago.'
  );
};
</script>
