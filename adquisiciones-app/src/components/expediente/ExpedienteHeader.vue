<template>
  <div class="px-4 md:px-6 pt-4 md:pt-5 pb-3 flex flex-wrap justify-between items-start gap-3">
    <div class="min-w-0">
      <div class="flex items-center flex-wrap gap-2">
        <h3 class="text-xl font-bold text-gray-800">{{ expediente.codigo_expediente }}</h3>
        <span class="px-2 py-1 rounded-full text-xs font-medium" :class="badgeClass(expediente.estado_color)">
          {{ expediente.estado }}
        </span>
        <TiempoEnEstado :desde="enEstadoDesde" :ahora="expediente.servidor_ahora" :final="!!expediente.es_final"
          :inicio="expediente.fecha_creacion" />
      </div>
      <p class="text-sm text-gray-500 mt-1">
        {{ expediente.objeto_compra }}
        <span class="text-gray-400"> &middot; {{ expediente.unidad_solicitante }} &middot; {{ expediente.usuario_solicitante_nombre }}</span>
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button type="button" @click="verSolicitud" :disabled="abriendoPdf"
        class="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        <Loader2 v-if="abriendoPdf" class="w-4 h-4 animate-spin" />
        <Eye v-else class="w-4 h-4" />
        {{ abriendoPdf ? 'Generando PDF...' : 'Ver solicitud' }}
      </button>
      <slot name="acciones" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Eye, Loader2 } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import { badgeClass } from '../../utils/estados';
import { verArchivo } from '../../utils/archivos';
import { conCarga, notificar } from '../../utils/alertas';
import TiempoEnEstado from './TiempoEnEstado.vue';

// Encabezado compacto del expediente: código, estado, cuánto lleva en él y de qué se trata. El resto
// de los datos está en las pestañas. El botón de acciones lo pone quien usa el componente (slot).
const props = defineProps({
  expediente: { type: Object, required: true },
});

const abriendoPdf = ref(false);

// Desde cuándo está en su estado actual: la última entrada del historial.
const enEstadoDesde = computed(() => props.expediente.historial_estados?.at(-1)?.fecha_entrada || '');

const verSolicitud = async () => {
  if (abriendoPdf.value) return;
  abriendoPdf.value = true;
  try {
    await conCarga('Generando el PDF de la solicitud...', () =>
      verArchivo(async () => {
        const response = await adquisicionesService.descargarSolicitudPdf(props.expediente.id_expediente);
        return new Blob([response.data], { type: 'application/pdf' });
      })
    );
  } catch (err) {
    console.error('Error al generar el PDF de la solicitud', err);
    notificar.error('No se pudo generar el PDF de la solicitud.');
  } finally {
    abriendoPdf.value = false;
  }
};
</script>
