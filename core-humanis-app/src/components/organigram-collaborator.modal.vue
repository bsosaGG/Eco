<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content modal-content--lg card" role="dialog" aria-modal="true">
      <div class="modal-header d-flex justify-between align-center p-3 border-bottom">
        <div>
          <div class="d-flex align-center gap-2">
            <span class="badge badge--primary">Asignación de Personal</span>
            <span class="text-xs text-muted font-mono" v-if="unit?.codigo">{{ unit.codigo }}</span>
          </div>
          <h3 class="modal-title font-heading mt-1 m-0">
            Asignar Colaborador al Área
          </h3>
          <p class="modal-subtitle text-xs text-muted mt-1 m-0" v-if="unit?.nombre">
            Unidad Destino: <strong class="text-primary">{{ unit.nombre }}</strong>
          </p>
        </div>
        <button type="button" class="btn-close" @click="$emit('close')" aria-label="Cerrar modal">✕</button>
      </div>

      <div class="modal-body p-3">
        <!-- Selector de Modo: Catálogo Existente vs Nuevo Colaborador -->
        <div class="mode-tabs mb-3 d-flex gap-2 p-1 bg-subtle rounded">
          <button
            type="button"
            class="tab-btn flex-1 py-2 px-3 text-sm font-bold rounded"
            :class="{ 'tab-btn--active': mode === 'catalog' }"
            @click="mode = 'catalog'"
          >
            🏢 Seleccionar del Directorio Institucional
          </button>
          <button
            type="button"
            class="tab-btn flex-1 py-2 px-3 text-sm font-bold rounded"
            :class="{ 'tab-btn--active': mode === 'manual' }"
            @click="mode = 'manual'"
          >
            ✍️ Ingresar Colaborador Nuevo / Proyectado
          </button>
        </div>

        <!-- MODO 1: Catálogo Existente -->
        <div v-if="mode === 'catalog'" class="catalog-mode">
          <div class="form-group mb-3">
            <label class="form-group__label">Buscar Colaborador en Base de Datos (Nombre, Apellido o CUI):</label>
            <div class="search-input-wrapper">
              <input
                v-model="searchQuery"
                type="text"
                class="form-control"
                placeholder="Escribe para buscar... Ej. 'Carlos', '298103...', 'Pérez'"
                autofocus
              />
              <span v-if="searchQuery" class="clear-search" @click="searchQuery = ''">✕</span>
            </div>
          </div>

          <!-- Loading indicator -->
          <div v-if="loadingCatalog" class="text-center p-4 text-muted text-sm">
            <div class="spinner mb-2"></div>
            Cargando directorio de colaboradores institucionales...
          </div>

          <!-- Lista de Resultados -->
          <div v-else class="catalog-results-list mb-3">
            <div
              v-for="c in filteredCatalog"
              :key="c.id || c.cui_dpi"
              class="catalog-item p-2 rounded d-flex align-center justify-between gap-2"
              :class="{ 'catalog-item--selected': selectedCatalogItem?.id === c.id }"
              @click="selectCatalogItem(c)"
            >
              <div class="d-flex align-center gap-2">
                <div class="catalog-avatar">
                  {{ c.primer_nombre?.[0] || '?' }}{{ c.primer_apellido?.[0] || '' }}
                </div>
                <div>
                  <div class="catalog-name font-bold text-sm">
                    {{ c.primer_nombre }} {{ c.segundo_nombre || '' }} {{ c.primer_apellido }} {{ c.segundo_apellido || '' }}
                  </div>
                  <div class="catalog-sub text-xs text-muted">
                    <span>CUI: {{ c.cui_dpi }}</span> &bull; 
                    <span class="text-primary">{{ c.puesto_funcional || c.puesto_nominal || 'Puesto Sin Definir' }}</span>
                  </div>
                  <div v-if="c.unidad_nombre" class="text-xs text-light">
                    Unidad actual: {{ c.unidad_nombre }}
                  </div>
                </div>
              </div>
              <div class="selection-indicator">
                <span v-if="selectedCatalogItem?.id === c.id" class="badge badge--success">✓ Seleccionado</span>
                <span v-else class="text-xs text-muted">Elegir</span>
              </div>
            </div>

            <div v-if="!loadingCatalog && !filteredCatalog.length" class="p-3 text-center text-muted text-xs">
              No se encontraron colaboradores que coincidan con la búsqueda.
            </div>
          </div>

          <!-- Colaborador Seleccionado Preview -->
          <div v-if="selectedCatalogItem" class="selected-summary card p-3 mb-3 bg-subtle border">
            <div class="d-flex align-center justify-between mb-2">
              <span class="text-xs font-bold text-uppercase text-success">✓ Colaborador Seleccionado</span>
              <button type="button" class="btn-clear text-xs text-danger" @click="selectedCatalogItem = null">Cambiar</button>
            </div>
            <div class="d-flex align-center gap-3">
              <div class="summary-avatar">
                {{ selectedCatalogItem.primer_nombre?.[0] }}{{ selectedCatalogItem.primer_apellido?.[0] }}
              </div>
              <div>
                <div class="font-bold">
                  {{ selectedCatalogItem.primer_nombre }} {{ selectedCatalogItem.segundo_nombre || '' }} {{ selectedCatalogItem.primer_apellido }} {{ selectedCatalogItem.segundo_apellido || '' }}
                </div>
                <div class="text-xs text-muted">
                  CUI: {{ selectedCatalogItem.cui_dpi }} &bull; Renglón {{ selectedCatalogItem.renglon_codigo || '011' }}
                </div>
              </div>
            </div>

            <div class="form-group mt-3 mb-0">
              <label class="form-group__label text-xs">Puesto Funcional / Cargo en esta área:</label>
              <input
                v-model="customPuesto"
                type="text"
                class="form-control form-control--sm"
                placeholder="Puesto funcional en el organigrama"
              />
            </div>
          </div>
        </div>

        <!-- MODO 2: Ingreso Manual / Personalizado -->
        <div v-if="mode === 'manual'" class="manual-mode">
          <div class="grid-2 mb-2">
            <div class="form-group mb-2">
              <label class="form-group__label">CUI / Identificador:</label>
              <input
                v-model="manualForm.cui_dpi"
                type="text"
                class="form-control"
                placeholder="Ej. 2981034560101"
              />
            </div>
            <div class="form-group mb-2">
              <label class="form-group__label">Renglón Presupuestario:</label>
              <select v-model="manualForm.renglon_codigo" class="form-control">
                <option value="011">011 - Personal Permanente</option>
                <option value="022">022 - Personal por Contrato</option>
                <option value="029">029 - Servicios Técnicos / Profesionales</option>
                <option value="031">031 - Jornales</option>
                <option value="189">189 - Otros Servicios</option>
                <option value="-">Otro / No Aplica</option>
              </select>
            </div>
          </div>

          <div class="grid-2 mb-2">
            <div class="form-group mb-2">
              <label class="form-group__label">Primer Nombre *:</label>
              <input
                v-model="manualForm.primer_nombre"
                type="text"
                class="form-control"
                placeholder="Ej. Ana"
                required
              />
            </div>
            <div class="form-group mb-2">
              <label class="form-group__label">Segundo Nombre:</label>
              <input
                v-model="manualForm.segundo_nombre"
                type="text"
                class="form-control"
                placeholder="Ej. María"
              />
            </div>
          </div>

          <div class="grid-2 mb-2">
            <div class="form-group mb-2">
              <label class="form-group__label">Primer Apellido *:</label>
              <input
                v-model="manualForm.primer_apellido"
                type="text"
                class="form-control"
                placeholder="Ej. Gómez"
                required
              />
            </div>
            <div class="form-group mb-2">
              <label class="form-group__label">Segundo Apellido:</label>
              <input
                v-model="manualForm.segundo_apellido"
                type="text"
                class="form-control"
                placeholder="Ej. Morales"
              />
            </div>
          </div>

          <div class="form-group mb-2">
            <label class="form-group__label">Puesto Funcional / Cargo *:</label>
            <input
              v-model="manualForm.puesto_funcional"
              type="text"
              class="form-control"
              placeholder="Ej. Jefe de Sección, Analista Financiero, Asistente..."
              required
            />
          </div>
        </div>

        <!-- NIVEL JERÁRQUICO EN EL ÁREA -->
        <div class="role-selector mt-3 p-3 border rounded bg-card">
          <label class="form-group__label font-bold text-sm mb-2 d-block">
            Nivel Jerárquico en la Estructura de esta Área:
          </label>
          <div class="d-flex gap-3 flex-wrap">
            <label class="radio-card flex-1 p-2 border rounded d-flex align-center gap-2 cursor-pointer" :class="{ 'radio-card--active': isJefe }">
              <input type="radio" :value="true" v-model="isJefe" name="hierarchicalRole" />
              <div>
                <div class="font-bold text-sm d-flex align-center gap-1">
                  👑 Jefatura / Dirección (Nivel 1)
                </div>
                <div class="text-xs text-muted">
                  Director, Jefe de Departamento, Encargado titular.
                </div>
              </div>
            </label>

            <label class="radio-card flex-1 p-2 border rounded d-flex align-center gap-2 cursor-pointer" :class="{ 'radio-card--active': !isJefe }">
              <input type="radio" :value="false" v-model="isJefe" name="hierarchicalRole" />
              <div>
                <div class="font-bold text-sm d-flex align-center gap-1">
                  👥 Equipo Técnico / Subordinado (Nivel 2)
                </div>
                <div class="text-xs text-muted">
                  Profesional, Asistente, Técnico o Personal operativo.
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer d-flex justify-between align-center p-3 border-top">
        <button type="button" class="btn btn--secondary" @click="$emit('close')">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn--primary"
          :disabled="!isValid"
          @click="submitAssignment"
        >
          ✓ Confirmar Asignación
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import apiClient from '../api/client';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  unit: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'save']);

