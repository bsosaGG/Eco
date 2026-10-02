<template>
  <div>
    <p class="stage-intro">
      <strong>Etapa 4 — Solicitudes de Compra.</strong>
      Prepare y genere los documentos de contratación a partir de los perfiles ya seleccionados. Los datos internos de
      proveedor y scoring no forman parte del documento público.
    </p>

    <section v-if="entries.length" class="purchase-requests">
      <h3 class="section-heading">7. Solicitudes de Compra</h3>
      <p class="help">
        El sistema describe la necesidad de contratación sin identificar al medio o proveedor seleccionado. La
        justificación base se genera de forma determinista y puede revisarse antes de generar el Excel.
      </p>
      <div class="purchase-request-list">
        <PurchaseRequestCard v-for="(entry, index) in entries" :key="`${store.meta.version}-${entry.uid}`"
          :index="index" :entry="entry" />
      </div>
    </section>

    <div v-else class="stage-empty">
      Todavía no hay medios seleccionados para preparar Solicitudes de Compra. Complete primero la Etapa 3 y guarde los
      cambios.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import PurchaseRequestCard from './PurchaseRequestCard.vue';
import { useExpedienteStore } from '../../stores/expediente.store';
import { hasContent } from '../../utils/mediaEntries';

const store = useExpedienteStore();
// Mismos medios (y en el mismo orden) que el servidor guardó: solo los que tienen contenido.
const entries = computed(() => store.mediaEntries.filter(hasContent));
</script>
