<template>
  <div>
    <!-- Filtros y accion nueva -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
        <input v-model="search" @input="debouncedLoad" type="text" placeholder="Razón social o NIT..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent" />
      </div>
      <button v-if="canConfig" @click="openNuevo"
        class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center gap-2">
        <Plus class="w-4 h-4" /> Nuevo Proveedor
      </button>
    </div>

    <!-- Formulario crear/editar -->
    <div v-if="showForm" class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-gray-700">{{ editingId ? 'Editar proveedor' : 'Nuevo proveedor' }}</h4>
        <button @click="closeForm" class="text-gray-400 hover:text-gray-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div v-if="formError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ formError }}</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Razón social *</label>
          <input v-model="form.razon_social" type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">NIT *</label>
          <input v-model="form.nit" type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Correo de contacto</label>
          <input v-model="form.email_contacto" type="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
          <input v-model="form.telefono" type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-600">
          <input v-model="form.constancia_rtu_vigente" type="checkbox" />
          Constancia RTU vigente
        </label>
        <label v-if="editingId" class="flex items-center gap-2 text-sm text-gray-600">
          <input v-model="form.activo" type="checkbox" />
          Activo
        </label>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button @click="closeForm" class="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          Cancelar
        </button>
        <button @click="handleGuardar" :disabled="formLoading || !form.razon_social || !form.nit"
          class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50">
          {{ formLoading ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <!-- Estado de carga / error -->
    <div v-if="loading" class="text-center text-gray-400 py-12">Cargando proveedores...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- Tabla (md en adelante) -->
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3">Razón Social</th>
            <th class="text-left px-4 py-3">NIT</th>
            <th class="text-left px-4 py-3">Contacto</th>
            <th class="text-left px-4 py-3">RTU</th>
            <th class="text-left px-4 py-3">Estado</th>
            <th class="text-right px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="p in proveedores" :key="p.id_proveedor" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ p.razon_social }}</td>
            <td class="px-4 py-3 text-gray-600">{{ p.nit }}</td>
            <td class="px-4 py-3 text-gray-600">
              <div>{{ p.email_contacto || '—' }}</div>
              <div class="text-xs text-gray-400">{{ p.telefono || '' }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium"
                :class="p.constancia_rtu_vigente ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ p.constancia_rtu_vigente ? 'Vigente' : 'No vigente' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium"
                :class="p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ p.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button v-if="canConfig" @click="openEditar(p)" class="text-accent text-xs font-medium hover:underline">
                Editar
              </button>
            </td>
          </tr>
          <tr v-if="proveedores.length === 0">
            <td colspan="6" class="text-center text-gray-400 py-10">No hay proveedores que coincidan con la búsqueda.</td>
          </tr>
        </tbody>
      </table>

      <!-- Tarjetas (mobile) -->
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="p in proveedores" :key="p.id_proveedor" class="p-4">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-medium text-gray-800 text-sm">{{ p.razon_social }}</span>
            <span class="px-2 py-1 rounded-full text-xs font-medium shrink-0"
              :class="p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
              {{ p.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          <p class="text-sm text-gray-600">NIT: {{ p.nit }}</p>
          <p class="text-xs text-gray-400">{{ p.email_contacto || 'Sin correo' }} &middot; {{ p.telefono || 'Sin teléfono' }}</p>
          <div class="flex items-center justify-between mt-2">
            <span class="px-2 py-1 rounded-full text-xs font-medium"
              :class="p.constancia_rtu_vigente ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
              RTU {{ p.constancia_rtu_vigente ? 'vigente' : 'no vigente' }}
            </span>
            <button v-if="canConfig" @click="openEditar(p)" class="text-accent text-xs font-medium hover:underline">
              Editar
            </button>
          </div>
        </div>
        <div v-if="proveedores.length === 0" class="text-center text-gray-400 py-10 text-sm">
          No hay proveedores que coincidan con la búsqueda.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, X } from 'lucide-vue-next';
import adquisicionesService from '../services/adquisiciones.service';
import authService from '../services/auth.service';

const canConfig = true; // TODO: restaurar cuando se trabajen roles y permisos -> authService.hasPermission('adquisiciones:config')

const proveedores = ref([]);
const search = ref('');
const loading = ref(true);
const error = ref('');
let debounceTimer = null;

const showForm = ref(false);
const editingId = ref(null);
const form = ref({ razon_social: '', nit: '', email_contacto: '', telefono: '', constancia_rtu_vigente: false, activo: true });
const formLoading = ref(false);
const formError = ref('');

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    proveedores.value = await adquisicionesService.getProveedores({
      searchQuery: search.value || undefined,
    });
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar el catálogo de proveedores.';
  } finally {
    loading.value = false;
  }
};

const debouncedLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 350);
};

const openNuevo = () => {
  editingId.value = null;
  form.value = { razon_social: '', nit: '', email_contacto: '', telefono: '', constancia_rtu_vigente: false, activo: true };
  formError.value = '';
  showForm.value = true;
};

const openEditar = (p) => {
  editingId.value = p.id_proveedor;
  form.value = {
    razon_social: p.razon_social,
    nit: p.nit,
    email_contacto: p.email_contacto || '',
    telefono: p.telefono || '',
    constancia_rtu_vigente: p.constancia_rtu_vigente,
    activo: p.activo,
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
      await adquisicionesService.updateProveedor(editingId.value, form.value);
    } else {
      await adquisicionesService.createProveedor(form.value);
    }
    closeForm();
    await load();
  } catch (err) {
    console.error(err);
    formError.value = err.response?.data?.message || 'No se pudo guardar el proveedor.';
  } finally {
    formLoading.value = false;
  }
};

onMounted(load);
</script>