const mode = ref('catalog'); // 'catalog' | 'manual'
const searchQuery = ref('');
const catalogList = ref([]);
const loadingCatalog = ref(false);
const selectedCatalogItem = ref(null);
const customPuesto = ref('');
const isJefe = ref(false);

const manualForm = ref({
  cui_dpi: '',
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  puesto_funcional: '',
  renglon_codigo: '011',
});

// Cargar catálogo de colaboradores
const loadCatalog = async () => {
  if (catalogList.value.length > 0) return;
  loadingCatalog.value = true;
  try {
    const res = await apiClient.get('/collaborators?limit=300');
    if (res.data?.data) {
      catalogList.value = res.data.data;
    }
  } catch (err) {
    console.error('Error al cargar catálogo de colaboradores:', err);
  } finally {
    loadingCatalog.value = false;
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadCatalog();
    resetForm();
  }
});

const resetForm = () => {
  searchQuery.value = '';
  selectedCatalogItem.value = null;
  customPuesto.value = '';
  isJefe.value = false;
  manualForm.value = {
    cui_dpi: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    puesto_funcional: '',
    renglon_codigo: '011',
  };
};

const selectCatalogItem = (c) => {
  selectedCatalogItem.value = c;
  customPuesto.value = c.puesto_funcional || c.puesto_nominal || 'Colaborador';
  
  // Sugerir rol de jefatura automáticamente si el puesto incluye jefe/director
  const pLower = (customPuesto.value || '').toLowerCase();
  isJefe.value = pLower.includes('jefe') || pLower.includes('director') || 
                 pLower.includes('secretari') || pLower.includes('encargad');
};

