<template>
  <div class="antecedentes-timeline">
    <!-- View Mode -->
    <div v-if="!editing" class="p-4 bg-gray-50 rounded-lg min-h-[100px]">
      <div v-if="parsedEntries.length === 0" class="text-gray-500 italic">
        No hay antecedentes registrados.
      </div>
      <div v-else class="relative border-l-2 border-blue-200 ml-3 space-y-6">
        <div v-for="(entry, index) in sortedEntries" :key="index" class="relative pl-6 group">
          <span class="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></span>
          <div class="mb-1 text-sm font-semibold text-blue-700">
            {{ formatDate(entry.fecha) }}
          </div>
          <div class="text-gray-700 text-base whitespace-pre-wrap leading-relaxed">
            {{ entry.descripcion }}
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="space-y-4">
      <div v-if="parsedEntries.length === 0" class="text-sm text-gray-500 italic p-4 bg-gray-50 rounded text-center">
        Aún no hay antecedentes. Haz clic en "Añadir Antecedente" para comenzar.
      </div>

      <div v-for="(entry, index) in parsedEntries" :key="entry.id"
        class="p-5 bg-white border border-gray-200 rounded-lg shadow-sm relative space-y-4 transition-all">
        <div class="flex justify-between items-center gap-4 border-b pb-3">
          <div class="w-1/2 md:w-1/3">
            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Fecha</label>
            <input type="date" v-model="entry.fecha" @change="emitUpdate"
              class="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
          </div>
          <button @click="removeEntry(index)" title="Eliminar este antecedente"
            class="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Descripción</label>
          <textarea v-model="entry.descripcion" @input="emitUpdate" rows="4"
            class="w-full border border-gray-300 rounded-md p-2.5 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            placeholder="Escribe el antecedente o acontecimiento aquí..."></textarea>
        </div>
      </div>

      <button @click="addEntry" type="button"
        class="w-full py-3 mt-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-semibold text-sm">
        <Plus class="w-5 h-5" /> Añadir Antecedente
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { X, Plus } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  editing: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

// Usamos un ID único temporal para el listado reactivo del DOM (key)
const generateId = () => Math.random().toString(36).substr(2, 9);

const parsedEntries = ref([]);

// Convertimos la información (sea cual sea el origen) a un estado útil para Vue
const initData = () => {
  if (!props.modelValue || props.modelValue === 'No especificado.') {
    parsedEntries.value = [];
    return;
  }

  try {
    const data = JSON.parse(props.modelValue);
    if (Array.isArray(data)) {
      parsedEntries.value = data.map(item => {
        return {
          id: generateId(),
          fecha: item.fecha || '',
          descripcion: item.descripcion || ''
        }
      });
    } else {
      parsedEntries.value = [];
    }
  } catch (e) {
    // Si falla el parseo, asumimos que es un texto legacy (ej. base de datos sin migrar aún)
    parsedEntries.value = [{
      id: generateId(),
      fecha: new Date().toISOString().split('T')[0], // le asignamos "hoy" referencial
      descripcion: props.modelValue
    }];

    // Si estamos editando y había legacy, avisamos al form que hemos transformado el dato a json.
    if (props.editing) {
      emitUpdate();
    }
  }
};

onMounted(() => {
  initData();
});

// Resincronizar desde fuera (por si cargan un borrador de reemplazo de pronto)
watch(() => props.modelValue, (newVal) => {
  // Solo re-renderizamos si el cambio viene puramente de fuera, comparando sin los `id`
  const stringified = JSON.stringify(
    parsedEntries.value.map(({ fecha, descripcion }) => ({ fecha, descripcion }))
  );
  if (newVal !== stringified) {
    initData();
  }
});

// Devolvemos las entradas ordenadas de la más antigua a la más nueva para la línea de tiempo
const sortedEntries = computed(() => {
  return [...parsedEntries.value].sort((a, b) => {
    return new Date(b.fecha) - new Date(a.fecha);
  });
});

// Informamos al padre (editForm) de la sub-estructura como un string JSON
const emitUpdate = () => {
  const dataToSave = parsedEntries.value.map(e => ({
    fecha: e.fecha,
    descripcion: e.descripcion
  }));
  emit('update:modelValue', JSON.stringify(dataToSave));
};

const addEntry = () => {
  parsedEntries.value.push({
    id: generateId(),
    fecha: new Date().toISOString().split('T')[0],
    descripcion: ''
  });
  emitUpdate();
};

const removeEntry = (index) => {
  if (confirm('¿Estás seguro de eliminar este antecedente?')) {
    parsedEntries.value.splice(index, 1);
    emitUpdate();
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Sin fecha';
  // dateStr viene como formato input date -> YYYY-MM-DD
  const [year, month, day] = dateStr.split('-');
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};
</script>
