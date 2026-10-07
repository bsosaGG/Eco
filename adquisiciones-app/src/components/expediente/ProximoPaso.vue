<template>
  <div v-if="siguiente" class="mx-4 md:mx-6 mb-4 px-4 py-3 rounded-lg flex flex-wrap items-center justify-between gap-3 transition-colors"
    :class="clases">
    <div class="flex items-start gap-3 min-w-0">
      <component :is="icono" class="w-5 h-5 mt-0.5 shrink-0" />
      <div class="text-sm min-w-0">
        <template v-if="siguiente.tipo === 'pendiente' || siguiente.tipo === 'devuelto'">
          <p>
            <span class="opacity-70">Siguiente paso: </span>
            <span class="font-semibold">{{ siguiente.titulo }}</span>
          </p>
          <p class="opacity-80 mt-0.5">
            <template v-if="meToca">Pendiente de su atención.</template>
            <template v-else-if="quien">Responsable: <b class="font-medium">{{ quien }}</b>
              <span v-if="siguiente.perfil && responsable"> &middot; {{ siguiente.perfil }}</span>.</template>
          </p>
        </template>
        <p v-else class="font-semibold">{{ siguiente.titulo }}</p>
      </div>
    </div>

    <button v-if="puedeTurnar" type="button" @click="emit('turnar')" :disabled="ocupado"
      class="inline-flex items-center gap-1 bg-white hover:bg-blue-50 text-sm font-medium px-3 py-1.5 rounded-lg border border-current disabled:opacity-50 transition-colors">
      <Send class="w-4 h-4" /> Recibir y turnar
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Send, ClipboardList, Undo2, CheckCircle2, Ban } from 'lucide-vue-next';
import authService from '../../services/auth.service';

// Qué falta hacer en el expediente y a quién le toca. El paso lo calcula el API (`siguiente_paso`) con la
// misma regla con la que se asigna al responsable, así que lo que se ve aquí es lo que el sistema hace.
// Quien puede recibir y turnar la solicitud tiene el botón para hacerlo; el resto solo se informa.
const props = defineProps({
  expediente: { type: Object, required: true },
  ocupado: { type: Boolean, default: false },
});
const emit = defineEmits(['turnar']);

const siguiente = computed(() => props.expediente.siguiente_paso || null);
const responsable = computed(() => props.expediente.responsable_actual_nombre || '');
const quien = computed(() => responsable.value || siguiente.value?.perfil || (siguiente.value?.tipo === 'devuelto' ? 'la unidad solicitante' : ''));

const meToca = computed(() => {
  const yo = authService.getCurrentUser()?.id;
  return !!yo && Number(yo) === Number(props.expediente.funcionario_responsable_id);
});

const puedeTurnar = computed(
  () => siguiente.value?.accion === 'turnar' && authService.hasPermission(siguiente.value.permiso)
);

const clases = computed(
  () =>
    ({
      pendiente: meToca.value ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' : 'bg-blue-50 text-blue-800',
      devuelto: 'bg-red-50 text-red-700',
      cerrado: 'bg-green-50 text-green-700',
      cancelado: 'bg-gray-100 text-gray-600',
    })[siguiente.value?.tipo]
);

const icono = computed(
  () => ({ pendiente: ClipboardList, devuelto: Undo2, cerrado: CheckCircle2, cancelado: Ban })[siguiente.value?.tipo] || ClipboardList
);
</script>