const filteredCatalog = computed(() => {
  if (!searchQuery.value.trim()) {
    return catalogList.value.slice(0, 15);
  }
  const q = searchQuery.value.trim().toLowerCase();
  return catalogList.value.filter(c => {
    const fullName = `${c.primer_nombre || ''} ${c.segundo_nombre || ''} ${c.primer_apellido || ''} ${c.segundo_apellido || ''}`.toLowerCase();
    const cui = (c.cui_dpi || '').toLowerCase();
    const puesto = (c.puesto_funcional || c.puesto_nominal || '').toLowerCase();
    return fullName.includes(q) || cui.includes(q) || puesto.includes(q);
  }).slice(0, 20);
});

const isValid = computed(() => {
  if (mode.value === 'catalog') {
    return Boolean(selectedCatalogItem.value);
  } else {
    return Boolean(
      manualForm.value.primer_nombre.trim() &&
      manualForm.value.primer_apellido.trim() &&
      manualForm.value.puesto_funcional.trim()
    );
  }
});

const submitAssignment = () => {
  if (!isValid.value) return;

  let colabData = null;

  if (mode.value === 'catalog') {
    const c = selectedCatalogItem.value;
    colabData = {
      persona_id: c.persona_id || c.id || c.cui_dpi,
      cui_dpi: c.cui_dpi || '-',
      primer_nombre: c.primer_nombre,
      segundo_nombre: c.segundo_nombre || '',
      primer_apellido: c.primer_apellido,
      segundo_apellido: c.segundo_apellido || '',
      puesto_funcional: customPuesto.value || c.puesto_funcional || c.puesto_nominal || 'Colaborador',
      puesto_nominal: c.puesto_nominal || '',
      renglon_codigo: c.renglon_codigo || '011',
      is_jefe: isJefe.value,
    };
  } else {
    const m = manualForm.value;
    colabData = {
      persona_id: m.cui_dpi || `colab_${Date.now()}`,
      cui_dpi: m.cui_dpi || 'N/A',
      primer_nombre: m.primer_nombre.trim(),
      segundo_nombre: m.segundo_nombre.trim(),
      primer_apellido: m.primer_apellido.trim(),
      segundo_apellido: m.segundo_apellido.trim(),
      puesto_funcional: m.puesto_funcional.trim(),
      puesto_nominal: m.puesto_funcional.trim(),
      renglon_codigo: m.renglon_codigo || '011',
      is_jefe: isJefe.value,
    };
  }

  emit('save', {
    unit: props.unit,
    colab: colabData,
  });
  emit('close');
};

