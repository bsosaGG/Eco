<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-wrap justify-between items-start gap-4">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h3 class="text-xl font-bold text-gray-800">{{ expediente.codigo_expediente }}</h3>
        <span class="px-2 py-1 rounded-full text-xs font-medium" :class="badgeClass(expediente.estado_color)">
          {{ expediente.estado }}
        </span>
        <TiempoEnEstado :desde="enEstadoDesde" :ahora="expediente.servidor_ahora" :final="!!expediente.es_final"
          :inicio="expediente.fecha_creacion" />
      </div>
      <p class="text-gray-600">{{ expediente.objeto_compra }}</p>
      <p class="text-sm text-gray-400 mt-1">
        {{ expediente.unidad_solicitante }} &middot; Solicitado por {{ expediente.usuario_solicitante_nombre }}
        <span v-if="expediente.firma2_usuario_nombre"> &middot; Firma 2: {{ expediente.firma2_usuario_nombre }}<template v-if="expediente.firma2_cargo"> — {{ expediente.firma2_cargo }}</template></span>
      </p>
      <p class="text-xs text-gray-400 mt-1 font-mono">
        {{ expediente.codigo_formulario }}<span v-if="expediente.tipo_compra"> &middot; {{ expediente.tipo_compra }}</span>
      </p>
    </div>
    <div class="text-right text-sm text-gray-500">
      <p>Monto estimado</p>
      <p class="text-xl font-semibold text-gray-800">{{ formatMonto(expediente.monto_estimado) }}</p>
      <button type="button" @click="descargarPdf" :disabled="descargandoPdf"
        class="mt-2 inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        <FileDown class="w-4 h-4" />
        {{ descargandoPdf ? 'Generando PDF...' : 'Descargar Solicitud (PDF)' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { FileDown } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import { formatMonto } from '../../utils/format';
import { badgeClass } from '../../utils/estados';
import TiempoEnEstado from './TiempoEnEstado.vue';

const props = defineProps({
  expediente: { type: Object, required: true },
});

const descargandoPdf = ref(false);

// Desde cuándo está en su estado actual: la última entrada del historial.
const enEstadoDesde = computed(() => props.expediente.historial_estados?.at(-1)?.fecha_entrada || '');

const descargarPdf = async () => {
  if (descargandoPdf.value) return;
  descargandoPdf.value = true;
  try {
    const response = await adquisicionesService.descargarSolicitudPdf(props.expediente.id_expediente);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Solicitud_Compra_${props.expediente.codigo_expediente}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error al descargar el PDF de la solicitud', err);
    alert('No se pudo generar el PDF de la solicitud.');
  } finally {
    descargandoPdf.value = false;
  }
};
</script>
