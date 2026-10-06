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
            <label class="form-group__label">Buscar Colaborador en el Directorio Institucional (Nombre, Apellido o CUI):</label>
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

            <!-- AUTOCOMPLETE DEL PUESTO DESDE EL CATÁLOGO OFICIAL -->
            <div class="form-group mt-3 mb-0" ref="puestoAutocompleteRef">
              <label class="form-group__label text-xs d-flex justify-between align-center">
                <span>Puesto Funcional / Cargo en esta área (Catálogo Oficial):</span>
                <span v-if="customPuesto" class="badge badge--success text-xxs">✓ Puesto Asignado</span>
              </label>

              <div class="autocomplete-wrapper position-relative">
                <div class="search-input-wrapper">
                  <input
                    v-model="puestoSearchQuery"
                    type="text"
                    class="form-control form-control--sm pr-5"
                    placeholder="Escribe para buscar puesto en el catálogo... (ej. Director, Analista, Asesor)"
                    @focus="isPuestoDropdownOpen = true"
                    @input="handlePuestoInput"
                    @keydown="handlePuestoKeydown"
                    @keydown.esc="isPuestoDropdownOpen = false"
                  />
                  <div class="input-actions d-flex align-center gap-1">
                    <span v-if="puestoSearchQuery" class="clear-icon" @click="clearPuestoSelection" title="Limpiar selección">✕</span>
                    <span class="dropdown-chevron cursor-pointer" @click.stop="isPuestoDropdownOpen = !isPuestoDropdownOpen">▾</span>
                  </div>
                </div>

                <div v-if="!customPuestoId && puestoSearchQuery" class="text-xs text-warning mt-1">
                  ⚠️ Selecciona un puesto oficial del menú desplegable del catálogo (no texto libre).
                </div>

                <!-- Dropdown de resultados filtrados del catálogo -->
                <div v-if="isPuestoDropdownOpen" class="autocomplete-dropdown shadow-lg border rounded">
                  <div class="dropdown-header p-2 bg-subtle border-bottom d-flex justify-between align-center text-xs text-muted">
                    <span>Catálogo Oficial de Puestos SCSPR</span>
                    <span>{{ filteredPuestos.length }} opciones</span>
                  </div>

                  <div v-if="loadingPuestos" class="p-3 text-center text-xs text-muted">
                    Cargando catálogo oficial de puestos...
                  </div>
                  <div v-else-if="!filteredPuestos.length" class="p-3 text-center text-xs text-muted">
                    No se encontraron puestos que coincidan con "{{ puestoSearchQuery }}".
                  </div>
                  <div v-else class="dropdown-list">
                    <div
                      v-for="p in filteredPuestos"
                      :key="p.id || p.codigo"
                      class="dropdown-item p-2 d-flex justify-between align-center cursor-pointer"
                      :class="{ 'dropdown-item--selected': customPuesto === p.nombre }"
                      @click="selectPuestoOption(p)"
                    >
                      <div>
                        <div class="dropdown-item-title text-sm font-bold">
                          {{ p.nombre }}
                        </div>
                        <div class="dropdown-item-code text-xs text-muted font-mono">
                          {{ p.codigo }}
                        </div>
                      </div>
                      <span v-if="customPuesto === p.nombre" class="text-xs text-success font-bold">✓ Seleccionado</span>
                    </div>
                  </div>
                </div>
              </div>
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

          <!-- AUTOCOMPLETE DE PUESTO DEL CATÁLOGO PARA INGRESO MANUAL -->
          <div class="form-group mb-2" ref="manualPuestoAutocompleteRef">
            <label class="form-group__label d-flex justify-between align-center">
              <span>Puesto Funcional / Cargo * (Catálogo Oficial):</span>
              <span v-if="manualForm.puesto_funcional" class="badge badge--success text-xxs">✓ Seleccionado</span>
            </label>
            <div class="autocomplete-wrapper position-relative">
              <div class="search-input-wrapper">
                <input
                  v-model="manualPuestoSearchQuery"
                  type="text"
                  class="form-control pr-5"
                  placeholder="Buscar y seleccionar puesto del catálogo... (ej. Analista, Asesor, Jefe)"
                  required
                  @focus="isManualPuestoDropdownOpen = true"
                  @input="handleManualPuestoInput"
                  @keydown="handleManualPuestoKeydown"
                  @keydown.esc="isManualPuestoDropdownOpen = false"
                />
                <div class="input-actions d-flex align-center gap-1">
                  <span v-if="manualPuestoSearchQuery" class="clear-icon" @click="clearManualPuestoSelection" title="Limpiar">✕</span>
                  <span class="dropdown-chevron cursor-pointer" @click.stop="isManualPuestoDropdownOpen = !isManualPuestoDropdownOpen">▾</span>
                </div>
              </div>

              <div v-if="!manualForm.puesto_funcional_id && manualPuestoSearchQuery" class="text-xs text-warning mt-1">
                ⚠️ Selecciona un puesto oficial del menú desplegable del catálogo (no texto libre).
              </div>

              <div v-if="isManualPuestoDropdownOpen" class="autocomplete-dropdown shadow-lg border rounded">
                <div class="dropdown-header p-2 bg-subtle border-bottom d-flex justify-between align-center text-xs text-muted">
                  <span>Catálogo Oficial de Puestos SCSPR</span>
                  <span>{{ filteredManualPuestos.length }} opciones</span>
                </div>
                <div v-if="loadingPuestos" class="p-3 text-center text-xs text-muted">
                  Cargando catálogo oficial de puestos...
                </div>
                <div v-else-if="!filteredManualPuestos.length" class="p-3 text-center text-xs text-muted">
                  No se encontraron puestos que coincidan con "{{ manualPuestoSearchQuery }}".
                </div>
                <div v-else class="dropdown-list">
                  <div
                    v-for="p in filteredManualPuestos"
                    :key="p.id || p.codigo"
                    class="dropdown-item p-2 d-flex justify-between align-center cursor-pointer"
                    :class="{ 'dropdown-item--selected': manualForm.puesto_funcional === p.nombre }"
                    @click="selectManualPuestoOption(p)"
                  >
                    <div>
                      <div class="dropdown-item-title text-sm font-bold">
                        {{ p.nombre }}
                      </div>
                      <div class="dropdown-item-code text-xs text-muted font-mono">
                        {{ p.codigo }}
                      </div>
                    </div>
                    <span v-if="manualForm.puesto_funcional === p.nombre" class="text-xs text-success font-bold">✓ Seleccionado</span>
                  </div>
                </div>
              </div>
            </div>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
