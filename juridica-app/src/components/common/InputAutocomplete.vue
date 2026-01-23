<template>
  <div class="relative">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <div class="relative">
      <input
        type="text"
        :value="modelValue"
        @input="handleInput"
        @focus="showSuggestions = true"
        @blur="handleBlur"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        :placeholder="placeholder"
      />
      <!-- Loader icon if needed -->
    </div>
    
    <!-- Suggestions Dropdown -->
    <ul v-if="showSuggestions && suggestions.length > 0" class="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
      <li
        v-for="(item, index) in suggestions"
        :key="index"
        @mousedown.prevent="selectItem(item)"
        class="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
      >
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import juridicaService from '../../services/juridica.service';

const props = defineProps({
  modelValue: String,
  label: String,
  placeholder: String,
  field: {
    type: String,
    required: true // 'juez', 'oficial', 'organo_jurisdiccional'
  }
});

const emit = defineEmits(['update:modelValue']);

const suggestions = ref([]);
const showSuggestions = ref(false);
let debounceTimeout;

const handleInput = (e) => {
  const val = e.target.value;
  emit('update:modelValue', val);
  
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchSuggestions(val);
  }, 300);
};

const fetchSuggestions = async (search) => {
  if (!search) {
      suggestions.value = [];
      return;
  }
  try {
    const response = await juridicaService.getSuggestions(props.field, search);
    suggestions.value = response.data;
  } catch (error) {
    console.error("Error fetching suggestions", error);
  }
};

const selectItem = (item) => {
  emit('update:modelValue', item);
  showSuggestions.value = false;
};

const handleBlur = () => {
    // Delay hide to allow click event on suggestion
    setTimeout(() => {
        showSuggestions.value = false;
    }, 200);
};
</script>
