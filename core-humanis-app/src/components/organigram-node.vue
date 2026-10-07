<template>
  <div
    class="organigram-node card mb-3"
    :class="{
      'organigram-node--root': !node.dependencia_padre_id && !node.padre_id,
      'organigram-node--editable': isEditorMode && canEdit,
      'organigram-node--drag-over': isDragOverUnit,
      'organigram-node--dragging': isDraggingThisUnit,
    }"
    :draggable="isEditorMode && canEdit"
    @dragstart.stop="handleUnitDragStart($event)"
    @dragend.stop="handleUnitDragEnd"
  >
    <!-- Cabecera del Nodo de Unidad (Drop target para mover áreas o colaboradores) -->
    <div
      class="node-header d-flex justify-between align-center p-3"
      :class="{ 'node-header--drop-target': isDragOverUnit }"
      @click="toggleOpen"
      @dragover.prevent="handleHeaderDragOver($event)"
      @dragenter.prevent="handleHeaderDragEnter($event)"
      @dragleave="handleHeaderDragLeave($event)"
      @drop.prevent="handleHeaderDrop($event)"
    >
      <div class="d-flex align-center gap-2">
        <!-- Manija de Arrastre de Área (Solo en Modo Editor) -->
        <span
          v-if="isEditorMode && canEdit"
          class="node-drag-handle"
          title="Arrastrar para mover esta unidad a otra dependencia"
          @click.stop
        >
          <span class="material-symbols-outlined material-symbols-outlined--sm">drag_indicator</span>
        </span>

        <button
          type="button"
          class="btn-toggle-tree"
          @click.stop="toggleOpen"
          :aria-label="isOpen ? 'Colapsar unidad' : 'Expandir unidad'"
        >
          <span class="material-symbols-outlined material-symbols-outlined--sm">
            {{ isOpen ? 'expand_more' : 'chevron_right' }}
          </span>
        </button>

        <div>
          <div class="d-flex align-center gap-2 flex-wrap">
            <span class="badge badge--info font-mono">{{ node.codigo }}</span>
            <h3 class="node-title m-0">{{ node.nombre }}</h3>
            <span v-if="isEditorMode && canEdit" class="badge badge--warning text-xs d-inline-flex align-center gap-1">
              <span class="material-symbols-outlined material-symbols-outlined--xs">edit</span>
              Editable
            </span>
            <span
              v-if="isDragOverUnit && draggedItem?.type === 'unit' && draggedItem.unitCode !== node.codigo"
              class="badge badge--success text-xs animate-pulse d-inline-flex align-center gap-1"
            >
              <span class="material-symbols-outlined material-symbols-outlined--xs">subdirectory_arrow_right</span>
              Soltar para convertir en subunidad de {{ node.nombre }}
            </span>
            <span
              v-else-if="isDragOverUnit && draggedItem?.type === 'collaborator'"
              class="badge badge--info text-xs animate-pulse d-inline-flex align-center gap-1"
            >
              <span class="material-symbols-outlined material-symbols-outlined--xs">person_add</span>
              Soltar para asignar a esta unidad
            </span>
          </div>
          <p v-if="node.padre_nombre" class="text-xs text-muted mt-1 m-0">
            Depende de: <strong>{{ node.padre_nombre }}</strong>
          </p>
        </div>
      </div>

      <div class="d-flex align-center gap-2 flex-wrap">
        <!-- Acciones Rápidas del Modo Editor Visual -->
        <div v-if="isEditorMode && canEdit" class="node-editor-actions d-flex align-center gap-1" @click.stop>
          <button
            type="button"
            class="btn-node-act btn-node-act--colab d-inline-flex align-center gap-1"
            title="Asignar Colaborador al Área"
            @click.stop="$emit('assign-colaborador', node)"
          >
            <span class="material-symbols-outlined material-symbols-outlined--xs">person_add</span>
            Personal
          </button>
          <button
            type="button"
            class="btn-node-act btn-node-act--sub d-inline-flex align-center gap-1"
            title="Agregar Subunidad Dependiente"
            @click.stop="$emit('add-subunit', node)"
          >
            <span class="material-symbols-outlined material-symbols-outlined--xs">add_box</span>
            Subárea
          </button>
          <button
            type="button"
            class="btn-node-act btn-node-act--edit"
            title="Editar Código o Nombre del Área"
            @click.stop="$emit('edit-unit', node)"
          >
            <span class="material-symbols-outlined material-symbols-outlined--xs">edit</span>
          </button>
          <button
            type="button"
            class="btn-node-act btn-node-act--del"
            title="Eliminar esta Área del Organigrama"
            @click.stop="$emit('delete-unit', node)"
          >
            <span class="material-symbols-outlined material-symbols-outlined--xs">delete</span>
          </button>
        </div>

        <span class="badge d-inline-flex align-center gap-1" :class="totalColaboradores ? 'badge--success' : 'badge--secondary'">
          <span class="material-symbols-outlined material-symbols-outlined--xs">group</span>
          {{ totalColaboradores }} Colaboradores
        </span>
        <span v-if="node.subunidades && node.subunidades.length" class="badge badge--neutral d-inline-flex align-center gap-1">
          <span class="material-symbols-outlined material-symbols-outlined--xs">account_tree</span>
          {{ node.subunidades.length }} Subunidades
        </span>
      </div>
    </div>

    <!-- Contenido Plegable (Colaboradores y Subunidades) -->
    <div v-show="isOpen" class="node-body p-3 pt-0">
      <!-- Sección: Personal Asignado a la Unidad (Jerarquía Jefe vs Subordinados) -->
      <div class="colabs-section mt-2">
        <!-- Zona Vacía con capacidad de Drop para Colaboradores -->
        <div
          v-if="!totalColaboradores"
          class="empty-colabs p-2 bg-subtle rounded d-flex align-center justify-between"
          :class="{ 'dropzone-active': isDragOverEmpty && draggedItem?.type === 'collaborator' }"
          @dragover.prevent="handleEmptyDragOver($event)"
          @dragleave="isDragOverEmpty = false"
          @drop.prevent="handleEmptyDrop($event)"
        >
          <span class="text-xs text-muted italic d-inline-flex align-center gap-1">
            <span class="material-symbols-outlined material-symbols-outlined--xs">info</span>
            {{ isDragOverEmpty && draggedItem?.type === 'collaborator' ? 'Soltar aquí para asignar a esta unidad' : 'Sin personal directo asignado a esta unidad.' }}
          </span>
          <button
            v-if="isEditorMode && canEdit"
            type="button"
            class="btn btn--secondary btn--xs d-inline-flex align-center gap-1"
            @click.stop="$emit('assign-colaborador', node)"
          >
            <span class="material-symbols-outlined material-symbols-outlined--xs">person_add</span>
            Asignar colaborador
          </button>
        </div>

        <div v-else class="hierarchy-container">
          <!-- NIVEL 1: JEFATURA / DIRECCIÓN / ENCARGADO (Drop Target para rol Jefe) -->
          <div
            class="level-jefatura mb-3"
            :class="{ 'level-dropzone--active': isDragOverJefatura && draggedItem?.type === 'collaborator' }"
            @dragover.prevent="handleJefaturaDragOver($event)"
            @dragleave="isDragOverJefatura = false"
            @drop.prevent="handleJefaturaDrop($event)"
          >
            <div class="d-flex align-center justify-between mb-2">
              <h4 class="text-xs font-bold text-uppercase text-primary m-0 d-inline-flex align-center gap-1">
                <span class="material-symbols-outlined material-symbols-outlined--sm text-warning material-symbols-outlined--fill">
                  workspace_premium
                </span>
                Jefatura / Dirección de Unidad (Nivel 1):
              </h4>
              <span
                v-if="isEditorMode && canEdit && draggedItem?.type === 'collaborator'"
                class="badge badge--warning text-xs animate-pulse d-inline-flex align-center gap-1"
              >
                <span class="material-symbols-outlined material-symbols-outlined--xs">arrow_downward</span>
                Soltar para asignar como Jefatura
              </span>
            </div>

            <div v-if="node.jefes && node.jefes.length" class="colabs-grid">
              <div
                v-for="c in node.jefes"
                :key="c.persona_id || c.cui_dpi"
                class="colab-card colab-card--jefe"
                :class="{ 'colab-card--dragging': isDraggingColabId === (c.persona_id || c.cui_dpi) }"
                :draggable="isEditorMode && canEdit"
                @click="$emit('select-colaborador', c.persona_id)"
                @dragstart.stop="handleColabDragStart($event, c, true)"
                @dragend.stop="handleColabDragEnd"
              >
                <span
                  v-if="isEditorMode && canEdit"
                  class="colab-drag-handle"
                  title="Arrastrar para mover o cambiar rol"
                  @click.stop
                >
                  <span class="material-symbols-outlined material-symbols-outlined--xs">drag_indicator</span>
                </span>

                <div class="colab-avatar-mini colab-avatar--jefe">
                  {{ c.primer_nombre?.[0] || '?' }}{{ c.primer_apellido?.[0] || '' }}
                </div>
                <div class="colab-info flex-1">
                  <div class="d-flex align-center justify-between">
                    <div class="colab-name text-bold">
                      {{ c.primer_nombre }} {{ c.segundo_nombre || '' }} {{ c.primer_apellido }} {{ c.segundo_apellido || '' }}
                    </div>
                    <span class="badge badge--warning text-xs d-inline-flex align-center gap-1">
                      <span class="material-symbols-outlined material-symbols-outlined--xs">shield_person</span>
                      Jefe / Director
                    </span>
                  </div>
                  <div class="colab-puesto text-xs text-primary font-bold">
                    {{ c.puesto_funcional || c.puesto_nominal || 'Puesto Sin Nombre' }}
                  </div>
                  <div class="colab-renglon text-xs text-muted">
                    Renglón {{ c.renglon_codigo || '011' }} &bull; CUI: {{ c.cui_dpi || '-' }}
                  </div>
                </div>

                <!-- Acciones del Editor en la Tarjeta de Colaborador -->
                <div v-if="isEditorMode && canEdit" class="colab-actions d-flex flex-column gap-1" @click.stop>
                  <button
                    type="button"
                    class="btn-colab-tool"
                    title="Mover a Equipo Técnico (Nivel 2)"
                    @click.stop="$emit('toggle-colab-role', { node, colab: c, isJefe: true })"
                  >
                    <span class="material-symbols-outlined material-symbols-outlined--xs">arrow_downward</span>
                  </button>
                  <button
                    type="button"
                    class="btn-colab-tool btn-colab-tool--del"
                    title="Quitar colaborador de esta área"
                    @click.stop="$emit('remove-colaborador', { node, colab: c, isJefe: true })"
                  >
                    <span class="material-symbols-outlined material-symbols-outlined--xs">person_remove</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Placeholder si no hay jefe y se está arrastrando colaborador -->
            <div
              v-else-if="isEditorMode && canEdit"
              class="colab-drop-placeholder p-2 rounded text-center text-xs text-muted"
            >
              <span class="d-inline-flex align-center gap-1">
                <span class="material-symbols-outlined material-symbols-outlined--xs">shield_person</span>
                Sin jefatura asignada. Arrastra un colaborador aquí para asignarlo como Jefe/Director.
              </span>
            </div>
          </div>

          <!-- NIVEL 2: EQUIPO TÉCNICO & SUBORDINADOS (Drop Target para rol Subordinado) -->
          <div
            class="level-subordinados"
            :class="{ 'level-dropzone--active': isDragOverSubordinados && draggedItem?.type === 'collaborator' }"
            @dragover.prevent="handleSubordinadosDragOver($event)"
            @dragleave="isDragOverSubordinados = false"
            @drop.prevent="handleSubordinadosDrop($event)"
          >
            <div class="d-flex align-center justify-between mb-2">
              <h4 class="text-xs font-bold text-uppercase text-muted m-0 d-inline-flex align-center gap-1">
                <span class="material-symbols-outlined material-symbols-outlined--sm text-muted">
                  groups
                </span>
                Equipo Técnico & Subordinados Directos (Nivel 2):
              </h4>
              <span
                v-if="isEditorMode && canEdit && draggedItem?.type === 'collaborator'"
                class="badge badge--info text-xs animate-pulse d-inline-flex align-center gap-1"
              >
                <span class="material-symbols-outlined material-symbols-outlined--xs">arrow_downward</span>
                Soltar para asignar a Equipo Técnico
              </span>
            </div>

            <div v-if="node.subordinados && node.subordinados.length" class="colabs-grid">
              <div
                v-for="c in node.subordinados"
                :key="c.persona_id || c.cui_dpi"
                class="colab-card"
                :class="{ 'colab-card--dragging': isDraggingColabId === (c.persona_id || c.cui_dpi) }"
                :draggable="isEditorMode && canEdit"
                @click="$emit('select-colaborador', c.persona_id)"
                @dragstart.stop="handleColabDragStart($event, c, false)"
                @dragend.stop="handleColabDragEnd"
              >
                <span
                  v-if="isEditorMode && canEdit"
                  class="colab-drag-handle"
                  title="Arrastrar para mover o cambiar rol"
                  @click.stop
                >
                  <span class="material-symbols-outlined material-symbols-outlined--xs">drag_indicator</span>
                </span>

                <div class="colab-avatar-mini">
                  {{ c.primer_nombre?.[0] || '?' }}{{ c.primer_apellido?.[0] || '' }}
                </div>
                <div class="colab-info flex-1">
                  <div class="colab-name">
                    {{ c.primer_nombre }} {{ c.segundo_nombre || '' }} {{ c.primer_apellido }} {{ c.segundo_apellido || '' }}
                  </div>
                  <div class="colab-puesto text-xs">
                    <strong>{{ c.puesto_funcional || c.puesto_nominal || 'Puesto Sin Nombre' }}</strong>
                  </div>
                  <div class="colab-renglon text-xs text-muted">
                    Renglón {{ c.renglon_codigo || '011' }} &bull; CUI: {{ c.cui_dpi || '-' }}
                  </div>
                </div>

                <!-- Acciones del Editor en la Tarjeta de Colaborador -->
                <div v-if="isEditorMode && canEdit" class="colab-actions d-flex flex-column gap-1" @click.stop>
                  <button
                    type="button"
                    class="btn-colab-tool"
                    title="Promover a Jefatura / Dirección (Nivel 1)"
                    @click.stop="$emit('toggle-colab-role', { node, colab: c, isJefe: false })"
                  >
                    <span class="material-symbols-outlined material-symbols-outlined--xs text-warning material-symbols-outlined--fill">
                      workspace_premium
                    </span>
                  </button>
                  <button
                    type="button"
                    class="btn-colab-tool btn-colab-tool--del"
                    title="Quitar colaborador de esta área"
                    @click.stop="$emit('remove-colaborador', { node, colab: c, isJefe: false })"
                  >
                    <span class="material-symbols-outlined material-symbols-outlined--xs">person_remove</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Placeholder si no hay subordinados y se está arrastrando colaborador -->
            <div
              v-else-if="isEditorMode && canEdit"
              class="colab-drop-placeholder p-2 rounded text-center text-xs text-muted"
            >
              <span class="d-inline-flex align-center gap-1">
                <span class="material-symbols-outlined material-symbols-outlined--xs">groups</span>
                Sin equipo técnico directo. Arrastra un colaborador aquí para asignarlo.
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección: Subunidades Dependientes (Recursivo) -->
      <div v-if="node.subunidades && node.subunidades.length" class="subunits-section mt-3 pt-3 border-top">
        <h4 class="text-xs font-bold text-uppercase text-muted mb-2 d-inline-flex align-center gap-1">
          <span class="material-symbols-outlined material-symbols-outlined--xs">account_tree</span>
          Subunidades Jerárquicas Dependientes:
        </h4>
        <div class="subunits-tree pl-3">
          <OrganigramNode
            v-for="sub in node.subunidades"
            :key="sub.id || sub.codigo"
            :node="sub"
            :all-expanded="allExpanded"
            :is-editor-mode="isEditorMode"
            :can-edit="canEdit"
            @select-colaborador="$emit('select-colaborador', $event)"
            @assign-colaborador="$emit('assign-colaborador', $event)"
            @add-subunit="$emit('add-subunit', $event)"
            @edit-unit="$emit('edit-unit', $event)"
            @delete-unit="$emit('delete-unit', $event)"
            @remove-colaborador="$emit('remove-colaborador', $event)"
            @toggle-colab-role="$emit('toggle-colab-role', $event)"
            @move-unit="$emit('move-unit', $event)"
            @move-collaborator="$emit('move-collaborator', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useOrganigramDrag } from '../composables/useOrganigramDrag';

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  allExpanded: {
    type: Boolean,
    default: true,
  },
  isEditorMode: {
    type: Boolean,
    default: false,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'select-colaborador',
  'assign-colaborador',
  'add-subunit',
  'edit-unit',
  'delete-unit',
  'remove-colaborador',
  'toggle-colab-role',
  'move-unit',
  'move-collaborator',
]);

