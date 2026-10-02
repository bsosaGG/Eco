<template>
  <div class="summary-field">
    <label :for="inputId">
      <span v-if="fieldId" class="field-id">{{ fieldId }}</span>
      {{ label }}
    </label>

    <textarea v-if="multiline" :id="inputId" ref="control" :value="modelValue" :rows="rows"
      @input="onType($event.target.value)" @blur="review.onBlur"></textarea>
    <input v-else :id="inputId" ref="control" type="text" :value="modelValue" :placeholder="placeholder"
      @input="onType($event.target.value)" @blur="review.onBlur" />

    <slot />

    <div class="language-review" aria-live="polite">
      <p class="language-review-status" :class="statusClass">{{ review.message.value }}</p>

      <div class="language-suggestions">
        <div v-for="s in review.visible.value" :key="suggestionKey(s)" class="language-suggestion">
          <p>
            <span class="language-suggestion-fragment">“{{ s.original_text }}”</span>
            — {{ s.message }}
          </p>
          <div class="language-suggestion-actions">
            <button v-for="r in s.replacements" :key="r" type="button" class="language-accept"
              @click="review.accept(s, r)">Cambiar por “{{ r }}”</button>
            <button type="button" class="language-dictionary"
              @click="review.addToDictionary(s, selectedText())">Agregar al diccionario</button>
            <button type="button" class="language-ignore" @click="review.ignore(s)">Ignorar</button>
          </div>
        </div>
      </div>

      <p v-if="review.dictionaryMessage.value" class="dictionary-message">{{ review.dictionaryMessage.value }}</p>
    </div>

    <span v-if="showCompletion" class="status" :class="modelValue.trim() ? 'status-completed' : 'status-pending'">
      {{ modelValue.trim() ? 'Campo completado' : 'Pendiente de completar' }}
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { suggestionKey, useLanguageReview } from '../../composables/useLanguageReview';

const props = defineProps({
  modelValue: { type: String, default: '' },
  ignoredKeys: { type: Array, default: () => [] },
  inputId: { type: String, required: true },
  label: { type: String, required: true },
  fieldId: { type: String, default: '' },
  multiline: { type: Boolean, default: false },
  rows: { type: Number, default: 4 },
  placeholder: { type: String, default: '' },
  showCompletion: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue', 'update:ignoredKeys']);

const control = ref(null);

// ignoredKeys se comporta como un ref de lectura/escritura sobre el v-model del padre.
const ignored = computed({
  get: () => props.ignoredKeys,
  set: (value) => emit('update:ignoredKeys', value),
});

const review = useLanguageReview({
  getText: () => props.modelValue,
  setText: (value) => emit('update:modelValue', value),
  ignoredKeys: ignored,
});

const statusClass = computed(
  () =>
    ({
      clean: 'language-review-clean',
      warning: 'language-review-warning',
      error: 'language-review-error',
    })[review.status.value] || ''
);

function onType(value) {
  emit('update:modelValue', value);
  review.onInput();
}

function selectedText() {
  const el = control.value;
  return el && el.selectionStart !== el.selectionEnd ? el.value.slice(el.selectionStart, el.selectionEnd) : '';
}

onMounted(() => review.schedule());
</script>
