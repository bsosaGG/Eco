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
            <select class="form-group__control" v-model="selectedUnitId" @change="handleUnitFilter" :disabled="isCustomFile">
              <option value="ALL">🏢 Mostrar Toda la Institución (Todas las Unidades)</option>
              <option v-for="u in flatUnits" :key="u.id" :value="u.id">
                {{ u.codigo }} - {{ u.nombre }} ({{ u.total_personal }} colaboradores)
              </option>
            </select>
          </div>

          <!-- CARGA DE ARCHIVO CONFIGURABLE -->
          <div class="form-group mb-0 d-flex flex-column" style="min-width: 300px;">
            <label class="form-group__label">Cargar desde Archivo (CSV):</label>
            <div class="d-flex align-center gap-2">
              <input type="file" accept=".csv,.txt" class="form-group__control" @change="handleFileUpload" ref="fileInput" />
              <button v-if="isCustomFile" class="btn btn--secondary btn--sm" @click="resetToDatabase" title="Volver a Base de Datos">
                ✕
              </button>
            </div>
            <span class="text-xs text-muted mt-1">Formato: cod empleado, nombre empleado, cod jefe, nombre jefe</span>
          </div>

          <div class="d-flex gap-2 align-center">
            <span class="badge badge--info">{{ totalUnidades }} Unidades</span>
            <span class="badge badge--success">{{ totalPersonalTotal }} Colaboradores</span>
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
const isCustomFile = ref(false);
const fileInput = ref(null);

const totalUnidades = computed(() => isCustomFile.value ? treeData.value.length : flatUnits.value.length);
const totalPersonalTotal = computed(() => {
  if (isCustomFile.value) {
    let total = 0;
    const countColabs = (node) => {
      total += (node.jefes ? node.jefes.length : 0) + (node.subordinados ? node.subordinados.length : 0);
      if (node.subunidades) node.subunidades.forEach(countColabs);
    };
    treeData.value.forEach(countColabs);
    return total;
  }
  return flatUnits.value.reduce((acc, u) => acc + (u.total_personal || 0), 0);
});

const loadOrganigram = async (unitId = 'ALL') => {
  if (isCustomFile.value) return;
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
  if (!isCustomFile.value) {
    router.push(`/collaborators/${personaId}`);
  }
};

const imprimirOrganigrama = () => {
  window.print();
};

const resetToDatabase = () => {
  isCustomFile.value = false;
  if (fileInput.value) fileInput.value.value = '';
  loadOrganigram(selectedUnitId.value);
};

const parseCSVToTree = (csvText) => {
  const lines = csvText.split('\n').filter(l => l.trim() !== '');
  const records = [];
  
  let startIdx = 0;
  if (lines.length > 0 && (lines[0].toLowerCase().includes('empleado') || lines[0].toLowerCase().includes('cod'))) {
    startIdx = 1;
  }
  
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map(s => s.trim());
    if (cols.length >= 4) {
      records.push({
        cod_empleado: cols[0],
        nombre_empleado: cols[1],
        cod_jefe: cols[2],
        nombre_jefe: cols[3]
      });
    }
  }

  const personMap = {};
  
  records.forEach(r => {
    if (!personMap[r.cod_empleado]) {
      personMap[r.cod_empleado] = { id: r.cod_empleado, name: r.nombre_empleado, reports: [], jefe: r.cod_jefe };
    } else {
      personMap[r.cod_empleado].name = r.nombre_empleado;
      personMap[r.cod_empleado].jefe = r.cod_jefe;
    }
    
    if (r.cod_jefe) {
      if (!personMap[r.cod_jefe]) {
        personMap[r.cod_jefe] = { id: r.cod_jefe, name: r.nombre_jefe, reports: [], jefe: null };
      }
      personMap[r.cod_jefe].reports.push(r.cod_empleado);
    }
  });

  const roots = [];
  Object.values(personMap).forEach(p => {
    if (!p.jefe || !personMap[p.jefe]) {
      roots.push(p.id);
    }
  });

  const buildNode = (personId) => {
    const p = personMap[personId];
    
    const node = {
      id: `nodo-${p.id}`,
      codigo: `JEFE-${p.id}`,
      nombre: `Equipo de ${p.name}`,
      colaboradores: [], 
      jefes: [
        {
          persona_id: p.id,
          primer_nombre: p.name.split(' ')[0] || '',
          primer_apellido: p.name.split(' ').slice(1).join(' ') || '',
          puesto_funcional: 'Líder / Jefe',
          renglon_codigo: '-',
          cui_dpi: p.id
        }
      ],
      subordinados: [],
      subunidades: []
    };
    
    p.reports.forEach(repId => {
      const rep = personMap[repId];
      if (rep.reports.length > 0) {
        const subNode = buildNode(repId);
        subNode.padre_nombre = p.name;
        node.subunidades.push(subNode);
        node.colaboradores.push({}); 
      } else {
        node.subordinados.push({
          persona_id: rep.id,
          primer_nombre: rep.name.split(' ')[0] || '',
          primer_apellido: rep.name.split(' ').slice(1).join(' ') || '',
          puesto_funcional: 'Colaborador',
          renglon_codigo: '-',
          cui_dpi: rep.id
        });
        node.colaboradores.push({}); 
      }
    });
    
    return node;
  };

  treeData.value = roots.map(rootId => buildNode(rootId));
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) {
    resetToDatabase();
    return;
  }

  isCustomFile.value = true;
  loading.value = true;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      parseCSVToTree(e.target.result);
    } catch (err) {
      console.error("Error procesando CSV:", err);
      alert("Error procesando el archivo CSV. Asegúrate que tenga el formato correcto.");
      resetToDatabase();
    } finally {
      loading.value = false;
    }
  };
  reader.readAsText(file);
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
