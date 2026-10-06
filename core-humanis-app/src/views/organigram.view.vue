<template>
  <div class="organigram-view">
    <!-- Encabezado Adaptativo -->
    <div class="card glass-panel mb-4">
      <div class="card__body adaptive-bar">
        <div>
          <div class="d-flex align-center gap-2 flex-wrap">
            <h2 class="font-heading m-0">Organigramas & Estructura Ocupacional por Unidad</h2>
            <span class="badge badge--primary">SCSPR</span>
            <span v-if="isEditorMode" class="badge badge--warning animate-pulse">
              🛠️ Modo Editor Visual
            </span>
          </div>
          <p class="text-muted text-sm mt-1">
            Visualización jerárquica por unidad administrativa y personal asignado de la institución.
          </p>
        </div>

        <div class="adaptive-bar__actions d-flex align-center gap-2 flex-wrap">
          <!-- Selector de Modo de Vista (Expandible vs Diagrama Gráfico) -->
          <div class="view-mode-toggle d-flex gap-1 bg-subtle p-1 rounded">
            <button
              type="button"
              class="btn btn--xs"
              :class="activeViewMode === 'tree' ? 'btn--primary' : 'btn--secondary'"
              @click="activeViewMode = 'tree'"
              title="Vista jerárquica con tarjetas interactivas"
            >
              🗂️ Vista Expandible
            </button>
            <button
              type="button"
              class="btn btn--xs"
              :class="activeViewMode === 'diagram' ? 'btn--primary' : 'btn--secondary'"
              @click="activeViewMode = 'diagram'"
              title="Diagrama jerárquico gráfico conforme a la documentación técnica"
            >
              📊 Diagrama Jerárquico
            </button>
          </div>

          <!-- Botón de Modo Editor Visual (Solo para Administrador o con Permiso de Escritura) -->
          <button
            v-if="canEditOrganigram"
            class="btn"
            :class="isEditorMode ? 'btn--warning' : 'btn--outline-primary'"
            @click="toggleEditorMode"
            :title="isEditorMode ? 'Cerrar el modo de edición visual' : 'Activar editor visual interactivo para construir el organigrama'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            {{ isEditorMode ? '✕ Cerrar Editor' : '✏️ Modo Editor Visual' }}
          </button>

          <button v-if="activeViewMode === 'tree'" class="btn btn--secondary" @click="toggleExpandAll">
            {{ allExpanded ? '📁 Colapsar Nodos' : '📂 Desplegar Todo' }}
          </button>

          <button class="btn btn--primary d-flex align-center gap-1" @click="imprimirOrganigrama">
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

    <!-- Barra de Herramientas del Modo Editor Visual (Exclusivo RBAC) -->
    <div v-if="isEditorMode && canEditOrganigram" class="card editor-toolbar-card mb-4 border-warning">
      <div class="card__body p-3">
        <div class="d-flex align-center justify-between flex-wrap gap-3">
          <div class="d-flex align-center gap-2">
            <span class="editor-icon-badge">🛠️</span>
            <div>
              <div class="font-bold text-sm text-primary">
                Lienzo de Construcción y Edición Visual Activo
              </div>
              <div class="text-xs text-muted">
                Agrega áreas administrativas, subunidades dependientes o asigna personal institucional.
              </div>
            </div>
          </div>

          <div class="d-flex align-center gap-2 flex-wrap">
            <button class="btn btn--primary btn--sm" @click="openAddRootUnitModal">
              ➕ Nueva Unidad Raíz
            </button>
            <button class="btn btn--secondary btn--sm" @click="clearToBlankCanvas" title="Comenzar a armar un nuevo organigrama desde cero">
              📄 Lienzo en Blanco
            </button>
            <button class="btn btn--secondary btn--sm" @click="exportToCSV" title="Exportar la estructura como archivo CSV compatible">
              💾 Exportar CSV
            </button>
            <button class="btn btn--secondary btn--sm" @click="copyCSV" title="Copiar datos al portapapeles">
              📋 Copiar CSV
            </button>
            <button class="btn btn--secondary btn--sm" @click="resetToDatabase" title="Recargar la estructura original de la Base de Datos">
              🔄 Restaurar BD
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Buscador, Selector de Unidad y Carga de Archivo CSV -->
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
                    <div class="text-sm font-bold text-main">Estructura Personalizada Activa</div>
                    <div class="text-xs text-muted">{{ fileName }}</div>
                  </div>
                </div>
                <button class="btn btn--secondary btn--sm" @click.stop="resetToDatabase" title="Volver a Base de Datos">
                  ✕ Restablecer BD
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
      <div class="mb-3 text-lg">🏢 No hay unidades administrativas en el organigrama actual.</div>
      <p class="text-xs text-muted mb-4">
        Puedes restablecer los datos institucionales desde la base de datos o comenzar a crear áreas con el editor visual.
      </p>
      <div class="d-flex justify-center gap-3">
        <button v-if="canEditOrganigram" class="btn btn--primary" @click="openAddRootUnitModal">
          ➕ Crear Primera Unidad Institucional (Raíz)
        </button>
        <button class="btn btn--secondary" @click="resetToDatabase">
          🔄 Cargar Organigrama de Base de Datos
        </button>
      </div>
    </div>

    <!-- VISTA 1: ÁRBOL JERÁRQUICO EXPANDIBLE CON TARJETAS -->
    <div v-else-if="activeViewMode === 'tree'" class="organigram-tree">
      <div v-for="node in treeData" :key="node.id || node.codigo" class="tree-root mb-4">
        <OrganigramNode
          :node="node"
          :all-expanded="allExpanded"
          :is-editor-mode="isEditorMode"
          :can-edit="canEditOrganigram"
          @select-colaborador="verColaborador"
          @assign-colaborador="openAssignColabModal"
          @add-subunit="openAddSubunitModal"
          @edit-unit="openEditUnitModal"
          @delete-unit="handleDeleteUnit"
          @remove-colaborador="handleRemoveColaborador"
          @toggle-colab-role="handleToggleColabRole"
        />
      </div>
    </div>

    <!-- VISTA 2: DIAGRAMA GRÁFICO JERÁRQUICO (CONFORME A organigrama-carga-manual.md) -->
    <div v-else class="card p-4 overflow-x-auto bg-white mb-4">
      <div class="d-flex align-center justify-between mb-3 pb-2 border-bottom flex-wrap gap-2">
        <div class="d-flex align-center gap-2">
          <span class="badge badge--info font-bold">📊 Diagrama Jerárquico Oficial</span>
          <span class="text-xs text-muted">Estructura gráfica continua conforme a la especificación oficial (SCSPR)</span>
        </div>
        <div class="d-flex align-center gap-2">
          <button class="btn btn--primary btn--sm" @click="imprimirOrganigrama">
            🖨️ Imprimir / Guardar en PDF
          </button>
        </div>
      </div>

      <div class="diagram-canvas">
        <div class="diagram-roots-wrapper">
          <OrganigramDiagramNode
            v-for="rootNode in treeData"
            :key="rootNode.id || rootNode.codigo"
            :node="rootNode"
          />
        </div>
      </div>
    </div>

    <!-- MODALES DEL EDITOR VISUAL -->
    <!-- Modal para Agregar/Editar Unidad Administrativa -->
    <OrganigramUnitModal
      :show="showUnitModal"
      :unit="unitToEdit"
      :parent-unit="parentUnitForNew"
      :existing-units="flatUnits"
      @close="closeUnitModal"
      @save="handleSaveUnit"
    />

    <!-- Modal para Asignar Colaborador al Área -->
    <OrganigramCollaboratorModal
      :show="showColabModal"
      :unit="targetUnitForColab"
      @close="closeColabModal"
      @save="handleSaveColab"
    />

    <!-- Modal de Previsualización e Impresión del Diagrama Jerárquico -->
    <OrganigramPrintModal
      :show="showPrintModal"
      :tree-data="treeData"
      :selected-unit-label="selectedUnitName"
      :total-unidades="totalUnidades"
      :total-personal="totalPersonalTotal"
      @close="showPrintModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';