const { draggedItem, setDraggedItem, clearDraggedItem } = useOrganigramDrag();

const isOpen = ref(props.allExpanded);
const isDraggingThisUnit = ref(false);
const isDraggingColabId = ref(null);
const isDragOverUnit = ref(false);
const isDragOverJefatura = ref(false);
const isDragOverSubordinados = ref(false);
const isDragOverEmpty = ref(false);

const totalColaboradores = computed(() => {
  if (props.node.colaboradores && props.node.colaboradores.length) {
    return props.node.colaboradores.length;
  }
  const j = props.node.jefes?.length || 0;
  const s = props.node.subordinados?.length || 0;
  return j + s;
});

watch(
  () => props.allExpanded,
  (newVal) => {
    isOpen.value = newVal;
  }
);

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

// ===========================================================================
// DRAG AND DROP: MANEJO DE ÁREAS (UNIDADES)
// ===========================================================================
const handleUnitDragStart = (e) => {
  if (!props.isEditorMode || !props.canEdit) return;
  isDraggingThisUnit.value = true;
  e.dataTransfer.effectAllowed = 'move';
  const payload = {
    type: 'unit',
    unitCode: props.node.codigo,
    unitId: props.node.id,
    unitName: props.node.nombre,
  };
  e.dataTransfer.setData('application/json', JSON.stringify(payload));
  e.dataTransfer.setData('text/plain', props.node.codigo);
  setDraggedItem(payload);
};

