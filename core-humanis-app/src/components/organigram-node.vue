<template>
  <div
    class="organigram-node card mb-3"
    :class="{
      'organigram-node--root': !node.dependencia_padre_id && !node.padre_id,
      'organigram-node--editable': isEditorMode && canEdit,
    }"
  >
    <!-- Cabecera del Nodo de Unidad -->
    <div class="node-header d-flex justify-between align-center p-3" @click="toggleOpen">
      <div class="d-flex align-center gap-2">
        <button type="button" class="btn-toggle-tree" @click.stop="toggleOpen" :aria-label="isOpen ? 'Colapsar unidad' : 'Expandir unidad'">
          {{ isOpen ? '▼' : '▶' }}
        </button>

        <div>
          <div class="d-flex align-center gap-2 flex-wrap">
            <span class="badge badge--info font-mono">{{ node.codigo }}</span>
            <h3 class="node-title m-0">{{ node.nombre }}</h3>
            <span v-if="isEditorMode && canEdit" class="badge badge--warning text-xs">
              ✏️ Editable
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
            class="btn-node-act btn-node-act--colab"
            title="Asignar Colaborador al Área"
            @click.stop="$emit('assign-colaborador', node)"
          >
            👤+ Personal
          </button>
          <button
            type="button"
            class="btn-node-act btn-node-act--sub"
            title="Agregar Subunidad Dependiente"
            @click.stop="$emit('add-subunit', node)"
          >
            ➕ Subárea
          </button>
          <button
            type="button"
            class="btn-node-act btn-node-act--edit"
            title="Editar Código o Nombre del Área"
            @click.stop="$emit('edit-unit', node)"
          >
            ✏️
          </button>
          <button
            type="button"
            class="btn-node-act btn-node-act--del"
            title="Eliminar esta Área del Organigrama"
            @click.stop="$emit('delete-unit', node)"
          >
            🗑️
          </button>
        </div>

        <span class="badge" :class="totalColaboradores ? 'badge--success' : 'badge--secondary'">
          👥 {{ totalColaboradores }} Colaboradores
        </span>
        <span v-if="node.subunidades && node.subunidades.length" class="badge badge--neutral">
          🏢 {{ node.subunidades.length }} Subunidades
        </span>
      </div>
    </div>

    <!-- Contenido Plegable (Colaboradores y Subunidades) -->
    <div v-show="isOpen" class="node-body p-3 pt-0">
      <!-- Sección: Personal Asignado a la Unidad (Jerarquía Jefe vs Subordinados) -->
      <div class="colabs-section mt-2">
        <div v-if="!totalColaboradores" class="empty-colabs p-2 bg-subtle rounded d-flex align-center justify-between">
          <span class="text-xs text-muted italic">Sin personal directo asignado a esta unidad.</span>
          <button
            v-if="isEditorMode && canEdit"
            type="button"
            class="btn btn--secondary btn--xs"
            @click.stop="$emit('assign-colaborador', node)"
          >
            👤 Asignar colaborador
          </button>
        </div>

        <div v-else class="hierarchy-container">
          <!-- NIVEL 1: JEFATURA / DIRECCIÓN / ENCARGADO -->
          <div v-if="node.jefes && node.jefes.length" class="level-jefatura mb-3">
            <h4 class="text-xs font-bold text-uppercase text-primary mb-2 d-flex align-center gap-1">
              👑 Jefatura / Dirección de Unidad (Nivel 1):
            </h4>
            <div class="colabs-grid">
              <div
                v-for="c in node.jefes"
                :key="c.persona_id || c.cui_dpi"
                class="colab-card colab-card--jefe"
                @click="$emit('select-colaborador', c.persona_id)"
              >
                <div class="colab-avatar-mini colab-avatar--jefe">
                  {{ c.primer_nombre?.[0] || '?' }}{{ c.primer_apellido?.[0] || '' }}
                </div>
                <div class="colab-info flex-1">
                  <div class="d-flex align-center justify-between">
                    <div class="colab-name text-bold">
                      {{ c.primer_nombre }} {{ c.segundo_nombre || '' }} {{ c.primer_apellido }} {{ c.segundo_apellido || '' }}
                    </div>
                    <span class="badge badge--warning text-xs">Jefe / Director</span>
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
                    ⬇️
                  </button>
                  <button
                    type="button"
                    class="btn-colab-tool btn-colab-tool--del"
                    title="Quitar colaborador de esta área"
                    @click.stop="$emit('remove-colaborador', { node, colab: c, isJefe: true })"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- NIVEL 2: EQUIPO TÉCNICO & SUBORDINADOS -->
          <div v-if="node.subordinados && node.subordinados.length" class="level-subordinados">
            <h4 class="text-xs font-bold text-uppercase text-muted mb-2">
              👥 Equipo Técnico & Subordinados Directos (Nivel 2):
            </h4>
            <div class="colabs-grid">
              <div
                v-for="c in node.subordinados"
                :key="c.persona_id || c.cui_dpi"
                class="colab-card"
                @click="$emit('select-colaborador', c.persona_id)"
              >
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
                    👑
                  </button>
                  <button
                    type="button"
                    class="btn-colab-tool btn-colab-tool--del"
                    title="Quitar colaborador de esta área"
                    @click.stop="$emit('remove-colaborador', { node, colab: c, isJefe: false })"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección: Subunidades Dependientes (Recursivo) -->
      <div v-if="node.subunidades && node.subunidades.length" class="subunits-section mt-3 pt-3 border-top">
        <h4 class="text-xs font-bold text-uppercase text-muted mb-2">Subunidades Jerárquicas Dependientes:</h4>
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
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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

defineEmits([
  'select-colaborador',
  'assign-colaborador',
  'add-subunit',
  'edit-unit',
  'delete-unit',
  'remove-colaborador',
  'toggle-colab-role',
]);

const isOpen = ref(props.allExpanded);

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
</script>

<style scoped>
.organigram-node {
  border-left: 4px solid var(--color-primary-500, #3b82f6);
  background: var(--bg-card, #ffffff);
  transition: all 0.2s ease;
}

.organigram-node--root {
  border-left: 5px solid var(--color-primary-800, #1e3a8a);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1));
}

.organigram-node--editable {
  border-left-color: var(--color-gold-500, #d4af37);
  box-shadow: 0 0 0 1px rgba(212, 175, 55, 0.2);
}

.node-header {
  cursor: pointer;
  user-select: none;
}

.node-header:hover {
  background: var(--bg-hover, #f8fafc);
}

.btn-toggle-tree {
  background: transparent;
  border: none;
  font-size: 0.8125rem;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  position: relative;
}

.colab-card--jefe {
  background: #fefce8;
  border: 2px solid #f59e0b;
}

.colab-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary-400, #60a5fa);
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
  width: 22px;
  height: 22px;
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
  font-weight: bold;
}

.btn-colab-tool--del:hover {
  background: #fee2e2;
  border-color: #f87171;
}

.subunits-tree {
  border-left: 2px dashed var(--border-light, #cbd5e1);
  margin-left: 0.5rem;
}

@media print {
  .btn-toggle-tree,
  .node-editor-actions,
  .colab-actions {
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
