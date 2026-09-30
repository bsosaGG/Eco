<template>
  <div class="organigram-view">
    <!-- Encabezado Adaptativo -->
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <div class="d-flex align-center gap-2">
            <h2 class="font-heading m-0">Organigramas & Estructura Ocupacional por Unidad</h2>
            <span class="badge badge--warning">🟡 En Desarrollo / Beta</span>
          </div>
          <p class="text-muted text-sm mt-1">
            Visualización jerárquica por unidad administrativa y personal asignado (SCSPR).
          </p>
        </div>

        <div class="adaptive-bar__actions">
          <button class="btn btn--secondary mr-2" @click="toggleExpandAll">
            {{ allExpanded ? '📁 Colapsar Nodos' : '📂 Desplegar Todo' }}
          </button>
          <button class="btn btn--primary" @click="imprimirOrganigrama">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect width="12" height="8" x="6" y="14"></rect>
            </svg>
            Imprimir Plantilla
          </button>
        </div>
      </div>
    </div>

    <!-- Buscador y Selector de Unidad -->
    <div class="card mb-4">
      <div class="card__body">
        <div class="d-flex align-center justify-between flex-wrap gap-3">
          <div class="form-group mb-0 flex-1" style="min-width: 260px;">
            <label class="form-group__label">Filtrar por Unidad Administrativa:</label>
            <select class="form-group__control" v-model="selectedUnitId" @change="handleUnitFilter">
              <option value="ALL">🏢 Mostrar Toda la Institución (Todas las Unidades)</option>
              <option v-for="u in flatUnits" :key="u.id" :value="u.id">
                {{ u.codigo }} - {{ u.nombre }} ({{ u.total_personal }} colaboradores)
              </option>
            </select>
          </div>

          <div class="d-flex gap-2 align-center">
            <span class="badge badge--info">{{ totalUnidades }} Unidades</span>
            <span class="badge badge--success">{{ totalPersonalTotal }} Colaboradores Asignados</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="loading" class="card text-center p-5 text-muted">
      Cargando estructura de organigramas...
    </div>

    <!-- Estado Vacío (Empty State) -->
    <div v-else-if="!treeData.length" class="card text-center p-5 text-muted">
      🏢 No se encontraron unidades administrativas o relaciones laborales registradas para la selección.
    </div>

    <!-- ÁRBOL JERÁRQUICO INTERACTIVO -->
    <div v-else class="organigram-tree">
      <div v-for="node in treeData" :key="node.id" class="tree-root mb-4">
        <OrganigramNode
          :node="node"
          :all-expanded="allExpanded"
          @select-colaborador="verColaborador"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../api/client';
import OrganigramNode from '../components/organigram-node.vue';

const router = useRouter();
const loading = ref(false);
const treeData = ref([]);
const flatUnits = ref([]);
const selectedUnitId = ref('ALL');
const allExpanded = ref(true);

const totalUnidades = computed(() => flatUnits.value.length);
const totalPersonalTotal = computed(() => {
  return flatUnits.value.reduce((acc, u) => acc + (u.total_personal || 0), 0);
});

const loadOrganigram = async (unitId = 'ALL') => {
  loading.value = true;
  try {
    const url = unitId !== 'ALL' ? `/catalogs/organigram?unitId=${unitId}` : '/catalogs/organigram';
    const res = await apiClient.get(url);
    if (res.data.success) {
      treeData.value = res.data.data || [];
      if (unitId === 'ALL') {
        flatUnits.value = res.data.flat || [];
      }
    }
  } catch (err) {
    console.error('Error al cargar organigramas:', err);
  } finally {
    loading.value = false;
  }
};

const handleUnitFilter = () => {
  loadOrganigram(selectedUnitId.value);
};

const toggleExpandAll = () => {
  allExpanded.value = !allExpanded.value;
};

const verColaborador = (personaId) => {
  router.push(`/collaborators/${personaId}`);
};

const imprimirOrganigrama = () => {
  window.print();
};

onMounted(() => {
  loadOrganigram();
});
</script>

<style scoped>
.organigram-tree {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media print {
  .adaptive-bar__actions,
  .form-group,
  .badge,
  .glass-panel,
  .card-header {
    display: none !important;
  }
  .organigram-view {
    padding: 0 !important;
    background: #ffffff !important;
  }
  .tree-root {
    page-break-inside: avoid;
  }
}
</style>
