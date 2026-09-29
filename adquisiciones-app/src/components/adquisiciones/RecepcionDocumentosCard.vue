<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recepción y Documentos de Soporte</h4>

    <p v-if="!expediente.orden_compra || expediente.orden_compra.estado !== 'Emitida'" class="text-sm text-gray-400 italic">
      Se requiere una Orden de Compra emitida antes de registrar la recepción.
    </p>

    <template v-else>
      <!-- Recepción -->
      <div class="mb-5">
        <h5 class="text-xs font-semibold text-gray-400 uppercase mb-2">Recepción del bien/servicio</h5>

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

        <div v-else-if="canConfirmarRecepcion">
          <button @click="showNuevaRecepcion = !showNuevaRecepcion" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
            <Plus class="w-4 h-4" /> Registrar recepción
          </button>
          <div v-if="showNuevaRecepcion" class="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div v-if="recepcionError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ recepcionError }}</div>
            <select v-model="nuevaRecepcion.recibido_conforme" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option :value="true">Recibido conforme</option>
              <option :value="false">Recibido con observaciones</option>
            </select>
            <input v-model="nuevaRecepcion.dictamen_fisico" type="text" placeholder="Dictamen físico"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            <textarea v-model="nuevaRecepcion.observaciones" rows="2" placeholder="Observaciones"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"></textarea>
            <button @click="handleRegistrarRecepcion" :disabled="loading"
              class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
              Guardar recepción
            </button>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 italic">Todavía no se ha registrado la recepción.</p>
      </div>

      <!-- Documentos de soporte -->
      <div>
        <h5 class="text-xs font-semibold text-gray-400 uppercase mb-2">Documentos de soporte</h5>

        <ul v-if="expediente.documentos_soporte && expediente.documentos_soporte.length" class="space-y-1 mb-3">
          <li v-for="doc in expediente.documentos_soporte" :key="doc.id_documento"
            class="flex items-center justify-between text-sm border border-gray-100 rounded px-2 py-1.5">
            <div>
              <span class="font-medium text-gray-700">{{ tipoDocumentoLabel(doc.tipo_documento) }}</span>
              <span v-if="doc.numero_documento" class="text-gray-400"> &middot; {{ doc.numero_documento }}</span>
              <p class="text-xs text-gray-400">Subido por {{ doc.subido_por_nombre }}</p>
            </div>
            <button @click="handleDescargarDocumento(doc)" class="text-accent hover:underline text-xs">Ver</button>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-400 italic mb-3">Sin documentos adjuntados todavía.</p>

        <div v-if="canConformarPago">
          <button @click="showNuevoDocumento = !showNuevoDocumento" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
            <Plus class="w-4 h-4" /> Adjuntar documento
          </button>
          <div v-if="showNuevoDocumento" class="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div v-if="documentoError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ documentoError }}</div>
            <select v-model="nuevoDocumento.tipo_documento" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option value="" disabled>Tipo de documento</option>
              <option value="FACTURA">Factura</option>
              <option value="HOJA_1H_INGRESO">Hoja 1-H de ingreso</option>
              <option value="EGRESO_ALMACEN">Egreso de almacén</option>
              <option value="CERTIFICADO_SATISFACCION">Certificado de satisfacción</option>
              <option value="OTRO">Otro</option>
            </select>
            <input v-model="nuevoDocumento.numero_documento" type="text" placeholder="Número de documento (opcional)"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            <input v-model="nuevoDocumento.fecha_documento" type="date"
              class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            <input ref="fileInputRef" type="file" @change="handleFileChange" class="w-full text-sm" />
            <button @click="handleAdjuntarDocumento"
              :disabled="loading || !nuevoDocumento.tipo_documento || !archivoSeleccionado"
              class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
              Adjuntar
            </button>
          </div>
        </div>
      </div>

      <button v-if="expediente.estado === 'Expediente en Conformación' && canConformarPago"
        @click="handleTrasladarAContabilidad" :disabled="loading || !puedeTrasladarAContabilidad"
        class="w-full mt-4 bg-accent text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 disabled:opacity-50">
        Trasladar a Contabilidad
      </button>
      <p v-if="expediente.estado === 'Expediente en Conformación' && canConformarPago && !puedeTrasladarAContabilidad"
        class="text-xs text-gray-400 mt-1">
        Se requiere una recepción conforme y al menos un documento de soporte.
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Plus } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';