import { useAuthStore } from '../stores/auth.store';
import apiClient from '../api/client';
import OrganigramNode from '../components/organigram-node.vue';
import OrganigramUnitModal from '../components/organigram-unit.modal.vue';
import OrganigramCollaboratorModal from '../components/organigram-collaborator.modal.vue';
import OrganigramPrintModal from '../components/organigram-print-modal.vue';
import OrganigramDiagramNode from '../components/organigram-diagram-node.vue';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const loading = ref(false);
const treeData = ref([]);
const flatUnits = ref([]);
const selectedUnitId = ref('ALL');
const allExpanded = ref(true);
const isCustomFile = ref(false);
const fileInput = ref(null);
const isDragging = ref(false);
const fileName = ref('');

// Modo de Vista: 'tree' (expandible) | 'diagram' (diagrama gráfico tipo Mermaid)
const activeViewMode = ref('tree');

// Estado del Modal de Impresión
const showPrintModal = ref(false);

// Estado del Editor Visual
const isEditorMode = ref(false);
const showUnitModal = ref(false);
const showColabModal = ref(false);
const unitToEdit = ref(null);
const parentUnitForNew = ref(null);
const targetUnitForColab = ref(null);

// Control de Permisos RBAC: solo admin o con permiso de escritura
const canEditOrganigram = computed(() => {
  if (!authStore.user) return false;
  return authStore.user.role === 'admin' || authStore.canWrite;
});

