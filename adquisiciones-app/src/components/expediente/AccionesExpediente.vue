<template>
  <div v-if="hayAcciones" class="relative">
    <button type="button" @click="menuAbierto = !menuAbierto"
      class="inline-flex items-center gap-1 border border-gray-300 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
      Acciones <ChevronDown class="w-4 h-4 transition-transform" :class="menuAbierto ? 'rotate-180' : ''" />
    </button>
    <div v-if="menuAbierto" class="fixed inset-0 z-30" @click="menuAbierto = false"></div>
    <Transition name="menu">
      <ul v-if="menuAbierto" class="absolute right-0 mt-2 w-64 z-40 bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-sm">
        <li v-if="canAssign">
          <button type="button" @click="abrir('reasignar')" class="item-menu">
            <UserCog class="w-4 h-4 text-gray-400" /> Reasignar analista
          </button>
        </li>
        <li v-if="canDevolver">
          <button type="button" @click="abrir('devolver')" class="item-menu text-red-600">
            <Undo2 class="w-4 h-4" /> Devolver con observaciones
          </button>
        </li>
        <li v-if="canCambiarEstado" class="border-t border-gray-100 mt-1 pt-1">
          <button type="button" @click="abrir('estado')" class="item-menu">
            <Shuffle class="w-4 h-4 text-gray-400" /> Cambiar estado (administración)
          </button>
        </li>
      </ul>
    </Transition>
  </div>

  <!-- Reasignar al analista que lleva el expediente -->
  <ModalBase v-model="modales.reasignar" titulo="Reasignar analista" :subtitulo="`Expediente ${expediente.codigo_expediente}`" size="lg">
    <p class="text-sm text-gray-500 mb-3">
      El sistema asigna al analista de forma automática. Utilice esta opción únicamente si otra persona debe llevar este expediente.
      <span v-if="expediente.analista_nombre" class="block mt-1">Analista actual: <b class="font-medium text-gray-700">{{ expediente.analista_nombre }}</b></span>
    </p>
    <label class="etiqueta">Nuevo analista</label>
    <SearchableSelect v-model="idAnalista" :options="opcionesUsuarios" en-linea placeholder="Escriba un nombre o perfil..." />
    <template #footer>
      <button type="button" @click="modales.reasignar = false" class="btn-secundario">Cancelar</button>
      <button type="button" @click="reasignar" :disabled="ocupado || !idAnalista" class="btn-primario">
        {{ ocupado ? 'Guardando...' : 'Reasignar' }}
      </button>
    </template>
  </ModalBase>

  <!-- Devolver con observaciones -->
  <ModalBase v-model="modales.devolver" titulo="Devolver con observaciones" :subtitulo="`Expediente ${expediente.codigo_expediente}`">
    <div class="space-y-4">
      <p class="text-sm text-gray-500">Se notificará al solicitante el motivo y lo que debe corregir.</p>
      <div>
        <label class="etiqueta">Etapa *</label>
        <input v-model="devolucion.etapa_origen" type="text" placeholder="Ej. Cotización" class="campo" />
      </div>
      <div>
        <label class="etiqueta">Motivo *</label>
        <input v-model="devolucion.motivo" type="text" class="campo" />
      </div>
      <div>
        <label class="etiqueta">Descripción / lista de lo que hay que corregir</label>
        <textarea v-model="devolucion.descripcion" rows="3" class="campo"></textarea>
      </div>
    </div>
    <template #footer>
      <button type="button" @click="modales.devolver = false" class="btn-secundario">Cancelar</button>
      <button type="button" @click="devolver" :disabled="ocupado || !devolucion.motivo || !devolucion.etapa_origen" class="btn-peligro">
        {{ ocupado ? 'Enviando...' : 'Devolver expediente' }}
      </button>
    </template>
  </ModalBase>

  <!-- Cambiar el estado a mano (solo administración) -->
  <ModalBase v-model="modales.estado" titulo="Cambiar estado" :subtitulo="`Expediente ${expediente.codigo_expediente}`" size="sm">
    <p class="text-sm text-gray-500 mb-3">Cambio manual de administración: el expediente se asigna a quien corresponde en el nuevo estado.</p>
    <label class="etiqueta">Nuevo estado</label>
    <select v-model="idEstado" class="campo">
      <option value="" disabled>Seleccione un estado</option>
      <option v-for="e in estados" :key="e.value" :value="e.value">{{ e.text }}</option>
    </select>
    <template #footer>
      <button type="button" @click="modales.estado = false" class="btn-secundario">Cancelar</button>
      <button type="button" @click="cambiarEstado" :disabled="ocupado || !idEstado" class="btn-primario">Aplicar cambio</button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ChevronDown, UserCog, Undo2, Shuffle } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';
