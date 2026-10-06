<template>
  <div class="relative">
    <button type="button" @click="alternar" aria-label="Avisos"
      class="relative p-2 rounded-full text-gray-500 hover:text-accent hover:bg-gray-100 transition-colors">
      <Bell class="w-5 h-5" />
      <span v-if="noLeidas > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
        {{ noLeidas > 99 ? '99+' : noLeidas }}
      </span>
    </button>

    <div v-if="abierto" class="fixed inset-0 z-40" @click="abierto = false"></div>
    <div v-if="abierto"
      class="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl z-50">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h4 class="text-sm font-semibold text-gray-700">Avisos</h4>
        <button v-if="noLeidas > 0" type="button" @click="marcarTodas" class="text-xs text-accent hover:underline">
          Marcar todas como leídas
        </button>
      </div>

      <ul class="max-h-96 overflow-y-auto divide-y divide-gray-100">
        <li v-for="aviso in items" :key="aviso.id_notificacion">
          <button type="button" @click="abrir(aviso)"
            class="w-full text-left px-4 py-3 hover:bg-gray-50 flex gap-3 items-start"
            :class="aviso.leida ? 'opacity-70' : ''">
            <span class="w-2 h-2 mt-1.5 rounded-full shrink-0" :class="aviso.leida ? 'bg-gray-300' : 'bg-accent'"></span>
            <span class="min-w-0">
              <span class="block text-sm text-gray-800" :class="aviso.leida ? '' : 'font-medium'">{{ aviso.titulo }}</span>
              <span class="block text-xs text-gray-500 line-clamp-2">{{ aviso.mensaje }}</span>
              <span class="block text-[11px] text-gray-400 mt-0.5">{{ formatFechaHora(aviso.fecha_creacion) }}</span>
            </span>
          </button>
        </li>
        <li v-if="items.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">
          No tienes avisos todavía.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { Bell } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import { formatFechaHora } from '../../utils/format';

// Campana de avisos del trámite (cambios de etapa, asignaciones y devoluciones). Se actualiza sola
// cada minuto y al abrirla; un fallo de red nunca debe estorbar el resto de la pantalla.
const ACTUALIZAR_CADA_MS = 60000;

const router = useRouter();
const items = ref([]);
const noLeidas = ref(0);
const abierto = ref(false);
let temporizador = null;

const cargar = async () => {
  try {
    const respuesta = await adquisicionesService.getNotificaciones();
    items.value = respuesta.items;
    noLeidas.value = respuesta.no_leidas;
  } catch (err) {
    console.error('No se pudieron cargar los avisos', err);
  }
};

const alternar = async () => {
  abierto.value = !abierto.value;
  if (abierto.value) await cargar();
};

const abrir = async (aviso) => {
  abierto.value = false;
  if (!aviso.leida) {
    try {
      await adquisicionesService.marcarNotificacionLeida(aviso.id_notificacion);
      aviso.leida = true;
      noLeidas.value = Math.max(0, noLeidas.value - 1);
    } catch (err) {
      console.error('No se pudo marcar el aviso como leído', err);
    }
  }
  if (aviso.id_expediente) {
    router.push({ name: 'ExpedienteDetail', params: { id: aviso.id_expediente } });
  }
};

const marcarTodas = async () => {
  try {
    await adquisicionesService.marcarTodasNotificacionesLeidas();
    items.value.forEach((aviso) => {
      aviso.leida = true;
    });
    noLeidas.value = 0;
  } catch (err) {
    console.error('No se pudieron marcar los avisos como leídos', err);
  }
};

onMounted(() => {
  cargar();
  temporizador = setInterval(cargar, ACTUALIZAR_CADA_MS);
});
onBeforeUnmount(() => clearInterval(temporizador));
</script>