const totalUnidades = computed(() => isCustomFile.value ? flatUnits.value.length : flatUnits.value.length);
const totalPersonalTotal = computed(() => {
  let total = 0;
  const countColabs = (node) => {
    total += (node.jefes ? node.jefes.length : 0) + (node.subordinados ? node.subordinados.length : 0);
    if (node.subunidades) node.subunidades.forEach(countColabs);
  };
  treeData.value.forEach(countColabs);
  return total;
});

const selectedUnitName = computed(() => {
  if (selectedUnitId.value === 'ALL') {
    return 'Toda la Institución (Todas las Unidades)';
  }
  const u = flatUnits.value.find((unit) => (unit.id === selectedUnitId.value || unit.codigo === selectedUnitId.value));
  return u ? `${u.codigo} - ${u.nombre}` : 'Unidad Seleccionada';
});

// Alternar Modo Editor Visual
const toggleEditorMode = () => {
  if (!canEditOrganigram.value) {
    toast.error('No posees permisos para editar la estructura del organigrama.');
    return;
  }
  isEditorMode.value = !isEditorMode.value;
  if (isEditorMode.value) {
    activeViewMode.value = 'tree';
    toast.info('Modo Editor Visual activado. Puedes agregar y modificar áreas y personal.');
  }
};

// Carga inicial del organigrama desde la API de catálogos
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
    toast.error('Error al cargar la estructura del organigrama.');
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
  if (!isCustomFile.value && !isEditorMode.value && personaId) {
    router.push(`/collaborators/${personaId}`);
  }
};

// Dispara la previsualización e impresión oficial del diagrama jerárquico
const imprimirOrganigrama = () => {
  showPrintModal.value = true;
};

const resetToDatabase = () => {
  isCustomFile.value = false;
  fileName.value = '';
  if (fileInput.value) fileInput.value.value = '';
  loadOrganigram(selectedUnitId.value);
  toast.info('Organigrama restablecido desde la Base de Datos.');
};

// ===========================================================================
// FUNCIONES AUXILIARES DE MANIPULACIÓN DEL ÁRBOL
// ===========================================================================
const findNodeRecursive = (nodes, idOrCode) => {
  if (!nodes || !nodes.length) return null;
  for (const n of nodes) {
    if (n.id == idOrCode || n.codigo == idOrCode) return n;
    if (n.subunidades && n.subunidades.length) {
      const found = findNodeRecursive(n.subunidades, idOrCode);
      if (found) return found;
    }
  }
  return null;
};

