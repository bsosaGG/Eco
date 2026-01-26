<template>
  <div class="relative">
    <input
      type="text"
      :value="modelValue"
      @input="handleInput"
      @focus="showSuggestions = true"
      @blur="delayHide"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      :placeholder="placeholder"
    />
    <ul
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto"
    >
      <li
        v-for="(suggestion, index) in suggestions"
        :key="index"
        @mousedown="selectSuggestion(suggestion)"
        class="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
      >
        {{ suggestion }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import juridicaService from '../../services/juridica.service';

const props = defineProps({
  modelValue: String,
  placeholder: String,
  field: String // 'juez', 'oficial', 'organo_jurisdiccional'
});

const emit = defineEmits(['update:modelValue']);

const suggestions = ref([]);
const showSuggestions = ref(false);
let debounceTimeout;

const handleInput = (e) => {
  const val = e.target.value;
  emit('update:modelValue', val);
  
  if (val.length < 2) {
    suggestions.value = [];
    return;
  }

  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(async () => {
    try {
        if(props.field) {
            const res = await juridicaService.getSuggestions(props.field, val);
            suggestions.value = res.data;
        }
    } catch (err) {
        console.error("Error fetching suggestions", err);
    }
  }, 300);
};

const selectSuggestion = (val) => {
  emit('update:modelValue', val);
  showSuggestions.value = false;
};

const delayHide = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};
</script>
