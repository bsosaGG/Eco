<template>
  <div class="relative" @keydown.escape="cerrar">
    <input
      :value="query"
      type="text"
      :placeholder="placeholder"
      autocomplete="off"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent"
      @input="onInput($event.target.value)"
      @focus="abrir"
      @blur="cerrarConDelay"
    />
    <button
      v-if="modelValue !== '' && modelValue !== null"
      type="button"
      tabindex="-1"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
      @mousedown.prevent="limpiar"
    >
      ✕
    </button>
    <ul
      v-if="mostrando && opcionesFiltradas.length"
      class="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm"
    >
      <li
        v-for="opt in opcionesFiltradas"
        :key="opt.value"
        class="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
        @mousedown.prevent="elegir(opt)"
      >
        {{ opt.label }}
      </li>
    </ul>
    <p
      v-else-if="mostrando && query"
      class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg text-xs text-gray-400 px-3 py-2"
    >
      Sin resultados
    </p>
  </div>
</template>

<script setup>
/**
 * Combobox genérico: input de texto + lista de opciones filtrada en el cliente,
 * para catálogos que son demasiado largos para un <select> cómodo de usar (ej. los
 * 136 renglones presupuestarios, o las partidas). No pega al backend en cada tecla
 * -- filtra sobre las `options` que ya recibió por prop.
 *
 * Uso:
 *   <SearchableSelect
 *     v-model="item.id_renglon"
 *     :options="renglones.map(r => ({ value: r.value, label: `${r.numero_renglon} — ${r.text}` }))"
 *     placeholder="Renglón presupuestario"
 *   />
 */
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: 'Buscar...' },
});
const emit = defineEmits(['update:modelValue']);

const query = ref('');
const mostrando = ref(false);

// Si el modelValue cambia desde afuera (p.ej. autocompletado de MAGA que ya trae el
// renglón resuelto), refleja la etiqueta correspondiente en el input.
const syncQueryFromValue = () => {
  if (props.modelValue === '' || props.modelValue === null || props.modelValue === undefined) {
    query.value = '';
    return;
  }
  const encontrada = props.options.find((o) => String(o.value) === String(props.modelValue));
  query.value = encontrada ? encontrada.label : query.value;
};
watch(() => props.modelValue, syncQueryFromValue, { immediate: true });
watch(
  () => props.options,
  () => {
    if (props.modelValue !== '' && props.modelValue !== null) syncQueryFromValue();
  }
);

const opcionesFiltradas = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

const onInput = (texto) => {
  query.value = texto;
  mostrando.value = true;
  // Escribir invalida la selección anterior hasta que se elija una opción real de
  // la lista -- evita mandar un id que ya no corresponde al texto visible.
  if (props.modelValue !== '') emit('update:modelValue', '');
};
const abrir = () => {
  mostrando.value = true;
};
const cerrar = () => {
  mostrando.value = false;
};
const cerrarConDelay = () => {
  // Delay para que el @mousedown.prevent de una opción (que dispara antes del blur)
  // alcance a registrarse.
  setTimeout(() => {
    mostrando.value = false;
    // Si quedó texto escrito sin seleccionar nada real, se limpia para no dejar un
    // texto "huérfano" que parezca seleccionado sin estarlo.
    if (props.modelValue === '' || props.modelValue === null) {
      query.value = '';
    }
  }, 150);
};
const elegir = (opt) => {
  query.value = opt.label;
  mostrando.value = false;
  emit('update:modelValue', opt.value);
};
const limpiar = () => {
  query.value = '';
  emit('update:modelValue', '');
};
</script>