const removeNodeRecursive = (nodes, idOrCode) => {
  if (!nodes || !nodes.length) return false;
  const index = nodes.findIndex((n) => n.id == idOrCode || n.codigo == idOrCode);
  if (index !== -1) {
    nodes.splice(index, 1);
    return true;
  }
  for (const n of nodes) {
    if (n.subunidades && n.subunidades.length) {
      if (removeNodeRecursive(n.subunidades, idOrCode)) return true;
    }
  }
  return false;
};

const flattenTree = (nodes) => {
  let list = [];
  for (const n of nodes) {
    list.push({
      id: n.id || n.codigo,
      codigo: n.codigo,
      nombre: n.nombre,
      padre_id: n.padre_id || n.dependencia_padre_id || null,
      padre_nombre: n.padre_nombre || null,
      total_personal: (n.jefes?.length || 0) + (n.subordinados?.length || 0),
    });
    if (n.subunidades && n.subunidades.length) {
      list = list.concat(flattenTree(n.subunidades));
    }
  }
  return list;
};

// ===========================================================================
// GESTIÓN DE MODALES Y ACCIONES DEL EDITOR VISUAL
// ===========================================================================
const openAddRootUnitModal = () => {
  unitToEdit.value = null;
  parentUnitForNew.value = null;
  showUnitModal.value = true;
};

const openAddSubunitModal = (parentNode) => {
  unitToEdit.value = null;
  parentUnitForNew.value = parentNode;
  showUnitModal.value = true;
};

const openEditUnitModal = (node) => {
  unitToEdit.value = node;
  parentUnitForNew.value = null;
  showUnitModal.value = true;
};

const closeUnitModal = () => {
  showUnitModal.value = false;
  unitToEdit.value = null;
  parentUnitForNew.value = null;
};

const openAssignColabModal = (node) => {
  targetUnitForColab.value = node;
  showColabModal.value = true;
};

const closeColabModal = () => {
  showColabModal.value = false;
  targetUnitForColab.value = null;
};

// Guardar creación o edición de unidad
const handleSaveUnit = (payload) => {
  if (payload.isEdit) {
    const existing = findNodeRecursive(treeData.value, payload.oldCodigo);
    if (!existing) {
      toast.error('No se localizó la unidad a editar.');
      return;
    }
    existing.codigo = payload.codigo;
    existing.nombre = payload.nombre;

    const currentParentId = existing.padre_id || existing.dependencia_padre_id;
    if (currentParentId !== payload.padre_id) {
      removeNodeRecursive(treeData.value, payload.oldCodigo);
      if (payload.padre_id) {
        const newParent = findNodeRecursive(treeData.value, payload.padre_id);
        if (newParent) {
          existing.padre_id = newParent.codigo || newParent.id;
          existing.padre_nombre = newParent.nombre;
          if (!newParent.subunidades) newParent.subunidades = [];
          newParent.subunidades.push(existing);
        } else {
          existing.padre_id = null;
          existing.padre_nombre = null;
          treeData.value.push(existing);
        }
      } else {
        existing.padre_id = null;
        existing.padre_nombre = null;
        treeData.value.push(existing);
      }
    }
    toast.success(`Unidad ${payload.codigo} actualizada.`);
  } else {
    const exists = findNodeRecursive(treeData.value, payload.codigo);
    if (exists) {
      toast.error(`Ya existe un área con el código "${payload.codigo}".`);
      return;
    }

    const newNode = {
      id: payload.codigo,
      codigo: payload.codigo,
      nombre: payload.nombre,
      padre_id: payload.padre_id || null,
      padre_nombre: null,
      jefes: [],
      subordinados: [],
      colaboradores: [],
      subunidades: [],
    };

    if (payload.padre_id) {
      const parent = findNodeRecursive(treeData.value, payload.padre_id);
      if (parent) {
        newNode.padre_nombre = parent.nombre;
        if (!parent.subunidades) parent.subunidades = [];
        parent.subunidades.push(newNode);
      } else {
        treeData.value.push(newNode);
      }
    } else {
      treeData.value.push(newNode);
    }
    toast.success(`Unidad ${payload.codigo} agregada.`);
  }

  isCustomFile.value = true;
  if (!fileName.value) fileName.value = 'Organigrama en Edición Visual';
  flatUnits.value = flattenTree(treeData.value);
};

