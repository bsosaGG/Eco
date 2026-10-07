<template>
  <div>
    <!-- Búsqueda y acción nueva -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="etiqueta">Buscar</label>
        <div class="relative">
          <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input v-model="search" @input="debouncedLoad" type="text" placeholder="Razón social o NIT..." class="campo pl-9" />
        </div>
      </div>
      <button v-if="canConfig" @click="openNuevo" class="btn-primario">
        <Plus class="w-4 h-4" /> Nuevo proveedor
      </button>
    </div>

    <Cargando v-if="loading && !proveedores.length" mensaje="Cargando proveedores..." />
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <EstadoVacio v-if="proveedores.length === 0" :icono="Building2" titulo="No hay proveedores que coincidan"
        :detalle="search ? 'Intente con otra razón social o NIT.' : 'Agregue el primer proveedor para poder registrar cotizaciones.'">
        <button v-if="canConfig && !search" @click="openNuevo" class="btn-primario mt-2"><Plus class="w-4 h-4" /> Nuevo proveedor</button>
      </EstadoVacio>

      <template v-else>
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
            <tr v-for="p in proveedores" :key="p.id_proveedor" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 font-medium text-gray-800">{{ p.razon_social }}</td>
              <td class="px-4 py-3 text-gray-600">{{ p.nit }}</td>
              <td class="px-4 py-3 text-gray-600">
                <div>{{ p.email_contacto || '—' }}</div>
                <div class="text-xs text-gray-400">{{ p.telefono || '' }}</div>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-medium" :class="p.constancia_rtu_vigente ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                  {{ p.constancia_rtu_vigente ? 'Vigente' : 'No vigente' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-medium" :class="p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  {{ p.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button v-if="canConfig" @click="openEditar(p)" class="inline-flex items-center gap-1 text-accent text-xs font-medium hover:underline">
                  <Pencil class="w-3.5 h-3.5" /> Editar
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Tarjetas (mobile) -->
        <div class="md:hidden divide-y divide-gray-100">
          <div v-for="p in proveedores" :key="p.id_proveedor" class="p-4">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="font-medium text-gray-800 text-sm">{{ p.razon_social }}</span>
              <span class="px-2 py-1 rounded-full text-xs font-medium shrink-0" :class="p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ p.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <p class="text-sm text-gray-600">NIT: {{ p.nit }}</p>
            <p class="text-xs text-gray-400">{{ p.email_contacto || 'Sin correo' }} &middot; {{ p.telefono || 'Sin teléfono' }}</p>
            <div class="flex items-center justify-between mt-2">
              <span class="px-2 py-1 rounded-full text-xs font-medium" :class="p.constancia_rtu_vigente ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                RTU {{ p.constancia_rtu_vigente ? 'vigente' : 'no vigente' }}
              </span>
              <button v-if="canConfig" @click="openEditar(p)" class="text-accent text-xs font-medium hover:underline">Editar</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Crear / editar -->
    <ModalBase v-model="showForm" :titulo="editingId ? 'Editar proveedor' : 'Nuevo proveedor'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="etiqueta">Razón social *</label>
          <input v-model="form.razon_social" type="text" class="campo" />
        </div>
        <div>
          <label class="etiqueta">NIT *</label>
          <input v-model="form.nit" type="text" class="campo" />
        </div>
        <div>
          <label class="etiqueta">Correo de contacto</label>
          <input v-model="form.email_contacto" type="email" class="campo" />
        </div>
        <div>
          <label class="etiqueta">Teléfono</label>
          <input v-model="form.telefono" type="text" class="campo" />
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-600">
          <input v-model="form.constancia_rtu_vigente" type="checkbox" class="accent-accent" />
          Constancia RTU vigente
        </label>
        <label v-if="editingId" class="flex items-center gap-2 text-sm text-gray-600">
          <input v-model="form.activo" type="checkbox" class="accent-accent" />
          Activo
        </label>
      </div>
      <template #footer>
        <button type="button" @click="showForm = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleGuardar" :disabled="formLoading || !form.razon_social || !form.nit" class="btn-primario">
          {{ formLoading ? 'Guardando...' : 'Guardar' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, Search, Pencil, Building2 } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';
import ModalBase from '../../components/common/ModalBase.vue';
import Cargando from '../../components/common/Cargando.vue';
import EstadoVacio from '../../components/common/EstadoVacio.vue';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';
import { notificar } from '../../utils/alertas';

const canConfig = authService.hasPermission(PERMISOS.CONFIG);

const proveedores = ref([]);
const search = ref('');
const loading = ref(true);
const error = ref('');
let debounceTimer = null;

const showForm = ref(false);
const editingId = ref(null);
const formVacio = () => ({ razon_social: '', nit: '', email_contacto: '', telefono: '', constancia_rtu_vigente: false, activo: true });
const form = ref(formVacio());
const formLoading = ref(false);

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    proveedores.value = await adquisicionesService.getProveedores({ searchQuery: search.value || undefined });
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
  form.value = formVacio();
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
  showForm.value = true;
};

const handleGuardar = async () => {
  formLoading.value = true;
  try {
    if (editingId.value) {
      await adquisicionesService.updateProveedor(editingId.value, form.value);
      notificar.exito('Proveedor actualizado');
    } else {
      await adquisicionesService.createProveedor(form.value);
      notificar.exito('Proveedor agregado');
    }
    showForm.value = false;
    await load();
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudo guardar el proveedor.'));
  } finally {
    formLoading.value = false;
  }
};

onMounted(load);
</script>