const handleUnitDragEnd = () => {
  isDraggingThisUnit.value = false;
  clearDraggedItem();
};

const handleHeaderDragOver = (e) => {
  if (!props.isEditorMode || !props.canEdit || !draggedItem.value) return;

  if (draggedItem.value.type === 'unit') {
    // No permitir soltar sobre la misma unidad
    if (draggedItem.value.unitCode === props.node.codigo) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'move';
    isDragOverUnit.value = true;
  } else if (draggedItem.value.type === 'collaborator') {
    e.dataTransfer.dropEffect = 'move';
    isDragOverUnit.value = true;
  }
};

const handleHeaderDragEnter = (e) => {
  if (!props.isEditorMode || !props.canEdit || !draggedItem.value) return;
  if (draggedItem.value.type === 'unit' && draggedItem.value.unitCode !== props.node.codigo) {
    isDragOverUnit.value = true;
  } else if (draggedItem.value.type === 'collaborator') {
    isDragOverUnit.value = true;
  }
};

const handleHeaderDragLeave = (e) => {
  // Evitar parpadeo si el cursor se mueve entre elementos hijos de la cabecera
  if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
    return;
  }
  isDragOverUnit.value = false;
};

const handleHeaderDrop = (e) => {
  isDragOverUnit.value = false;
  if (!props.isEditorMode || !props.canEdit || !draggedItem.value) return;

  if (draggedItem.value.type === 'unit') {
    if (draggedItem.value.unitCode === props.node.codigo) return;
    emit('move-unit', {
      unitCode: draggedItem.value.unitCode,
      targetParentCode: props.node.codigo,
    });
    clearDraggedItem();
  } else if (draggedItem.value.type === 'collaborator') {
    // Si se suelta sobre la cabecera de la unidad, se asigna como subordinado por defecto
    emit('move-collaborator', {
      colab: draggedItem.value.colab,
      sourceUnitCode: draggedItem.value.sourceUnitCode,
      targetUnitCode: props.node.codigo,
      asJefe: false,
    });
    clearDraggedItem();
  }
};

