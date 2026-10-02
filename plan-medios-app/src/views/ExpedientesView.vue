<template>
  <div class="pm pm-page">
    <header class="pm-header">
      <h1>Expedientes existentes</h1>
      <p>Busque por identificador, campaña, estado o nombre del brief. Deje el campo vacío para ver los más recientes.</p>
      <p v-if="canCreate" class="pm-header-links">
        <router-link :to="{ name: 'ExpedienteCreate' }">+ Crear un expediente nuevo</router-link>
      </p>
    </header>

    <section class="card">
      <AlertMessage type="error" :text="error" />

      <form class="search-form" @submit.prevent="load">
        <input v-model="query" type="text" aria-label="Buscar expedientes"
          placeholder="Ej. 20260828, campaña de vacunación, plan_medios_generado..." />
        <button type="submit">Buscar</button>
      </form>

      <p v-if="expedientes.length" class="count-note">
        {{ expedientes.length }} {{ pluralize(expedientes.length, 'expediente encontrado', 'expedientes encontrados') }}.
      </p>

      <p v-if="loading" class="empty-state">Cargando expedientes...</p>

      <table v-else-if="expedientes.length">
        <thead>
          <tr>
            <th>Expediente</th>
            <th>Campaña</th>
            <th>Estado</th>
            <th>Medios</th>
            <th>Creado por</th>
            <th>Creado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in expedientes" :key="e.expediente_id">
            <td>
              <router-link class="expediente-link" :to="{ name: 'ExpedienteDetail', params: { id: e.expediente_id } }">
                {{ e.expediente_id }}
              </router-link>
            </td>
            <td>{{ e.campaign || '—' }}</td>
            <td><StatusPill :status="e.status" /></td>
            <td>{{ e.media_count }}</td>
            <td>{{ e.created_by || '—' }}</td>
            <td>{{ shortDateTime(e.created_at) }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="empty-state">
        <template v-if="searched">No se encontraron expedientes que coincidan con "{{ searched }}".</template>
        <template v-else>Todavía no hay expedientes registrados.</template>
      </p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import AlertMessage from '../components/common/AlertMessage.vue';
import StatusPill from '../components/common/StatusPill.vue';
import service from '../services/planMedios.service';
import { errorMessage } from '../services/api';
import authService from '../services/auth.service';
import { pluralize, shortDateTime } from '../utils/format';

const canCreate = authService.hasPermission('plan-medios:create');

const query = ref('');
const searched = ref('');
const expedientes = ref([]);
const loading = ref(false);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    expedientes.value = await service.listExpedientes(query.value.trim());
    searched.value = query.value.trim();
  } catch (e) {
    expedientes.value = [];
    error.value = errorMessage(e, 'No fue posible cargar los expedientes.');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
