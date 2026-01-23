<template>
  <div class="relative">
    <label class="block text-sm font-medium text-gray-700 mb-1">{{ label || 'Actor Jurídico' }}</label>
    
    <!-- Selected State -->
    <div v-if="selectedActor" class="flex items-center justify-between p-2 border border-blue-200 bg-blue-50 rounded-lg">
        <div>
            <p class="text-sm font-medium text-blue-800">{{ selectedActor.nombre }}</p>
            <p class="text-xs text-blue-600">{{ selectedActor.tipo_identificacion }}: {{ selectedActor.identificacion }}</p>
        </div>
        <button @click="clearSelection" class="text-blue-400 hover:text-blue-600">
            <X class="w-4 h-4" />
        </button>
    </div>

    <!-- Search Input -->
    <div v-else class="relative">
       <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-4 w-4 text-gray-400" />
       </div>
      <input
        type="text"
        v-model="searchTerm"
        @input="handleInput"
        @focus="showResults = true"
        @blur="handleBlur"
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        placeholder="Buscar por nombre o identificación..."
      />
    </div>

    <!-- Results Dropdown -->
    <div v-if="showResults && !selectedActor && (results.length > 0 || loading)" class="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
      <div v-if="loading" class="px-4 py-2 text-sm text-gray-500">Buscando...</div>
      <ul v-else>
          <li
            v-for="actor in results"
            :key="actor.id"
            @mousedown.prevent="selectActor(actor)"
            class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
          >
            <p class="text-sm font-medium text-gray-800">{{ actor.nombre }}</p>
            <p class="text-xs text-gray-500">{{ actor.tipo_identificacion }} - {{ actor.identificacion }}</p>
          </li>
      </ul>
       <!-- Quick Create Option (Future enhancement) -->
       <!-- <div class="p-2 border-t border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 text-center text-sm text-blue-600 font-medium">Create New Actor</div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Search, X } from 'lucide-vue-next';
import juridicaService from '../../services/juridica.service';

const props = defineProps({
  modelValue: [Number, String], // ID of the actor
  initialActor: Object, // Optional for pre-filling display
  label: String
});

const emit = defineEmits(['update:modelValue', 'actor-selected']);

const searchTerm = ref('');
const results = ref([]);
const showResults = ref(false);
const loading = ref(false);
const selectedActor = ref(props.initialActor || null);

let debounceTimeout;

const handleInput = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    search();
  }, 300);
};

const search = async () => {
    if (!searchTerm.value || searchTerm.value.length < 2) {
        results.value = [];
        return;
    }
    loading.value = true;
    try {
        const response = await juridicaService.searchActores({ search: searchTerm.value });
        results.value = response.data;
        showResults.value = true;
    } catch (error) {
        console.error("Error searching actors", error);
    } finally {
        loading.value = false;
    }
};

const selectActor = (actor) => {
    selectedActor.value = actor;
    searchTerm.value = '';
    showResults.value = false;
    emit('update:modelValue', actor.id);
    emit('actor-selected', actor);
};

const clearSelection = () => {
    selectedActor.value = null;
    emit('update:modelValue', null);
    emit('actor-selected', null);
};

const handleBlur = () => {
    setTimeout(() => {
        showResults.value = false;
    }, 200);
};

// Sync if parent updates initialActor
watch(() => props.initialActor, (newVal) => {
    if (newVal) selectedActor.value = newVal;
});
</script>