// ===========================================================================
// DRAG AND DROP: MANEJO DE COLABORADORES
// ===========================================================================
const handleColabDragStart = (e, colab, isJefe) => {
  if (!props.isEditorMode || !props.canEdit) return;
  isDraggingColabId.value = colab.persona_id || colab.cui_dpi;
  e.dataTransfer.effectAllowed = 'move';
  const payload = {
    type: 'collaborator',
    colab,
    sourceUnitCode: props.node.codigo,
    isJefe,
  };
  e.dataTransfer.setData('application/json', JSON.stringify(payload));
  e.dataTransfer.setData('text/plain', colab.persona_id || colab.cui_dpi);
  setDraggedItem(payload);
};

const handleColabDragEnd = () => {
  isDraggingColabId.value = null;
  clearDraggedItem();
};

const handleJefaturaDragOver = (e) => {
  if (!props.isEditorMode || !props.canEdit || draggedItem.value?.type !== 'collaborator') return;
  e.dataTransfer.dropEffect = 'move';
  isDragOverJefatura.value = true;
};

const handleJefaturaDrop = (e) => {
  isDragOverJefatura.value = false;
  if (!props.isEditorMode || !props.canEdit || draggedItem.value?.type !== 'collaborator') return;
  emit('move-collaborator', {
    colab: draggedItem.value.colab,
    sourceUnitCode: draggedItem.value.sourceUnitCode,
    targetUnitCode: props.node.codigo,
    asJefe: true,
  });
  clearDraggedItem();
};

