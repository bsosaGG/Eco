<template>
  <div>
    <!-- Búsqueda y acción nueva -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="etiqueta">Buscar</label>
        <div class="relative">
          <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input v-model="search" @input="debouncedLoad" type="text" placeholder="Nombre o código de unidad..." class="campo pl-9" />
        </div>
      </div>
      <button v-if="canConfig" @click="openNueva" class="btn-primario">
        <Plus class="w-4 h-4" /> Nueva unidad
      </button>
    </div>

    <Cargando v-if="loading && !unidades.length" mensaje="Cargando unidades solicitantes..." />
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <EstadoVacio v-if="unidades.length === 0" :icono="Landmark" titulo="No hay unidades que coincidan"
        :detalle="search ? 'Intente con otro nombre o código.' : 'Agregue la primera unidad solicitante.'" />

      <template v-else>
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
            <tr v-for="u in unidades" :key="u.id_unidad" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 font-medium text-gray-800">{{ u.nombre }}</td>
              <td class="px-4 py-3 text-gray-600">{{ u.codigo_unidad }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-medium" :class="u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  {{ u.activo ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <template v-if="canConfig">
                  <button @click="openFirmantes(u)" class="inline-flex items-center gap-1 text-accent text-xs font-medium hover:underline mr-3">
                    <Users class="w-3.5 h-3.5" /> Firmantes
                  </button>
                  <button @click="openEditar(u)" class="inline-flex items-center gap-1 text-accent text-xs font-medium hover:underline">
                    <Pencil class="w-3.5 h-3.5" /> Editar
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Tarjetas (mobile) -->
        <div class="md:hidden divide-y divide-gray-100">
          <div v-for="u in unidades" :key="u.id_unidad" class="p-4">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="font-medium text-gray-800 text-sm">{{ u.nombre }}</span>
              <span class="px-2 py-1 rounded-full text-xs font-medium shrink-0" :class="u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ u.activo ? 'Activa' : 'Inactiva' }}
              </span>
            </div>
            <p class="text-sm text-gray-600">Código: {{ u.codigo_unidad }}</p>
            <div v-if="canConfig" class="flex justify-end gap-4 mt-2">
              <button @click="openFirmantes(u)" class="text-accent text-xs font-medium hover:underline">Firmantes</button>
              <button @click="openEditar(u)" class="text-accent text-xs font-medium hover:underline">Editar</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Crear / editar -->
    <ModalBase v-model="showForm" :titulo="editingId ? 'Editar unidad' : 'Nueva unidad solicitante'" size="sm">
      <div class="space-y-4">
        <div>
          <label class="etiqueta">Nombre *</label>
          <input v-model="form.nombre" type="text" placeholder="Ej. Dirección de Mantenimiento" class="campo" />
        </div>
        <div>
          <label class="etiqueta">Código *</label>
          <input v-model="form.codigo_unidad" type="text" placeholder="Ej. DIR-MTTO" class="campo" />
          <p class="text-xs text-gray-400 mt-1">Arma el correlativo de expedientes: ABREVIATURA-CORRELATIVO-AÑO (por ejemplo UA-1-2026).</p>
        </div>
        <label v-if="editingId" class="flex items-center gap-2 text-sm text-gray-600">
          <input v-model="form.activo" type="checkbox" class="accent-accent" />
          Activa
        </label>
      </div>
      <template #footer>
        <button type="button" @click="showForm = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleGuardar" :disabled="formLoading || !form.nombre || !form.codigo_unidad" class="btn-primario">
          {{ formLoading ? 'Guardando...' : 'Guardar' }}
        </button>
      </template>
    </ModalBase>

    <!-- Firmantes de la unidad: quién firma las solicitudes y con qué cargo -->
    <ModalBase v-model="showFirmantes" titulo="Firmantes de la unidad" :subtitulo="unidadFirmantes?.nombre">
      <p class="text-sm text-gray-500 mb-4">
        Las personas asignadas pueden firmar solicitudes de esta unidad; su cargo aparece en el PDF de la solicitud.
      </p>

      <Cargando v-if="cargandoFirmantes" mensaje="Cargando firmantes..." />
      <template v-else>
        <ul v-if="firmantes.length" class="divide-y divide-gray-100 border border-gray-100 rounded-lg mb-4">
          <li v-for="f in firmantes" :key="f.id_asignacion" class="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <div class="min-w-0">
              <p class="font-medium text-gray-800 truncate">{{ f.nombre_completo }}</p>
              <p class="text-xs text-gray-400 truncate">{{ f.cargo || 'Sin cargo' }} &middot; {{ f.email || 'Sin correo' }}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="f.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ f.activo ? 'Activo' : 'Inactivo' }}
              </span>
              <button v-if="f.activo" @click="quitarFirmante(f)" class="text-red-500 hover:text-red-700" aria-label="Quitar firmante">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </li>
        </ul>
        <EstadoVacio v-else :icono="Users" titulo="Esta unidad no tiene firmantes" detalle="Agregue a la persona que firma sus solicitudes." />

        <div class="border-t border-gray-100 pt-4 space-y-3">
          <h5 class="text-xs font-semibold text-gray-400 uppercase">Agregar firmante</h5>
          <div>
            <label class="etiqueta">Usuario</label>
            <SearchableSelect v-model="nuevoFirmante.id_usuario" :options="opcionesUsuarios" en-linea placeholder="Buscar usuario de Adquisiciones..." />
          </div>
          <div>
            <label class="etiqueta">Cargo</label>
            <input v-model="nuevoFirmante.cargo" type="text" placeholder="Ej. Director de Mantenimiento" class="campo" />
          </div>
        </div>
      </template>

      <template #footer>
        <button type="button" @click="showFirmantes = false" class="btn-secundario">Cerrar</button>
        <button type="button" @click="agregarFirmante" :disabled="formLoading || !nuevoFirmante.id_usuario" class="btn-primario">
          <Plus class="w-4 h-4" /> Agregar
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus, Search, Pencil, Users, Trash2, Landmark } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';
import ModalBase from '../../components/common/ModalBase.vue';
import Cargando from '../../components/common/Cargando.vue';
import EstadoVacio from '../../components/common/EstadoVacio.vue';
import SearchableSelect from '../../components/common/SearchableSelect.vue';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';
import { confirmar, notificar } from '../../utils/alertas';

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

// --- Firmantes de la unidad ---
const showFirmantes = ref(false);
const unidadFirmantes = ref(null);
const firmantes = ref([]);
const cargandoFirmantes = ref(false);
const usuarios = ref([]);
const nuevoFirmante = ref({ id_usuario: '', cargo: '' });
const opcionesUsuarios = computed(() =>
  usuarios.value.map((u) => ({ value: u.id_usuario, label: u.nombre_completo || u.email }))
);

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    unidades.value = await adquisicionesService.getUnidadesSolicitantes({ searchQuery: search.value || undefined });
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
  showForm.value = true;
};

const openEditar = (u) => {
  editingId.value = u.id_unidad;
  form.value = { nombre: u.nombre, codigo_unidad: u.codigo_unidad, activo: u.activo };
  showForm.value = true;
};

const handleGuardar = async () => {
  formLoading.value = true;
  try {
    if (editingId.value) {
      await adquisicionesService.updateUnidadSolicitante(editingId.value, form.value);
      notificar.exito('Unidad actualizada');
    } else {
      await adquisicionesService.createUnidadSolicitante(form.value);
      notificar.exito('Unidad agregada');
    }
    showForm.value = false;
    await load();
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudo guardar la unidad solicitante.'));
  } finally {
    formLoading.value = false;
  }
};

const cargarFirmantes = async () => {
  cargandoFirmantes.value = true;
  try {
    firmantes.value = await adquisicionesService.getAsignacionesUnidad(unidadFirmantes.value.id_unidad);
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudieron cargar los firmantes.'));
  } finally {
    cargandoFirmantes.value = false;
  }
};

const openFirmantes = async (unidad) => {
  unidadFirmantes.value = unidad;
  nuevoFirmante.value = { id_usuario: '', cargo: '' };
  firmantes.value = [];
  showFirmantes.value = true;
  if (!usuarios.value.length) {
    try {
      usuarios.value = await adquisicionesService.getUsuariosModulo();
    } catch (err) {
      console.error('No se pudieron cargar los usuarios del módulo', err);
    }
  }
  await cargarFirmantes();
};

const agregarFirmante = async () => {
  formLoading.value = true;
  try {
    await adquisicionesService.asignarUsuarioUnidad(unidadFirmantes.value.id_unidad, {
      id_usuario: nuevoFirmante.value.id_usuario,
      cargo: nuevoFirmante.value.cargo || null,
    });
    notificar.exito('Firmante agregado');
    nuevoFirmante.value = { id_usuario: '', cargo: '' };
    await cargarFirmantes();
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudo agregar al firmante.'));
  } finally {
    formLoading.value = false;
  }
};

const quitarFirmante = async (f) => {
  const seguro = await confirmar({
    titulo: '¿Quitar a este firmante?',
    texto: `${f.nombre_completo} dejará de firmar solicitudes de ${unidadFirmantes.value.nombre}.`,
    confirmar: 'Sí, quitar',
    peligro: true,
  });
  if (!seguro) return;
  try {
    await adquisicionesService.quitarAsignacionUnidad(unidadFirmantes.value.id_unidad, f.id_usuario);
    notificar.exito('Firmante quitado');
    await cargarFirmantes();
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudo quitar al firmante.'));
  }
};

onMounted(load);
</script>