import ModalBase from '../common/ModalBase.vue';
import SearchableSelect from '../common/SearchableSelect.vue';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';
import { confirmar, notificar } from '../../utils/alertas';

// Menú de acciones del expediente. Cada acción se hace en un modal y el componente la ejecuta, avisa el
// resultado con un aviso en la esquina y le pide a la vista que recargue (`updated`).
const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const canAssign = authService.hasPermission(PERMISOS.ASSIGN);
const canDevolver = authService.hasPermission(PERMISOS.DEVOLVER);
const canCambiarEstado = authService.hasPermission(PERMISOS.CONFIG); // cambio manual: solo administración
const hayAcciones = canAssign || canDevolver || canCambiarEstado;

const menuAbierto = ref(false);
const modales = reactive({ reasignar: false, devolver: false, estado: false });
const ocupado = ref(false);

const usuarios = ref([]);
const estados = ref([]);
const idAnalista = ref('');
const idEstado = ref('');
const devolucionVacia = () => ({ etapa_origen: '', motivo: '', descripcion: '' });
const devolucion = ref(devolucionVacia());

const opcionesUsuarios = computed(() =>
  usuarios.value.map((u) => ({
    value: u.id_usuario,
    label: `${u.nombre_completo || u.email}${u.perfiles?.length ? ` — ${u.perfiles.join(', ')}` : ''}`,
  }))
);

const abrir = (cual) => {
  menuAbierto.value = false;
  modales[cual] = true;
};

// Ejecuta la acción; si sale bien avisa, cierra el modal y recarga el expediente.
const ejecutar = async (llamada, exito, falla, modal) => {
  ocupado.value = true;
  try {
    const resultado = await llamada();
    notificar.exito(exito);
    modales[modal] = false;
    emit('updated', resultado);
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, falla));
  } finally {
    ocupado.value = false;
  }
};

const reasignar = () => {
  const usuario = usuarios.value.find((u) => u.id_usuario === idAnalista.value);
  return ejecutar(
    () => adquisicionesService.asignarExpediente(props.expediente.id_expediente, idAnalista.value),
    `Expediente asignado a ${usuario?.nombre_completo || usuario?.email || 'el analista'}`,
    'No se pudo reasignar el expediente.',
    'reasignar'
  ).then(() => { idAnalista.value = ''; });
};

const devolver = async () => {
  const seguro = await confirmar({
    titulo: '¿Devolver el expediente?',
    texto: 'Pasará a «Devuelto con Observaciones» y se notificará al solicitante.',
    confirmar: 'Sí, devolver',
    peligro: true,
  });
  if (!seguro) return;
  await ejecutar(
    () => adquisicionesService.devolverExpediente(props.expediente.id_expediente, { ...devolucion.value }),
    'Expediente devuelto con observaciones',
    'No se pudo devolver el expediente.',
    'devolver'
  );
  if (!modales.devolver) devolucion.value = devolucionVacia();
};

const cambiarEstado = async () => {
  const estado = estados.value.find((e) => e.value === idEstado.value);
  const seguro = await confirmar({
    titulo: '¿Cambiar el estado manualmente?',
    texto: `El expediente pasará a «${estado?.text || ''}» sin seguir el flujo normal.`,
    confirmar: 'Sí, cambiar',
    peligro: true,
  });
  if (!seguro) return;
  await ejecutar(
    () => adquisicionesService.cambiarEstado(props.expediente.id_expediente, idEstado.value, 'Cambio manual desde el panel.'),
    'Estado actualizado',
    'No se pudo cambiar el estado.',
    'estado'
  );
  if (!modales.estado) idEstado.value = '';
};

onMounted(async () => {
  if (canCambiarEstado) {
    try {
      estados.value = await adquisicionesService.getEstados();
    } catch (err) {
      console.error('No se pudieron cargar los estados', err);
    }
  }
  if (canAssign) {
    try {
      usuarios.value = await adquisicionesService.getUsuariosModulo();
    } catch (err) {
      console.error('No se pudieron cargar los usuarios del módulo', err);
    }
  }
});
</script>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