onMounted(() => {
  if (props.show) {
    loadCatalog();
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content--lg {
  max-width: 680px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
}

.modal-body {
  overflow-y: auto;
}

.btn-close {
  font-size: 1.25rem;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.btn-close:hover {
  background: var(--bg-subtle);
  color: var(--text-main);
}

.mode-tabs {
  background: var(--bg-subtle);
}

.tab-btn {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn--active {
  background: #ffffff;
  color: var(--color-primary-800);
  box-shadow: var(--shadow-sm);
}

.search-input-wrapper {
  position: relative;
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.catalog-results-list {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.catalog-item {
  cursor: pointer;
  border-bottom: 1px solid var(--border-light);
  transition: background 0.15s ease;
}

.catalog-item:last-child {
  border-bottom: none;
}

.catalog-item:hover {
  background: var(--bg-subtle);
}

.catalog-item--selected {
  background: #eff6ff;
  border-color: #93c5fd;
}

.catalog-avatar, .summary-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary-700);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8125rem;
}

.summary-avatar {
  background: var(--color-success);
}

.selected-summary {
  background: #f0fdf4;
  border-color: #86efac;
}

.btn-clear {
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.radio-card {
  border: 1px solid var(--border-light);
  transition: all 0.15s ease;
}

.radio-card--active {
  border-color: var(--color-primary-600);
  background: #eff6ff;
}

.cursor-pointer {
  cursor: pointer;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-light);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