const handleSubordinadosDragOver = (e) => {
  if (!props.isEditorMode || !props.canEdit || draggedItem.value?.type !== 'collaborator') return;
  e.dataTransfer.dropEffect = 'move';
  isDragOverSubordinados.value = true;
};

const handleSubordinadosDrop = (e) => {
  isDragOverSubordinados.value = false;
  if (!props.isEditorMode || !props.canEdit || draggedItem.value?.type !== 'collaborator') return;
  emit('move-collaborator', {
    colab: draggedItem.value.colab,
    sourceUnitCode: draggedItem.value.sourceUnitCode,
    targetUnitCode: props.node.codigo,
    asJefe: false,
  });
  clearDraggedItem();
};

const handleEmptyDragOver = (e) => {
  if (!props.isEditorMode || !props.canEdit || draggedItem.value?.type !== 'collaborator') return;
  e.dataTransfer.dropEffect = 'move';
  isDragOverEmpty.value = true;
};

const handleEmptyDrop = (e) => {
  isDragOverEmpty.value = false;
  if (!props.isEditorMode || !props.canEdit || draggedItem.value?.type !== 'collaborator') return;
  emit('move-collaborator', {
    colab: draggedItem.value.colab,
    sourceUnitCode: draggedItem.value.sourceUnitCode,
    targetUnitCode: props.node.codigo,
    asJefe: false,
  });
  clearDraggedItem();
};
</script>

