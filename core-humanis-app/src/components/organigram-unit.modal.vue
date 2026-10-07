<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content modal-content--md card" role="dialog" aria-modal="true">
      <div class="modal-header d-flex justify-between align-center p-3 border-bottom">
        <div>
          <span class="badge" :class="isEdit ? 'badge--info' : 'badge--primary'">
            {{ isEdit ? 'Edición de Estructura' : 'Nueva Unidad' }}
          </span>
          <h3 class="modal-title font-heading mt-1 m-0">
            {{ isEdit ? 'Editar Unidad Administrativa' : (parentUnit ? 'Agregar Subunidad Jerárquica' : 'Nueva Unidad Administrativa (Raíz)') }}
          </h3>
          <p class="modal-subtitle text-xs text-muted mt-1 m-0">
            {{ isEdit ? 'Modifica los datos identificadores o la dependencia del área.' : 'Define el código identificador y su posición en el organigrama.' }}
          </p>
        </div>
        <button type="button" class="btn-close d-inline-flex align-center justify-center" @click="$emit('close')" aria-label="Cerrar modal">
          <span class="material-symbols-outlined material-symbols-outlined--sm">close</span>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body p-3">
        <div class="form-group mb-3">
          <label class="form-group__label font-bold text-sm">
            Código Identificador de Unidad *:
          </label>
          <input
            v-model="form.codigo"
            type="text"
            class="form-control font-mono"
            placeholder="Ej. DIR_RRHH, DEP_COMPRAS, SEC_GEN"
            required
            autofocus
          />
          <span class="text-xs text-muted">
            Identificador corto único sin espacios (ej. DIR_PLAN, DEP_CONT).
          </span>
        </div>

        <div class="form-group mb-3">
          <label class="form-group__label font-bold text-sm">
            Nombre Oficial de la Unidad / Área *:
          </label>
          <input
            v-model="form.nombre"
            type="text"
            class="form-control"
            placeholder="Ej. Dirección de Recursos Humanos, Despacho Superior..."
            required
          />
        </div>

        <div class="form-group mb-3">
          <label class="form-group__label font-bold text-sm">
            Dependencia Jerárquica (Unidad Padre Superior):
          </label>
          <select v-model="form.padre_id" class="form-control">
            <option :value="null">Ninguna (Unidad Raíz Principal / Máxima Jerarquía)</option>
            <option
              v-for="u in availableParents"
              :key="u.codigo || u.id"
              :value="u.codigo || u.id"
            >
              {{ u.codigo }} - {{ u.nombre }}
            </option>
          </select>
          <span class="text-xs text-muted">
            Selecciona el área de la cual depende jerárquicamente esta unidad en el organigrama.
          </span>
        </div>

        <div class="modal-footer d-flex justify-between align-center pt-3 border-top mt-3">
          <button type="button" class="btn btn--secondary" @click="$emit('close')">
            Cancelar
          </button>
          <button
            type="submit"
            class="btn btn--primary d-inline-flex align-center gap-1"
            :disabled="!isValid"
          >
            <span class="material-symbols-outlined material-symbols-outlined--xs">
              {{ isEdit ? 'save' : 'add_circle' }}
            </span>
            {{ isEdit ? 'Actualizar Unidad' : 'Crear Unidad' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  unit: {
    type: Object,
    default: null,
  },
  parentUnit: {
    type: Object,
    default: null,
  },
  existingUnits: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'save']);

const isEdit = computed(() => Boolean(props.unit));

const form = ref({
  codigo: '',
  nombre: '',
  padre_id: null,
});

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.unit) {
        form.value = {
          codigo: props.unit.codigo || '',
          nombre: props.unit.nombre || '',
          padre_id: props.unit.padre_id || props.unit.dependencia_padre_id || null,
        };
      } else if (props.parentUnit) {
        form.value = {
          codigo: '',
          nombre: '',
          padre_id: props.parentUnit.codigo || props.parentUnit.id || null,
        };
      } else {
        form.value = {
          codigo: '',
          nombre: '',
          padre_id: null,
        };
      }
    }
  },
  { immediate: true }
);

const availableParents = computed(() => {
  if (!isEdit.value) {
    return props.existingUnits;
  }
  // Excluir la misma unidad para evitar autoreferencia cíclica
  const currentCode = props.unit?.codigo || props.unit?.id;
  return props.existingUnits.filter((u) => (u.codigo || u.id) !== currentCode);
});

const isValid = computed(() => {
  return Boolean(form.value.codigo.trim() && form.value.nombre.trim());
});

const handleSubmit = () => {
  if (!isValid.value) return;

  emit('save', {
    isEdit: isEdit.value,
    oldCodigo: props.unit?.codigo || props.unit?.id || null,
    codigo: form.value.codigo.trim().toUpperCase(),
    nombre: form.value.nombre.trim(),
    padre_id: form.value.padre_id,
  });

  emit('close');
};
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

.modal-content--md {
  max-width: 540px;
  width: 100%;
  box-shadow: var(--shadow-xl);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
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
</style>