const customPuestoId = ref(null);
const isJefe = ref(false);

// Catálogo oficial de puestos (puestos_funcionales)
const puestosCatalog = ref([]);
const loadingPuestos = ref(false);

// Estado de autocomplete Modo Catálogo
const puestoSearchQuery = ref('');
const isPuestoDropdownOpen = ref(false);
const puestoAutocompleteRef = ref(null);

// Estado de autocomplete Modo Manual
const manualPuestoSearchQuery = ref('');
const isManualPuestoDropdownOpen = ref(false);
const manualPuestoAutocompleteRef = ref(null);

const manualForm = ref({
  cui_dpi: '',
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  puesto_funcional: '',
  puesto_funcional_id: null,
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

// Cargar catálogo de puestos funcionales oficiales desde la API
const loadPuestosCatalog = async () => {
  if (puestosCatalog.value.length > 0) return;
  loadingPuestos.value = true;
  try {
    const res = await apiClient.get('/catalogs/functional-positions');
    if (res.data?.data) {
      puestosCatalog.value = res.data.data.map(p => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
      })).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  } catch (err) {
    console.error('Error al cargar catálogo de puestos:', err);
  } finally {
    loadingPuestos.value = false;
  }
};

const isJobLeader = (title) => {
  if (!title) return false;
  const pLower = title.toLowerCase();
  return (
    pLower.includes('jefe') ||
    pLower.includes('director') ||
    pLower.includes('secretari') ||
    pLower.includes('subsecretari') ||
    pLower.includes('encargad') ||
    pLower.includes('coordinador')
  );
};

// Filtro reactivo para autocomplete en Modo 1 (Catálogo)
const filteredPuestos = computed(() => {
  const q = puestoSearchQuery.value.trim().toLowerCase();
  if (!q) {
    return puestosCatalog.value.slice(0, 35);
  }
  return puestosCatalog.value.filter(p =>
    p.nombre.toLowerCase().includes(q) || (p.codigo && p.codigo.toLowerCase().includes(q))
  ).slice(0, 35);
});

const selectPuestoOption = (p) => {
  customPuesto.value = p.nombre;
  customPuestoId.value = p.id;
  puestoSearchQuery.value = p.nombre;
  isPuestoDropdownOpen.value = false;
  isJefe.value = isJobLeader(p.nombre);
};

const handlePuestoInput = () => {
  isPuestoDropdownOpen.value = true;
  const exact = puestosCatalog.value.find(
    p => p.nombre.toLowerCase() === puestoSearchQuery.value.trim().toLowerCase()
  );
  if (exact) {
    customPuesto.value = exact.nombre;
    customPuestoId.value = exact.id;
    isJefe.value = isJobLeader(exact.nombre);
  } else {
    customPuesto.value = '';
    customPuestoId.value = null;
  }
};

const handlePuestoKeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (filteredPuestos.value.length > 0) {
      selectPuestoOption(filteredPuestos.value[0]);
    }
  } else if (e.key === 'ArrowDown') {
    isPuestoDropdownOpen.value = true;
  }
};

const clearPuestoSelection = () => {
  customPuesto.value = '';
  customPuestoId.value = null;
  puestoSearchQuery.value = '';
  isPuestoDropdownOpen.value = true;
};

// Filtro reactivo para autocomplete en Modo 2 (Manual)
const filteredManualPuestos = computed(() => {
  const q = manualPuestoSearchQuery.value.trim().toLowerCase();
  if (!q) {
    return puestosCatalog.value.slice(0, 35);
  }
  return puestosCatalog.value.filter(p =>
    p.nombre.toLowerCase().includes(q) || (p.codigo && p.codigo.toLowerCase().includes(q))
  ).slice(0, 35);
});

