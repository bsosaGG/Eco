<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recepción y Documentos de Soporte</h4>

    <EstadoVacio v-if="!expediente.orden_compra || expediente.orden_compra.estado !== 'Emitida'" :icono="Lock"
      titulo="Falta la Orden de Compra emitida" detalle="La recepción se registra cuando la Orden de Compra ya fue autorizada y emitida." />

    <template v-else>
      <!-- Recepción -->
      <div class="mb-6">
        <div class="flex items-center justify-between gap-3 mb-2">
          <h5 class="text-xs font-semibold text-gray-400 uppercase">Recepción del bien o servicio</h5>
          <button v-if="!expediente.recepcion && canConfirmarRecepcion" type="button" @click="showNuevaRecepcion = true" class="btn-primario">
            <Plus class="w-4 h-4" /> Registrar recepción
          </button>
        </div>

        <div v-if="expediente.recepcion" class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="px-2 py-1 rounded-full text-xs font-medium"
              :class="expediente.recepcion.recibido_conforme ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
              {{ expediente.recepcion.recibido_conforme ? 'Recibido conforme' : 'Recibido con observaciones' }}
            </span>
            <span class="text-xs text-gray-400">{{ formatFechaHora(expediente.recepcion.fecha_hora_recepcion) }}</span>
          </div>
          <p v-if="expediente.recepcion.dictamen_fisico" class="text-sm text-gray-600">{{ expediente.recepcion.dictamen_fisico }}</p>
          <p v-if="expediente.recepcion.observaciones" class="text-sm text-gray-500 italic">{{ expediente.recepcion.observaciones }}</p>
          <p class="text-xs text-gray-400">Recibido por {{ expediente.recepcion.tecnico_receptor_nombre }}</p>
        </div>
        <p v-else-if="!canConfirmarRecepcion" class="text-sm text-gray-400 italic">Todavía no se ha registrado la recepción.</p>
      </div>

      <!-- Documentos de soporte -->
      <div>
        <div class="flex items-center justify-between gap-3 mb-2">
          <h5 class="text-xs font-semibold text-gray-400 uppercase">Documentos de soporte</h5>
          <button v-if="canConformarPago" type="button" @click="showNuevoDocumento = true" class="btn-secundario">
            <Paperclip class="w-4 h-4" /> Adjuntar documento
          </button>
        </div>

        <ul v-if="expediente.documentos_soporte && expediente.documentos_soporte.length" class="space-y-1">
          <li v-for="doc in expediente.documentos_soporte" :key="doc.id_documento"
            class="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
            <div>
              <span class="font-medium text-gray-700">{{ tipoDocumentoLabel(doc.tipo_documento) }}</span>
              <span v-if="doc.numero_documento" class="text-gray-400"> &middot; {{ doc.numero_documento }}</span>
              <p class="text-xs text-gray-400">Subido por {{ doc.subido_por_nombre }}</p>
            </div>
            <button @click="handleVerDocumento(doc)" class="text-accent hover:underline text-xs">Ver</button>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-400 italic">Sin documentos adjuntados todavía.</p>
      </div>

      <div v-if="expediente.estado === 'Expediente en Conformación' && canConformarPago" class="mt-6 pt-4 border-t border-gray-100">
        <button @click="handleTrasladarAContabilidad" :disabled="loading || !puedeTrasladarAContabilidad" class="btn-acento">
          <Send class="w-4 h-4" /> Trasladar a Contabilidad
        </button>
        <p v-if="!puedeTrasladarAContabilidad" class="text-xs text-gray-400 mt-2">
          Se requiere una recepción conforme y al menos un documento de soporte.
        </p>
      </div>
    </template>

    <!-- Registrar la recepción -->
    <ModalBase v-model="showNuevaRecepcion" titulo="Registrar recepción" :subtitulo="`Expediente ${expediente.codigo_expediente}`">
      <div class="space-y-4">
        <div>
          <label class="etiqueta">Resultado de la recepción</label>
          <select v-model="nuevaRecepcion.recibido_conforme" class="campo">
            <option :value="true">Recibido conforme</option>
            <option :value="false">Recibido con observaciones</option>
          </select>
        </div>
        <div>
          <label class="etiqueta">Dictamen físico</label>
          <input v-model="nuevaRecepcion.dictamen_fisico" type="text" class="campo" />
        </div>
        <div>
          <label class="etiqueta">Observaciones</label>
          <textarea v-model="nuevaRecepcion.observaciones" rows="3" class="campo"></textarea>
        </div>
      </div>
      <template #footer>
        <button type="button" @click="showNuevaRecepcion = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleRegistrarRecepcion" :disabled="loading" class="btn-primario">
          {{ loading ? 'Guardando...' : 'Guardar recepción' }}
        </button>
      </template>
    </ModalBase>

    <!-- Adjuntar un documento de soporte -->
    <ModalBase v-model="showNuevoDocumento" titulo="Adjuntar documento" :subtitulo="`Expediente ${expediente.codigo_expediente}`">
      <div class="space-y-4">
        <div>
          <label class="etiqueta">Tipo de documento *</label>
          <select v-model="nuevoDocumento.tipo_documento" class="campo">
            <option value="" disabled>Seleccione el tipo</option>
            <option v-for="(etiqueta, valor) in TIPOS_DOCUMENTO" :key="valor" :value="valor">{{ etiqueta }}</option>
          </select>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="etiqueta">Número de documento</label>
            <input v-model="nuevoDocumento.numero_documento" type="text" class="campo" />
          </div>
          <div>
            <label class="etiqueta">Fecha del documento</label>
            <input v-model="nuevoDocumento.fecha_documento" type="date" class="campo" />
          </div>
        </div>
        <div>
          <label class="etiqueta">Archivo *</label>
          <input ref="fileInputRef" type="file" @change="handleFileChange" class="w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
        </div>
      </div>
      <template #footer>
        <button type="button" @click="showNuevoDocumento = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleAdjuntarDocumento" :disabled="loading || !nuevoDocumento.tipo_documento || !archivoSeleccionado" class="btn-primario">
          {{ loading ? 'Subiendo...' : 'Adjuntar' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Plus, Lock, Paperclip, Send } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';
import ModalBase from '../common/ModalBase.vue';
import EstadoVacio from '../common/EstadoVacio.vue';
import { formatFechaHora } from '../../utils/format';
import { tipoDocumentoLabel, TIPOS_DOCUMENTO } from '../../utils/documentos';
import { verArchivo } from '../../utils/archivos';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';
import { confirmar, conCarga, notificar } from '../../utils/alertas';

const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const loading = ref(false);
const canConfirmarRecepcion = authService.hasPermission(PERMISOS.CONFIRMAR_RECEPCION);
const canConformarPago = authService.hasPermission(PERMISOS.CONFORMAR_PAGO);
const showNuevaRecepcion = ref(false);
const nuevaRecepcion = ref({ recibido_conforme: true, dictamen_fisico: '', observaciones: '' });
const showNuevoDocumento = ref(false);
const nuevoDocumento = ref({ tipo_documento: '', numero_documento: '', fecha_documento: '' });
const archivoSeleccionado = ref(null);
const fileInputRef = ref(null);
const puedeTrasladarAContabilidad = computed(
  () => !!(props.expediente?.recepcion?.recibido_conforme && props.expediente?.documentos_soporte?.length)
);

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

const handleRegistrarRecepcion = async () => {
  const ok = await ejecutar(
    () => adquisicionesService.registrarRecepcion(props.expediente.orden_compra.id_orden_compra, nuevaRecepcion.value),
    'Recepción registrada',
    'No se pudo registrar la recepción.'
  );
  if (ok) {
    nuevaRecepcion.value = { recibido_conforme: true, dictamen_fisico: '', observaciones: '' };
    showNuevaRecepcion.value = false;
  }
};

const handleFileChange = (e) => {
  archivoSeleccionado.value = e.target.files[0] || null;
};

const handleAdjuntarDocumento = async () => {
  if (!archivoSeleccionado.value) return;
  const formData = new FormData();
  formData.append('archivo', archivoSeleccionado.value);
  formData.append('tipo_documento', nuevoDocumento.value.tipo_documento);
  if (nuevoDocumento.value.numero_documento) formData.append('numero_documento', nuevoDocumento.value.numero_documento);
  if (nuevoDocumento.value.fecha_documento) formData.append('fecha_documento', nuevoDocumento.value.fecha_documento);

  const ok = await ejecutar(
    () => conCarga('Subiendo el documento...', () => adquisicionesService.adjuntarDocumentoSoporte(props.expediente.id_expediente, formData)),
    'Documento adjuntado',
    'No se pudo adjuntar el documento.'
  );
  if (ok) {
    nuevoDocumento.value = { tipo_documento: '', numero_documento: '', fecha_documento: '' };
    archivoSeleccionado.value = null;
    if (fileInputRef.value) fileInputRef.value.value = '';
    showNuevoDocumento.value = false;
  }
};

const handleTrasladarAContabilidad = async () => {
  const seguro = await confirmar({
    titulo: '¿Trasladar a Contabilidad?',
    texto: 'El expediente pasará a la fase financiera (compromiso, devengado y pago).',
    confirmar: 'Sí, trasladar',
  });
  if (!seguro) return;
  await ejecutar(
    () => adquisicionesService.trasladarAContabilidad(props.expediente.id_expediente),
    'Expediente trasladado a Contabilidad',
    'No se pudo trasladar el expediente a Contabilidad.'
  );
};

const handleVerDocumento = async (doc) => {
  try {
    await conCarga('Abriendo el documento...', () =>
      verArchivo(async () => (await adquisicionesService.descargarDocumentoSoporte(doc.archivo_url)).data, doc.archivo_url)
    );
  } catch (err) {
    console.error(err);
    notificar.error('No se pudo abrir el documento.');
  }
};
</script>