<style scoped>
.organigram-node {
  border-left: 4px solid var(--color-primary-500, #3b82f6);
  background: var(--bg-card, #ffffff);
  transition: all 0.2s ease;
  position: relative;
}

.organigram-node--root {
  border-left: 5px solid var(--color-primary-800, #1e3a8a);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1));
}

.organigram-node--editable {
  border-left-color: var(--color-gold-500, #d4af37);
  box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.2);
}

.organigram-node--dragging {
  opacity: 0.45;
  border-style: dashed;
}

.organigram-node--drag-over {
  border: 2px dashed #10b981 !important;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15) !important;
  background-color: #f0fdf4 !important;
}

.node-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.node-header:hover {
  background: var(--bg-hover, #f8fafc);
}

.node-header--drop-target {
  background-color: #ecfdf5 !important;
  border-radius: var(--radius-sm, 6px);
}

.node-drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: #94a3b8;
  padding: 0.15rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.node-drag-handle:hover {
  color: #0b2545;
  background: #e2e8f0;
}

.node-drag-handle:active {
  cursor: grabbing;
}

.btn-toggle-tree {
  background: transparent;
  border: none;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
}

.btn-toggle-tree:hover {
  color: var(--color-primary-900, #0b2545);
}

.node-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-primary-900, #0f172a);
}

/* Acciones en la Cabecera de Nodo */
.node-editor-actions {
  background: var(--bg-subtle, #f1f5f9);
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--border-light, #e2e8f0);
}

.btn-node-act {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm, 4px);
  border: 1px solid transparent;
  background: #ffffff;
  color: var(--text-main, #1e293b);
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1.2;
}

.btn-node-act:hover {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}

.btn-node-act--colab {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.btn-node-act--colab:hover {
  background: #d1fae5;
}

.btn-node-act--sub {
  background: #eff6ff;
  color: #1e40af;
  border-color: #bfdbfe;
}

.btn-node-act--sub:hover {
  background: #dbeafe;
}

.btn-node-act--edit {
  background: #f8fafc;
  color: #475569;
  border-color: #cbd5e1;
}

.btn-node-act--edit:hover {
  background: #e2e8f0;
}

.btn-node-act--del {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.btn-node-act--del:hover {
  background: #fee2e2;
}

.colabs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.colab-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: var(--bg-subtle, #f1f5f9);
  border: 1px solid var(--border-light, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  position: relative;
}

.colab-card--jefe {
  background: #fefce8;
  border: 2px solid #f59e0b;
}

.colab-card--dragging {
  opacity: 0.4;
  transform: scale(0.98);
}

.colab-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary-400, #60a5fa);
}

.colab-drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: #94a3b8;
  padding: 0.1rem;
  border-radius: 3px;
  transition: color 0.15s ease;
}

.colab-drag-handle:hover {
  color: #0b2545;
  background: rgba(0,0,0,0.05);
}

.colab-drag-handle:active {
  cursor: grabbing;
}

.colab-avatar-mini {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-primary-700, #1d4ed8);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.colab-avatar--jefe {
  background: #d97706;
}

.colab-name {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--text-main, #1e293b);
}

.colab-puesto {
  color: var(--color-primary-800, #1e40af);
}

/* Acciones en la Tarjeta de Colaborador */
.colab-actions {
  margin-left: 0.25rem;
}

.btn-colab-tool {
  border: 1px solid var(--border-light, #cbd5e1);
  background: #ffffff;
  border-radius: 4px;
  font-size: 0.75rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-colab-tool:hover {
  background: #f1f5f9;
  border-color: var(--color-primary-400, #60a5fa);
}

.btn-colab-tool--del {
  color: #ef4444;
}

.btn-colab-tool--del:hover {
  background: #fee2e2;
  border-color: #f87171;
}

/* Zonas de Drop para Colaboradores */
.level-dropzone--active {
  border: 2px dashed #f59e0b !important;
  background-color: #fffbeb !important;
  border-radius: var(--radius-md, 8px);
  padding: 0.5rem;
  transition: all 0.2s ease;
}

.dropzone-active {
  border: 2px dashed #10b981 !important;
  background-color: #ecfdf5 !important;
}

.colab-drop-placeholder {
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
}

.subunits-tree {
  border-left: 2px dashed var(--border-light, #cbd5e1);
  margin-left: 0.5rem;
}

@media print {
  .btn-toggle-tree,
  .node-editor-actions,
  .colab-actions,
  .node-drag-handle,
  .colab-drag-handle {
    display: none !important;
  }
  .organigram-node {
    border: 1px solid #94a3b8 !important;
    page-break-inside: avoid;
    margin-bottom: 1rem !important;
  }
  .colab-card {
    border: 1px solid #cbd5e1 !important;
    background: #ffffff !important;
  }
}
</style>