const selectManualPuestoOption = (p) => {
  manualForm.value.puesto_funcional = p.nombre;
  manualForm.value.puesto_funcional_id = p.id;
  manualPuestoSearchQuery.value = p.nombre;
  isManualPuestoDropdownOpen.value = false;
  isJefe.value = isJobLeader(p.nombre);
};

const handleManualPuestoInput = () => {
  isManualPuestoDropdownOpen.value = true;
  const exact = puestosCatalog.value.find(
    p => p.nombre.toLowerCase() === manualPuestoSearchQuery.value.trim().toLowerCase()
  );
  if (exact) {
    manualForm.value.puesto_funcional = exact.nombre;
    manualForm.value.puesto_funcional_id = exact.id;
    isJefe.value = isJobLeader(exact.nombre);
  } else {
    manualForm.value.puesto_funcional = '';
    manualForm.value.puesto_funcional_id = null;
  }
};

const handleManualPuestoKeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (filteredManualPuestos.value.length > 0) {
      selectManualPuestoOption(filteredManualPuestos.value[0]);
    }
  } else if (e.key === 'ArrowDown') {
    isManualPuestoDropdownOpen.value = true;
  }
};

const clearManualPuestoSelection = () => {
  manualForm.value.puesto_funcional = '';
  manualForm.value.puesto_funcional_id = null;
  manualPuestoSearchQuery.value = '';
  isManualPuestoDropdownOpen.value = true;
};

// Cierre de dropdown al hacer clic fuera
const handleDocumentClick = (e) => {
  if (puestoAutocompleteRef.value && !puestoAutocompleteRef.value.contains(e.target)) {
    isPuestoDropdownOpen.value = false;
  }
  if (manualPuestoAutocompleteRef.value && !manualPuestoAutocompleteRef.value.contains(e.target)) {
    isManualPuestoDropdownOpen.value = false;
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadCatalog();
    loadPuestosCatalog();
    resetForm();
  }
});

const resetForm = () => {
  searchQuery.value = '';
  selectedCatalogItem.value = null;
  customPuesto.value = '';
  customPuestoId.value = null;
  puestoSearchQuery.value = '';
  isPuestoDropdownOpen.value = false;
  manualPuestoSearchQuery.value = '';
  isManualPuestoDropdownOpen.value = false;
  isJefe.value = false;
  manualForm.value = {
    cui_dpi: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    puesto_funcional: '',
    puesto_funcional_id: null,
    renglon_codigo: '011',
  };
};

const selectCatalogItem = (c) => {
  selectedCatalogItem.value = c;
  const initialTitle = c.puesto_funcional || c.puesto_nominal || '';
  
  // Buscar coincidencia en el catálogo oficial de puestos
  const matched = puestosCatalog.value.find(
    p => p.nombre.toLowerCase() === initialTitle.toLowerCase() || (c.puesto_funcional_id && p.id === c.puesto_funcional_id)
  );

  if (matched) {
    customPuesto.value = matched.nombre;
    customPuestoId.value = matched.id;
    puestoSearchQuery.value = matched.nombre;
    isJefe.value = isJobLeader(matched.nombre);
  } else {
    // Si no coincide con el catálogo oficial, pedir seleccionar del catálogo
    customPuesto.value = '';
    customPuestoId.value = null;
    puestoSearchQuery.value = '';
    isPuestoDropdownOpen.value = true;
    isJefe.value = false;
  }
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
    return Boolean(
      selectedCatalogItem.value &&
      customPuesto.value.trim() &&
      customPuestoId.value
    );
  } else {
    return Boolean(
      manualForm.value.primer_nombre.trim() &&
      manualForm.value.primer_apellido.trim() &&
      manualForm.value.puesto_funcional.trim() &&
      manualForm.value.puesto_funcional_id
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
      puesto_funcional: customPuesto.value.trim(),
      puesto_funcional_id: customPuestoId.value || null,
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
      puesto_funcional_id: m.puesto_funcional_id || null,
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
    loadPuestosCatalog();
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleDocumentClick);
  }
});

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleDocumentClick);
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

/* ==========================================================================
   ESTILOS DEL AUTOCOMPLETE DEL CATÁLOGO DE PUESTOS
   ========================================================================== */
.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.pr-5 {
  padding-right: 2.75rem !important;
}

.input-actions {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.clear-icon {
  cursor: pointer;
  padding: 0 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.clear-icon:hover {
  color: var(--color-danger);
}

.dropdown-chevron {
  cursor: pointer;
  padding: 0 4px;
  font-size: 0.85rem;
  color: var(--color-primary-700);
  user-select: none;
}

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #ffffff;
  z-index: 1050;
  max-height: 250px;
  overflow: hidden;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
}

.dropdown-header {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.dropdown-list {
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-item {
  border-bottom: 1px solid var(--border-light);
  transition: background 0.15s ease;
  padding: 0.5rem 0.75rem;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #eff6ff;
}

.dropdown-item--selected {
  background: #f0fdf4;
  border-color: #86efac;
}

.text-xxs {
  font-size: 0.6875rem;
}
</style>
