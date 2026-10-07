<template>
  <div class="space-y-6">
    <dl class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
      <div v-for="dato in datos" :key="dato.etiqueta">
        <dt class="text-xs text-gray-400">{{ dato.etiqueta }}</dt>
        <dd class="text-gray-800 font-medium">{{ dato.valor || '—' }}</dd>
      </div>
    </dl>

    <div>
      <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Justificación</h4>
      <TextoExpandible :texto="expediente.justificacion || ''" />
    </div>

    <div v-if="expediente.tiene_anexo" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-if="expediente.anexo_caracteristicas_tecnicas">
        <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Anexo: características técnicas</h4>
        <TextoExpandible :texto="expediente.anexo_caracteristicas_tecnicas" />
      </div>
      <div v-if="expediente.anexo_especificaciones_especiales">
        <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Anexo: especificaciones especiales</h4>
        <TextoExpandible :texto="expediente.anexo_especificaciones_especiales" />
      </div>
    </div>

    <ExpedienteItemsCard :expediente="expediente" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import TextoExpandible from '../common/TextoExpandible.vue';
import ExpedienteItemsCard from './ExpedienteItemsCard.vue';
import { formatMonto, formatFecha } from '../../utils/format';

// Pestaña "Resumen": los datos clave del expediente, su justificación y los renglones solicitados.
const props = defineProps({
  expediente: { type: Object, required: true },
});

const datos = computed(() => {
  const e = props.expediente;
  return [
    { etiqueta: 'Solicitante', valor: e.usuario_solicitante_nombre },
    { etiqueta: 'Unidad solicitante', valor: e.unidad_solicitante },
    { etiqueta: 'Tipo de compra', valor: e.tipo_compra },
    { etiqueta: 'Monto estimado', valor: e.monto_estimado == null ? '' : formatMonto(e.monto_estimado) },
    { etiqueta: 'Funcionario responsable', valor: e.funcionario_responsable },
    { etiqueta: 'Responsable actual', valor: e.responsable_actual_nombre },
    {
      etiqueta: 'Segunda firma',
      valor: e.firma2_usuario_nombre ? `${e.firma2_usuario_nombre}${e.firma2_cargo ? ` (${e.firma2_cargo})` : ''}` : '',
    },
    { etiqueta: 'Fecha de solicitud', valor: formatFecha(e.fecha_creacion) },
    { etiqueta: 'Modalidad', valor: e.modalidad },
    { etiqueta: 'Formulario', valor: e.codigo_formulario },
  ];
});
</script>
