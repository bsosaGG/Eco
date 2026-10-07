<template>
  <div>
    <div v-if="bannerText" class="mb-4 px-3 py-2 rounded-lg text-sm font-medium" :class="bannerClass">
      {{ bannerText }}
    </div>

    <ol class="flex flex-wrap md:flex-nowrap items-start">
      <li v-for="(step, idx) in steps" :key="step.key" class="flex items-center" :class="idx < steps.length - 1 ? 'flex-1 min-w-[110px]' : ''">
        <button type="button"
          @click="step.status !== 'pendiente' && emit('select', step.key)"
          :disabled="step.status === 'pendiente'"
          class="flex flex-col items-center gap-1 text-center px-1 w-full bg-transparent border-0"
          :class="step.status === 'pendiente' ? 'cursor-not-allowed' : 'cursor-pointer'">
          <span class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold flex-shrink-0 transition-transform"
            :class="[pillClass(step.status), step.key === current ? 'scale-110 shadow-md' : '']">
            <Check v-if="step.status === 'completado'" class="w-4 h-4" />
            <Lock v-else-if="step.status === 'pendiente'" class="w-3.5 h-3.5" />
            <span v-else>{{ idx + 1 }}</span>
          </span>
          <span class="text-xs font-medium leading-tight"
            :class="step.status === 'activo' ? 'text-gray-800' : step.status === 'completado' ? 'text-gray-500' : 'text-gray-300'">
            {{ step.label }}
          </span>
          <span v-if="step.subpasos" class="flex gap-1 mt-0.5">
            <span v-for="sp in step.subpasos" :key="sp.key" class="w-1.5 h-1.5 rounded-full"
              :class="sp.done ? 'bg-green-500' : 'bg-gray-300'"></span>
          </span>
        </button>
        <div v-if="idx < steps.length - 1" class="flex-1 h-0.5 mx-1 mt-4 hidden md:block"
          :class="step.status === 'completado' ? 'bg-green-400' : 'bg-gray-200'"></div>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Check, Lock } from 'lucide-vue-next';

const props = defineProps({
  steps: { type: Array, required: true },
  estado: { type: String, default: '' },
  current: { type: String, default: '' },
});
const emit = defineEmits(['select']);

const bannerText = computed(() => {
  if (props.estado === 'Devuelto con Observaciones') return 'Este expediente fue devuelto con observaciones y está pendiente de subsanación.';
  if (props.estado === 'Cancelado / Desierto') return 'Este expediente fue cancelado / declarado desierto.';
  return '';
});
const bannerClass = computed(() =>
  props.estado === 'Cancelado / Desierto' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'
);

const pillClass = (status) => {
  if (status === 'completado') return 'bg-green-500 text-white';
  if (status === 'activo') return 'bg-accent text-white ring-4 ring-blue-100';
  return 'bg-gray-200 text-gray-400';
};
</script>