const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const loading = ref(false);
const canConfirmarRecepcion = authService.hasPermission('adquisiciones:confirmar-recepcion');
const canConformarPago = authService.hasPermission('adquisiciones:conformar-pago');
const showNuevaRecepcion = ref(false);
const recepcionError = ref('');
const nuevaRecepcion = ref({ recibido_conforme: true, dictamen_fisico: '', observaciones: '' });
const showNuevoDocumento = ref(false);
const documentoError = ref('');
const nuevoDocumento = ref({ tipo_documento: '', numero_documento: '', fecha_documento: '' });
const archivoSeleccionado = ref(null);
const fileInputRef = ref(null);
const puedeTrasladarAContabilidad = computed(
  () => !!(props.expediente?.recepcion?.recibido_conforme && props.expediente?.documentos_soporte?.length)
);

const formatFechaHora = (f) => (f ? new Date(f).toLocaleString('es-GT') : '—');
const tipoDocumentoLabel = (tipo) =>
  ({
    FACTURA: 'Factura',
    HOJA_1H_INGRESO: 'Hoja 1-H de ingreso',
    EGRESO_ALMACEN: 'Egreso de almacén',
    CERTIFICADO_SATISFACCION: 'Certificado de satisfacción',
    OTRO: 'Otro',
  })[tipo] || tipo;

const handleRegistrarRecepcion = async () => {
  loading.value = true;
  recepcionError.value = '';
  try {
    await adquisicionesService.registrarRecepcion(props.expediente.orden_compra.id_orden_compra, nuevaRecepcion.value);
    nuevaRecepcion.value = { recibido_conforme: true, dictamen_fisico: '', observaciones: '' };
    showNuevaRecepcion.value = false;
    emit('updated');
  } catch (err) {
    console.error(err);
    recepcionError.value = err.response?.data?.message || 'No se pudo registrar la recepción.';
  } finally {
    loading.value = false;
  }
};

const handleFileChange = (e) => {
  archivoSeleccionado.value = e.target.files[0] || null;
};

const handleAdjuntarDocumento = async () => {
  if (!archivoSeleccionado.value) return;
  loading.value = true;
  documentoError.value = '';
  try {
    const formData = new FormData();
    formData.append('archivo', archivoSeleccionado.value);
    formData.append('tipo_documento', nuevoDocumento.value.tipo_documento);
    if (nuevoDocumento.value.numero_documento) formData.append('numero_documento', nuevoDocumento.value.numero_documento);
    if (nuevoDocumento.value.fecha_documento) formData.append('fecha_documento', nuevoDocumento.value.fecha_documento);
    await adquisicionesService.adjuntarDocumentoSoporte(props.expediente.id_expediente, formData);
    nuevoDocumento.value = { tipo_documento: '', numero_documento: '', fecha_documento: '' };
    archivoSeleccionado.value = null;
    if (fileInputRef.value) fileInputRef.value.value = '';
    showNuevoDocumento.value = false;
    emit('updated');
  } catch (err) {
    console.error(err);
    documentoError.value = err.response?.data?.message || 'No se pudo adjuntar el documento.';
  } finally {
    loading.value = false;
  }
};

const handleTrasladarAContabilidad = async () => {
  loading.value = true;
  try {
    await adquisicionesService.trasladarAContabilidad(props.expediente.id_expediente);
    emit('updated');
  } catch (err) {
    console.error(err);
    documentoError.value = err.response?.data?.message || 'No se pudo trasladar el expediente a Contabilidad.';
  } finally {
    loading.value = false;
  }
};

const handleDescargarDocumento = async (doc) => {
  try {
    const response = await adquisicionesService.descargarDocumentoSoporte(doc.archivo_url);
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.numero_documento || doc.archivo_url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    documentoError.value = 'No se pudo descargar el documento.';
  }
};
</script>