// Eliminar unidad del organigrama
const handleDeleteUnit = (node) => {
  const confirmMsg = `¿Deseas eliminar el área "${node.nombre}" (${node.codigo})?\nSe eliminarán también las subunidades dependientes de esta rama.`;
  if (confirm(confirmMsg)) {
    removeNodeRecursive(treeData.value, node.codigo || node.id);
    isCustomFile.value = true;
    if (!fileName.value) fileName.value = 'Organigrama en Edición Visual';
    flatUnits.value = flattenTree(treeData.value);
    toast.info(`Área ${node.nombre} eliminada.`);
  }
};

// Guardar asignación de colaborador a un área
const handleSaveColab = ({ unit, colab }) => {
  const target = findNodeRecursive(treeData.value, unit.codigo || unit.id);
  if (!target) {
    toast.error('No se encontró el área de destino.');
    return;
  }

  if (!target.jefes) target.jefes = [];
  if (!target.subordinados) target.subordinados = [];
  if (!target.colaboradores) target.colaboradores = [];

  const exists = target.colaboradores.some(
    (c) => c.persona_id === colab.persona_id || (colab.cui_dpi !== '-' && colab.cui_dpi !== 'N/A' && c.cui_dpi === colab.cui_dpi)
  );

  if (exists) {
    toast.warning('Este colaborador ya se encuentra asignado a esta área.');
    return;
  }

  if (colab.is_jefe) {
    target.jefes.push(colab);
  } else {
    target.subordinados.push(colab);
  }
  target.colaboradores.push(colab);

  isCustomFile.value = true;
  if (!fileName.value) fileName.value = 'Organigrama en Edición Visual';
  flatUnits.value = flattenTree(treeData.value);
  toast.success(`Colaborador ${colab.primer_nombre} ${colab.primer_apellido} asignado a ${target.nombre}.`);
};

// Desasignar colaborador de un área
const handleRemoveColaborador = ({ node, colab, isJefe }) => {
  const target = findNodeRecursive(treeData.value, node.codigo || node.id);
  if (!target) return;

  if (isJefe && target.jefes) {
    target.jefes = target.jefes.filter((c) => c.persona_id !== colab.persona_id && c.cui_dpi !== colab.cui_dpi);
  } else if (!isJefe && target.subordinados) {
    target.subordinados = target.subordinados.filter((c) => c.persona_id !== colab.persona_id && c.cui_dpi !== colab.cui_dpi);
  }

  if (target.colaboradores) {
    target.colaboradores = target.colaboradores.filter((c) => c.persona_id !== colab.persona_id && c.cui_dpi !== colab.cui_dpi);
  }

  isCustomFile.value = true;
  if (!fileName.value) fileName.value = 'Organigrama en Edición Visual';
  flatUnits.value = flattenTree(treeData.value);
  toast.info(`Colaborador desasignado de ${target.nombre}.`);
};

// Alternar rol entre Jefatura (Nivel 1) y Equipo Técnico (Nivel 2)
const handleToggleColabRole = ({ node, colab, isJefe }) => {
  const target = findNodeRecursive(treeData.value, node.codigo || node.id);
  if (!target) return;

  if (isJefe) {
    target.jefes = (target.jefes || []).filter((c) => c.persona_id !== colab.persona_id && c.cui_dpi !== colab.cui_dpi);
    if (!target.subordinados) target.subordinados = [];
    target.subordinados.push({ ...colab, is_jefe: false });
    toast.info(`${colab.primer_nombre} trasladado a Equipo Técnico.`);
  } else {
    target.subordinados = (target.subordinados || []).filter((c) => c.persona_id !== colab.persona_id && c.cui_dpi !== colab.cui_dpi);
    if (!target.jefes) target.jefes = [];
    target.jefes.push({ ...colab, is_jefe: true });
    toast.success(`${colab.primer_nombre} promovido a Jefatura / Dirección.`);
  }

  isCustomFile.value = true;
  if (!fileName.value) fileName.value = 'Organigrama en Edición Visual';
};

