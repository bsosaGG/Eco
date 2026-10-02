<template>
  <div class="pm pm-page">
    <header class="pm-header">
      <h1>Auditoría de selecciones</h1>
      <p>
        Expediente <strong>{{ id }}</strong><template v-if="campaign"> — {{ campaign }}</template>.
        Registro inmutable de cada selección y remoción de medios en este expediente, más reciente primero. Ningún
        movimiento se sobrescribe.
      </p>
      <p class="pm-header-links">
        <router-link :to="{ name: 'ExpedienteDetail', params: { id } }">← Volver al expediente</router-link>
        &nbsp;·&nbsp;
        <router-link :to="{ name: 'Expedientes' }">Ver expedientes existentes →</router-link>
      </p>
    </header>

    <section class="card">
      <AlertMessage type="error" :text="error" />

      <p v-if="loading" class="empty-state">Cargando auditoría...</p>

      <template v-else-if="events.length">
        <p class="count-note">
          {{ events.length }} {{ pluralize(events.length, 'evento registrado', 'eventos registrados') }}.
        </p>

        <ul class="timeline">
          <li v-for="event in events" :key="event.id" class="event" :class="event.event_type">
            <div class="event-head">
              <span class="event-type" :class="event.event_type">
                {{ AUDIT_EVENT_LABELS[event.event_type] || event.event_type }}
              </span>
              <span class="event-medium">{{ event.catalog_media_name || event.medium_name || '—' }}</span>
              <span v-if="event.matched_top_recommendation" class="badge-top">1ra opción del ranking</span>
              <span class="event-time">{{ shortDateTime(event.occurred_at, true) }}</span>
            </div>

            <div class="event-meta">
              <span class="label">Analista:</span> {{ event.analyst_name || event.analyst_email || '—' }}
              <template v-if="event.provider_legal_name">
                &nbsp;·&nbsp;<span class="label">Proveedor:</span> {{ event.provider_legal_name }}
              </template>
              <template v-if="event.scoring_position">
                &nbsp;·&nbsp;<span class="label">Posición en ranking:</span> {{ event.scoring_position }}
              </template>
              <template v-if="event.scoring_score !== null && event.scoring_score !== undefined">
                &nbsp;·&nbsp;<span class="label">Score:</span> {{ event.scoring_score }}
              </template>
              <template v-if="event.scoring_confidence">
                &nbsp;·&nbsp;<span class="label">Confianza:</span> {{ event.scoring_confidence }}
              </template>
              <template v-if="event.selection_source">
                &nbsp;·&nbsp;<span class="label">Origen:</span>
                {{ event.selection_source === 'catalog_scoring' ? 'Motor de scoring' : 'Manual' }}
              </template>
            </div>

            <div v-if="event.selection_justification" class="justification-box">{{ event.selection_justification }}</div>

            <div v-if="event.previous" class="previous-box">
              Antes de este movimiento: {{ event.previous.catalog_media_name || event.previous.medium || '—' }}
              <template v-if="event.previous.scoring_position">(posición {{ event.previous.scoring_position }})</template>
            </div>
          </li>
        </ul>
      </template>

      <p v-else-if="!error" class="empty-state">Todavía no hay eventos de selección registrados para este expediente.</p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AlertMessage from '../components/common/AlertMessage.vue';
import service from '../services/planMedios.service';
import { errorMessage } from '../services/api';
import { AUDIT_EVENT_LABELS } from '../utils/constants';
import { pluralize, shortDateTime } from '../utils/format';

const route = useRoute();
const id = route.params.id;
const events = ref([]);
const campaign = ref('');
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const result = await service.getAuditoria(id);
    events.value = result.events;
    campaign.value = result.campaign;
  } catch (e) {
    error.value = errorMessage(e, 'No fue posible cargar la auditoría.');
  } finally {
    loading.value = false;
  }
});
</script>
