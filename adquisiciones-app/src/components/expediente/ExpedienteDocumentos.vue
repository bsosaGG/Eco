<template>
  <div>
        <ul class="divide-y divide-gray-100">
      <li class="py-3 flex items-center gap-3">
        <FileText class="w-5 h-5 text-red-400 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800">Solicitud de compra</p>
          <p class="text-xs text-gray-400">{{ expediente.codigo_formulario }} &middot; se genera con los datos del expediente</p>
        </div>
        <button type="button" @click="verSolicitud" :disabled="ocupado" class="text-sm text-accent hover:underline disabled:opacity-50">Ver</button>
        <button type="button" @click="descargarSolicitud" :disabled="ocupado" class="text-sm text-accent hover:underline disabled:opacity-50">Descargar</button>
      </li>

      <li v-for="doc in soportes" :key="doc.id_documento" class="py-3 flex items-center gap-3">
        <FileText class="w-5 h-5 text-gray-400 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800">
            {{ tipoDocumentoLabel(doc.tipo_documento) }}<span v-if="doc.numero_documento" class="text-gray-400 font-normal"> &middot; {{ doc.numero_documento }}</span>
          </p>
          <p class="text-xs text-gray-400">Subido por {{ doc.subido_por_nombre }} &middot; {{ formatFechaHora(doc.fecha_carga) }}</p>
        </div>
        <button type="button" @click="ver(doc)" :disabled="ocupado" class="text-sm text-accent hover:underline disabled:opacity-50">Ver</button>
        <button type="button" @click="descargar(doc)" :disabled="ocupado" class="text-sm text-accent hover:underline disabled:opacity-50">Descargar</button>
      </li>
    </ul>

    <p v-if="soportes.length === 0" class="text-sm text-gray-400 italic mt-3">
      Los documentos de soporte (factura, hoja 1-H, egreso de almacén...) aparecen aquí cuando se adjuntan en la etapa de recepción.
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { FileText } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import { formatFechaHora } from '../../utils/format';
import { tipoDocumentoLabel } from '../../utils/documentos';
import { verArchivo, guardarArchivo } from '../../utils/archivos';
import { conCarga, notificar } from '../../utils/alertas';

// Pestaña "Documentos": la solicitud de compra y los documentos de soporte adjuntados al expediente.
const props = defineProps({
  expediente: { type: Object, required: true },
});

const ocupado = ref(false);
const soportes = computed(() => props.expediente.documentos_soporte || []);

const blobSolicitud = async () => {
  const response = await adquisicionesService.descargarSolicitudPdf(props.expediente.id_expediente);
  return new Blob([response.data], { type: 'application/pdf' });
};
const blobSoporte = async (doc) => (await adquisicionesService.descargarDocumentoSoporte(doc.archivo_url)).data;
const nombreSoporte = (doc) => {
  const extension = (doc.archivo_url.match(/\.[A-Za-z0-9]+$/) || [''])[0];
  return `${doc.numero_documento || tipoDocumentoLabel(doc.tipo_documento)}${extension}`;
};

// Un solo proceso a la vez; mientras corre la pantalla muestra un indicador de carga.
const ejecutar = async (accion, mensaje, cargando) => {
  if (ocupado.value) return;
  ocupado.value = true;
  try {
    await conCarga(cargando, accion);
  } catch (err) {
    console.error(err);
    notificar.error(mensaje);
  } finally {
    ocupado.value = false;
  }
};

const verSolicitud = () => ejecutar(() => verArchivo(blobSolicitud), 'No se pudo generar el PDF de la solicitud.', 'Generando el PDF de la solicitud...');
const descargarSolicitud = () =>
  ejecutar(() => guardarArchivo(blobSolicitud, `Solicitud_Compra_${props.expediente.codigo_expediente}.pdf`), 'No se pudo generar el PDF de la solicitud.', 'Generando el PDF de la solicitud...');
const ver = (doc) => ejecutar(() => verArchivo(() => blobSoporte(doc), doc.archivo_url), 'No se pudo abrir el documento.', 'Abriendo el documento...');
const descargar = (doc) => ejecutar(() => guardarArchivo(() => blobSoporte(doc), nombreSoporte(doc)), 'No se pudo descargar el documento.', 'Descargando el documento...');
</script>