// Reiniciar a lienzo en blanco
const clearToBlankCanvas = () => {
  if (confirm('¿Deseas iniciar con un lienzo en blanco para construir el organigrama desde cero?')) {
    treeData.value = [];
    flatUnits.value = [];
    isCustomFile.value = true;
    fileName.value = 'Nuevo Organigrama (Lienzo en Blanco)';
    isEditorMode.value = true;
    activeViewMode.value = 'tree';
    toast.info('Lienzo en blanco inicializado. Agrega tu primera unidad institucional.');
  }
};

// Generador de estructura CSV
const generateCSVText = () => {
  const rows = ['cod_unidad, nombre_unidad, cod_padre, cod_empleado, nombre_empleado, puesto'];

  const traverse = (node, parentCode = '') => {
    const pCode = node.padre_id || parentCode || '';
    const allColabs = [
      ...(node.jefes || []).map((j) => ({ ...j, isJefe: true })),
      ...(node.subordinados || []).map((s) => ({ ...s, isJefe: false })),
    ];

    if (!allColabs.length) {
      rows.push(`"${node.codigo}","${node.nombre}","${pCode}","","",""`);
    } else {
      allColabs.forEach((c) => {
        const nombreCompleto = `${c.primer_nombre || ''} ${c.segundo_nombre || ''} ${c.primer_apellido || ''} ${c.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
        const puesto = c.puesto_funcional || c.puesto_nominal || (c.isJefe ? 'Jefe / Director' : 'Colaborador');
        const cui = c.cui_dpi && c.cui_dpi !== '-' ? c.cui_dpi : (c.persona_id || '');
        rows.push(`"${node.codigo}","${node.nombre}","${pCode}","${cui}","${nombreCompleto}","${puesto}"`);
      });
    }

    if (node.subunidades && node.subunidades.length) {
      node.subunidades.forEach((sub) => traverse(sub, node.codigo));
    }
  };

  treeData.value.forEach((root) => traverse(root, ''));
  return rows.join('\n');
};

const exportToCSV = () => {
  if (!treeData.value.length) {
    toast.warning('No hay estructura para exportar.');
    return;
  }
  const csvContent = generateCSVText();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `organigrama_institucional_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('Archivo CSV descargado exitosamente.');
};

const copyCSV = async () => {
  if (!treeData.value.length) {
    toast.warning('No hay estructura para copiar.');
    return;
  }
  const csvContent = generateCSVText();
  try {
    await navigator.clipboard.writeText(csvContent);
    toast.success('Estructura CSV copiada al portapapeles.');
  } catch (err) {
    toast.error('No se pudo copiar al portapapeles.');
  }
};

// ===========================================================================
// PARSEO DE CSV Y DROPZONE
// ===========================================================================
const parseCSVToTree = (csvText) => {
  const lines = csvText.split('\n').filter((l) => l.trim() !== '');
  const records = [];

  let startIdx = 0;
  if (lines.length > 0 && (lines[0].toLowerCase().includes('unidad') || lines[0].toLowerCase().includes('cod'))) {
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    if (cols.length >= 3) {
      records.push({
        cod_unidad: cols[0],
        nombre_unidad: cols[1],
        cod_padre: cols[2] || null,
        cod_empleado: cols[3] || null,
        nombre_empleado: cols[4] || null,
        puesto: cols[5] || 'Colaborador',
      });
    }
  }

  const unitsMap = {};

  records.forEach((r) => {
    if (!unitsMap[r.cod_unidad]) {
      unitsMap[r.cod_unidad] = {
        id: r.cod_unidad,
        codigo: r.cod_unidad,
        nombre: r.nombre_unidad,
        padre_id: r.cod_padre || null,
        jefes: [],
        subordinados: [],
        colaboradores: [],
        subunidades: [],
      };
    } else {
      if (r.nombre_unidad && !unitsMap[r.cod_unidad].nombre) {
        unitsMap[r.cod_unidad].nombre = r.nombre_unidad;
      }
    }
  });

  Object.values(unitsMap).forEach((u) => {
    if (u.padre_id && unitsMap[u.padre_id]) {
      u.padre_nombre = unitsMap[u.padre_id].nombre;
    }
  });

  records.forEach((r) => {
    if (r.cod_empleado && r.nombre_empleado) {
      const pLower = (r.puesto || '').toLowerCase();
      const esJefe =
        pLower.includes('jefe') ||
        pLower.includes('director') ||
        pLower.includes('secretari') ||
        pLower.includes('encargado');

      const colab = {
        persona_id: r.cod_empleado,
        primer_nombre: r.nombre_empleado.split(' ')[0] || '',
        primer_apellido: r.nombre_empleado.split(' ').slice(1).join(' ') || '',
        puesto_funcional: r.puesto,
        renglon_codigo: '-',
        cui_dpi: r.cod_empleado,
        is_jefe: esJefe,
      };

      const unit = unitsMap[r.cod_unidad];
      if (unit) {
        unit.colaboradores.push(colab);
        if (esJefe) {
          unit.jefes.push(colab);
        } else {
          unit.subordinados.push(colab);
        }
      }
    }
  });

  const tree = [];
  Object.values(unitsMap).forEach((u) => {
    if (u.padre_id && unitsMap[u.padre_id]) {
      unitsMap[u.padre_id].subunidades.push(u);
    } else {
      tree.push(u);
    }
  });

  treeData.value = tree;
  flatUnits.value = flattenTree(tree);
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
    toast.error('Por favor, sube un archivo con extensión .csv o .txt');
    return;
  }

  fileName.value = file.name;
  isCustomFile.value = true;
  loading.value = true;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      parseCSVToTree(e.target.result);
      toast.success('Organigrama cargado desde archivo exitosamente.');
    } catch (err) {
      console.error('Error procesando CSV:', err);
      toast.error('Error procesando el archivo CSV. Asegúrate de que tenga el formato correcto.');
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

.view-mode-toggle {
  background: var(--bg-subtle, #f1f5f9);
  border: 1px solid var(--border-light, #e2e8f0);
}

.btn--outline-primary {
  border: 1px solid var(--color-primary-600, #2563eb);
  color: var(--color-primary-700, #1d4ed8);
  background: transparent;
  transition: all 0.2s ease;
}

.btn--outline-primary:hover {
  background: var(--color-primary-50, #eff6ff);
}

.editor-toolbar-card {
  background: linear-gradient(135deg, #fefce8 0%, #fffbeb 100%);
  border-left: 4px solid var(--color-warning, #f59e0b);
  box-shadow: var(--shadow-sm);
}

.editor-icon-badge {
  font-size: 1.5rem;
  background: #fef08a;
  padding: 0.35rem;
  border-radius: var(--radius-sm, 6px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.dropzone:hover,
.dropzone--active {
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

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* LIENZO DE DIAGRAMA EN PANTALLA */
.diagram-canvas {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
  overflow-x: auto;
}

.diagram-roots-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  align-items: center;
  width: 100%;
}

@media print {
  .adaptive-bar,
  .adaptive-bar__actions,
  .editor-toolbar-card,
  .form-group,
  .badge,
  .glass-panel,
  .card-header,
  .view-mode-toggle,
  .dropzone,
  .btn,
  .card:not(.printable-sheet):not(.print-modal-wrapper) {
    display: none !important;
  }
  .organigram-view {
    padding: 0 !important;
    margin: 0 !important;
    background: #ffffff !important;
  }
  .diagram-canvas {
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    overflow: visible !important;
  }
  .tree-root {
    page-break-inside: avoid;
  }
}
</style>
