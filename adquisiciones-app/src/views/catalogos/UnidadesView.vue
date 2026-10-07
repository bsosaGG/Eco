<template>
  <div>
    <!-- Filtros y accion nueva -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
        <input v-model="search" @input="debouncedLoad" type="text" placeholder="Nombre o código de unidad..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent" />
      </div>
      <button v-if="canConfig" @click="openNueva"
        class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center gap-2">
        <Plus class="w-4 h-4" /> Nueva Unidad
      </button>
    </div>

    <!-- Formulario crear/editar -->
    <div v-if="showForm" class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-gray-700">{{ editingId ? 'Editar unidad' : 'Nueva unidad solicitante' }}</h4>
        <button @click="closeForm" class="text-gray-400 hover:text-gray-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div v-if="formError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ formError }}</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
          <input v-model="form.nombre" type="text" placeholder="Ej. Dirección de Mantenimiento"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Código *</label>
          <input v-model="form.codigo_unidad" type="text" placeholder="Ej. DIR-MTTO"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <label v-if="editingId" class="flex items-center gap-2 text-sm text-gray-600">
          <input v-model="form.activo" type="checkbox" />
          Activa
        </label>
      </div>

      <p class="text-xs text-gray-400">El código se usa para armar el correlativo de expedientes: ABREVIATURA-CORRELATIVO-AÑO (por ejemplo UA-1-2026).</p>

      <div class="flex justify-end gap-2 pt-2">
        <button @click="closeForm" class="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          Cancelar
        </button>
        <button @click="handleGuardar" :disabled="formLoading || !form.nombre || !form.codigo_unidad"
          class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50">
          {{ formLoading ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <!-- Estado de carga / error -->
    <div v-if="loading" class="text-center text-gray-400 py-12">Cargando unidades solicitantes...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- Tabla (md en adelante) -->
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3">Nombre</th>
            <th class="text-left px-4 py-3">Código</th>
            <th class="text-left px-4 py-3">Estado</th>
            <th class="text-right px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="u in unidades" :key="u.id_unidad" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ u.nombre }}</td>
            <td class="px-4 py-3 text-gray-600">{{ u.codigo_unidad }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium"
                :class="u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ u.activo ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button v-if="canConfig" @click="openEditar(u)" class="text-accent text-xs font-medium hover:underline">
                Editar
              </button>
            </td>
          </tr>
          <tr v-if="unidades.length === 0">
            <td colspan="4" class="text-center text-gray-400 py-10">No hay unidades que coincidan con la búsqueda.</td>
          </tr>
        </tbody>
      </table>

      <!-- Tarjetas (mobile) -->
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="u in unidades" :key="u.id_unidad" class="p-4">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-medium text-gray-800 text-sm">{{ u.nombre }}</span>
            <span class="px-2 py-1 rounded-full text-xs font-medium shrink-0"
              :class="u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
              {{ u.activo ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
          <p class="text-sm text-gray-600">Código: {{ u.codigo_unidad }}</p>
          <div class="flex justify-end mt-2">
            <button v-if="canConfig" @click="openEditar(u)" class="text-accent text-xs font-medium hover:underline">
              Editar
            </button>
          </div>
        </div>
        <div v-if="unidades.length === 0" class="text-center text-gray-400 py-10 text-sm">
          No hay unidades que coincidan con la búsqueda.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, X } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';

const canConfig = authService.hasPermission(PERMISOS.CONFIG);

const unidades = ref([]);
const search = ref('');
const loading = ref(true);
const error = ref('');
let debounceTimer = null;

const showForm = ref(false);
const editingId = ref(null);
const form = ref({ nombre: '', codigo_unidad: '', activo: true });
const formLoading = ref(false);
const formError = ref('');

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    unidades.value = await adquisicionesService.getUnidadesSolicitantes({
      searchQuery: search.value || undefined,
    });
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar el catálogo de unidades solicitantes.';
  } finally {
    loading.value = false;
  }
};

const debouncedLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 350);
};

const openNueva = () => {
  editingId.value = null;
  form.value = { nombre: '', codigo_unidad: '', activo: true };
  formError.value = '';
  showForm.value = true;
};

const openEditar = (u) => {
  editingId.value = u.id_unidad;
  form.value = {
    nombre: u.nombre,
    codigo_unidad: u.codigo_unidad,
    activo: u.activo,
  };
  formError.value = '';
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingId.value = null;
};

const handleGuardar = async () => {
  formLoading.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await adquisicionesService.updateUnidadSolicitante(editingId.value, form.value);
    } else {
      await adquisicionesService.createUnidadSolicitante(form.value);
    }
    closeForm();
    await load();
  } catch (err) {
    console.error(err);
    formError.value = errorMessage(err, 'No se pudo guardar la unidad solicitante.');
  } finally {
    formLoading.value = false;
  }
};

onMounted(load);
</script>
