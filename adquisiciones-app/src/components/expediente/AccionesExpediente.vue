<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Acciones</h4>

    <div v-if="error" class="bg-red-50 text-red-600 p-2 rounded text-xs mb-3">{{ error }}</div>
    <div v-if="success" class="bg-green-50 text-green-600 p-2 rounded text-xs mb-3">{{ success }}</div>

    <div class="space-y-3">
      <div v-if="canAssign">
        <label class="block text-xs font-medium text-gray-500 mb-1">Asignar a</label>
        <div class="relative">
          <input v-model="asignacionBusqueda" @focus="asignacionAbierta = true" type="text"
            placeholder="Buscar usuario de Adquisiciones..."
            class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
          <ul v-if="asignacionAbierta && usuariosFiltrados.length"
            class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto text-sm">
            <li v-for="u in usuariosFiltrados" :key="u.id_usuario" @click="seleccionarUsuarioAsignado(u)"
              class="px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <p class="text-gray-800">{{ u.nombre_completo || u.email }}</p>
              <p class="text-xs text-gray-400">{{ u.perfiles && u.perfiles.length ? u.perfiles.join(', ') : (u.rol === 'admin' ? 'Superadmin' : u.email) }}</p>
            </li>
          </ul>
        </div>
        <button @click="emit('asignar', usuarioAsignadoSeleccionado)" :disabled="busy || !usuarioAsignadoSeleccionado"
          class="mt-2 w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
          Asignar
        </button>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Cambiar estado</label>
        <div class="flex gap-2">
          <select v-model="estadoSeleccionado" class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm">
            <option value="" disabled>Selecciona un estado</option>
            <option v-for="e in estados" :key="e.value" :value="e.value">{{ e.text }}</option>
          </select>
          <button @click="emit('cambiar-estado', estadoSeleccionado)" :disabled="busy || !estadoSeleccionado"
            class="bg-accent text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 disabled:opacity-50">
            Aplicar
          </button>
        </div>
      </div>

      <button v-if="canDevolver" @click="showDevolver = !showDevolver"
        class="text-sm text-red-500 hover:underline pt-2">
        Devolver con observaciones
      </button>
      <div v-if="showDevolver" class="space-y-2 pt-2 border-t border-gray-100">
        <input v-model="devolucion.etapa_origen" type="text" placeholder="Etapa (ej. Cotización)"
          class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        <input v-model="devolucion.motivo" type="text" placeholder="Motivo"
          class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        <textarea v-model="devolucion.descripcion" rows="2" placeholder="Descripción / checklist a corregir"
          class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"></textarea>
        <button @click="emit('devolver', { ...devolucion })" :disabled="busy"
          class="w-full bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 disabled:opacity-50">
          Confirmar devolución
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Panel de acciones del expediente. Solo recoge lo que el usuario elige y lo avisa con eventos;
// la vista que lo contiene ejecuta la acción, muestra `error`/`success` y recarga el expediente.
const props = defineProps({
  estados: { type: Array, default: () => [] },
  usuarios: { type: Array, default: () => [] },
  canAssign: { type: Boolean, default: false },
  canDevolver: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
});
const emit = defineEmits(['asignar', 'cambiar-estado', 'devolver']);

// --- Selector de "Asignar a" (busca entre los usuarios reales de Adquisiciones) ---
const asignacionBusqueda = ref('');
const asignacionAbierta = ref(false);
const usuarioAsignadoSeleccionado = ref(null);
const usuariosFiltrados = computed(() => {
  const q = asignacionBusqueda.value.trim().toLowerCase();
  const lista = q
    ? props.usuarios.filter((u) =>
        (u.nombre_completo || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      )
    : props.usuarios;
  return lista.slice(0, 8);
});
const seleccionarUsuarioAsignado = (u) => {
  usuarioAsignadoSeleccionado.value = u;
  asignacionBusqueda.value = u.nombre_completo || u.email;
  asignacionAbierta.value = false;
};

const estadoSeleccionado = ref('');
const showDevolver = ref(false);
const devolucion = ref({ etapa_origen: '', motivo: '', descripcion: '' });
</script>
