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

          <!-- CARGA DE ARCHIVO CONFIGURABLE CON DROPZONE -->
          <div class="form-group mb-0 flex-1" style="min-width: 320px;">
            <div 
              class="dropzone" 
              :class="{ 'dropzone--active': isDragging, 'dropzone--loaded': isCustomFile }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input type="file" accept=".csv,.txt" class="hidden-input" @change="handleFileUpload" ref="fileInput" />
              
              <div v-if="!isCustomFile" class="dropzone__content text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-2 text-primary" style="opacity: 0.8">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <div class="text-sm font-bold text-main">Haz clic o arrastra un archivo CSV</div>
                <div class="text-xs text-muted mt-1">Formato: cod_unidad, nombre_unidad, cod_padre, cod_empleado, nombre_empleado, puesto</div>
              </div>

              <div v-else class="dropzone__content dropzone__content--loaded d-flex align-center justify-between">
                <div class="d-flex align-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div class="text-left">
                    <div class="text-sm font-bold text-main">Archivo cargado exitosamente</div>
                    <div class="text-xs text-muted">{{ fileName }}</div>
                  </div>
                </div>
                <button class="btn btn--secondary btn--sm" @click.stop="resetToDatabase" title="Volver a Base de Datos">
                  ✕ Restablecer
                </button>
              </div>
            </div>
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
import { useToast } from '../composables/useToast';
import apiClient from '../api/client';
import OrganigramNode from '../components/organigram-node.vue';

const router = useRouter();
const toast = useToast();
const loading = ref(false);
const treeData = ref([]);
const flatUnits = ref([]);
const selectedUnitId = ref('ALL');
const allExpanded = ref(true);
const isCustomFile = ref(false);
const fileInput = ref(null);
const isDragging = ref(false);
const fileName = ref('');

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
  fileName.value = '';
  if (fileInput.value) fileInput.value.value = '';
  loadOrganigram(selectedUnitId.value);
};

const parseCSVToTree = (csvText) => {
  const lines = csvText.split('\n').filter(l => l.trim() !== '');
  const records = [];
  
  let startIdx = 0;
  if (lines.length > 0 && (lines[0].toLowerCase().includes('unidad') || lines[0].toLowerCase().includes('cod'))) {
    startIdx = 1;
  }
  
  // Format expected: cod_unidad, nombre_unidad, cod_padre, cod_empleado, nombre_empleado, puesto
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map(s => s.trim());
    if (cols.length >= 3) { // At least unit info is required
      records.push({
        cod_unidad: cols[0],
        nombre_unidad: cols[1],
        cod_padre: cols[2],
        cod_empleado: cols[3] || null,
        nombre_empleado: cols[4] || null,
        puesto: cols[5] || 'Colaborador'
      });
    }
  }

  const unitsMap = {};
  
  // First pass: extract all units
  records.forEach(r => {
    if (!unitsMap[r.cod_unidad]) {
      unitsMap[r.cod_unidad] = {
        id: r.cod_unidad,
        codigo: r.cod_unidad,
        nombre: r.nombre_unidad,
        padre_id: r.cod_padre,
        jefes: [],
        subordinados: [],
        colaboradores: [],
        subunidades: []
      };
    } else {
      // In case a unit appears multiple times, update its name if it wasn't set properly
      if (r.nombre_unidad && !unitsMap[r.cod_unidad].nombre) {
        unitsMap[r.cod_unidad].nombre = r.nombre_unidad;
      }
    }
  });

  // Set parent names
  Object.values(unitsMap).forEach(u => {
    if (u.padre_id && unitsMap[u.padre_id]) {
      u.padre_nombre = unitsMap[u.padre_id].nombre;
    }
  });

  // Second pass: add people to units
  records.forEach(r => {
    if (r.cod_empleado && r.nombre_empleado) {
      const pLower = r.puesto.toLowerCase();
      const esJefe = pLower.includes('jefe') || pLower.includes('director') || 
                     pLower.includes('secretari') || pLower.includes('encargado');
                     
      const colab = {
        persona_id: r.cod_empleado,
        primer_nombre: r.nombre_empleado.split(' ')[0] || '',
        primer_apellido: r.nombre_empleado.split(' ').slice(1).join(' ') || '',
        puesto_funcional: r.puesto,
        renglon_codigo: '-',
        cui_dpi: r.cod_empleado
      };

      const unit = unitsMap[r.cod_unidad];
      if (unit) {
        unit.colaboradores.push({}); // dummy for counting
        if (esJefe) {
          unit.jefes.push(colab);
        } else {
          unit.subordinados.push(colab);
        }
      }
    }
  });

  // Third pass: build hierarchy
  const tree = [];
  Object.values(unitsMap).forEach(u => {
    if (u.padre_id && unitsMap[u.padre_id]) {
      unitsMap[u.padre_id].subunidades.push(u);
    } else {
      tree.push(u);
    }
  });

  treeData.value = tree;
};

const triggerFileInput = () => {
  if (fileInput.value && !isCustomFile.value) {
    fileInput.value.click();
  }
};

const handleDrop = (event) => {
  isDragging.value = false;
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    processFile(file);
  } else {
    resetToDatabase();
  }
};

const processFile = (file) => {
  if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
    toast.error("Por favor, sube un archivo con extensión .csv o .txt");
    return;
  }
  
  fileName.value = file.name;
  isCustomFile.value = true;
  loading.value = true;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      parseCSVToTree(e.target.result);
      toast.success("Organigrama generado exitosamente.");
    } catch (err) {
      console.error("Error procesando CSV:", err);
      toast.error("Error procesando el archivo CSV. Asegúrate que tenga el formato correcto.");
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

.dropzone {
  border: 2px dashed var(--border-light, #cbd5e1);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
  background-color: var(--bg-subtle, #f8fafc);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.dropzone:hover, .dropzone--active {
  border-color: var(--color-primary-500, #3b82f6);
  background-color: #eff6ff;
}

.dropzone--loaded {
  border-color: #10b981;
  background-color: #f0fdf4;
  border-style: solid;
}

.hidden-input {
  display: none;
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
