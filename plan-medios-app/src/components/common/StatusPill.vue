<template>
  <span class="status-pill" :class="status">{{ statusLabel(status) }}</span>
</template>

<script setup>
import { statusLabel } from '../../utils/format';

defineProps({ status: { type: String, default: '' } });
</script>
