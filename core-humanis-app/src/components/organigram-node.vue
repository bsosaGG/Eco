<template>
  <div class="organigram-node card mb-3" :class="{ 'organigram-node--root': !node.dependencia_padre_id }">
    <!-- Cabecera del Nodo de Unidad -->
    <div class="node-header d-flex justify-between align-center p-3" @click="toggleOpen">
      <div class="d-flex align-center gap-2">
        <button type="button" class="btn-toggle-tree" @click.stop="toggleOpen">
          {{ isOpen ? '▼' : '▶' }}
        </button>

        <div>
          <div class="d-flex align-center gap-2">
            <span class="badge badge--info font-mono">{{ node.codigo }}</span>
            <h3 class="node-title m-0">{{ node.nombre }}</h3>
          </div>
          <p v-if="node.padre_nombre" class="text-xs text-muted mt-1 m-0">
            Depende de: <strong>{{ node.padre_nombre }}</strong>
          </p>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <span class="badge" :class="node.colaboradores.length ? 'badge--success' : 'badge--secondary'">
          👥 {{ node.colaboradores.length }} Colaboradores
        </span>
        <span v-if="node.subunidades.length" class="badge badge--neutral">
          🏢 {{ node.subunidades.length }} Subunidades
        </span>
      </div>
    </div>

    <!-- Contenido Plegable (Colaboradores y Subunidades) -->
    <div v-show="isOpen" class="node-body p-3 pt-0">
      <!-- Sección: Personal Asignado a la Unidad -->
      <div class="colabs-section mt-2">
        <h4 class="text-xs font-bold text-uppercase text-muted mb-2">Personal Asignado en Plantilla:</h4>

        <div v-if="!node.colaboradores.length" class="text-xs text-muted italic p-2 bg-subtle rounded">
          Sin personal directo asignado a esta unidad.
        </div>

        <div v-else class="colabs-grid">
          <div
            v-for="c in node.colaboradores"
            :key="c.persona_id"
            class="colab-card"
            @click="$emit('select-colaborador', c.persona_id)"
          >
            <div class="colab-avatar-mini">
              {{ c.primer_nombre[0] }}{{ c.primer_apellido[0] }}
            </div>
            <div class="colab-info flex-1">
              <div class="colab-name">
                {{ c.primer_nombre }} {{ c.segundo_nombre || '' }} {{ c.primer_apellido }} {{ c.segundo_apellido || '' }}
              </div>
              <div class="colab-puesto text-xs">
                <strong>{{ c.puesto_funcional || c.puesto_nominal || 'Puesto Sin Nombre' }}</strong>
              </div>
              <div class="colab-renglon text-xs text-muted">
                Renglón {{ c.renglon_codigo || '011' }} &bull; CUI: {{ c.cui_dpi }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección: Subunidades Dependientes (Recursivo) -->
      <div v-if="node.subunidades.length" class="subunits-section mt-3 pt-3 border-top">
        <h4 class="text-xs font-bold text-uppercase text-muted mb-2">Subunidades Jerárquicas Dependientes:</h4>
        <div class="subunits-tree pl-3">
          <OrganigramNode
            v-for="sub in node.subunidades"
            :key="sub.id"
            :node="sub"
            :all-expanded="allExpanded"
            @select-colaborador="$emit('select-colaborador', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  allExpanded: {
    type: Boolean,
    default: true,
  },
});

defineEmits(['select-colaborador']);

const isOpen = ref(props.allExpanded);

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

.colab-name {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--text-main, #1e293b);
}

.colab-puesto {
  color: var(--color-primary-800, #1e40af);
}

.subunits-tree {
  border-left: 2px dashed var(--border-light, #cbd5e1);
  margin-left: 0.5rem;
}
</style>
