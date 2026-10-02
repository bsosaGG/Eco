<template>
  <div v-if="text" class="message" :class="type === 'error' ? 'error' : 'success'" role="alert">
    {{ text }}
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'error' },
  text: { type: String, default: '' },
});
</script>
