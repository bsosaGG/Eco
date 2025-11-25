<template>
  <img 
    v-if="objectUrl" 
    :src="objectUrl" 
    v-bind="$attrs" 
    @error="handleError"
  />
  <div v-else-if="loading" class="placeholder-image" v-bind="$attrs">
    <!-- Puedes personalizar este placeholder -->
    <span class="spinner-border spinner-border-sm text-secondary" role="status"></span>
  </div>
  <div v-else class="error-image" v-bind="$attrs">
    <!-- Placeholder de error o imagen rota -->
    <i class="bi bi-image text-muted"></i>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, onMounted } from 'vue';
import apiClient from '@/services/api.service';

const props = defineProps<{
  src?: string | null;
}>();

const objectUrl = ref<string | null>(null);
const loading = ref(false);
const error = ref(false);

const revokeUrl = () => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }
};

const loadImage = async () => {
  revokeUrl(); // Limpiar URL anterior si existe
  error.value = false;

  if (!props.src) {
    return;
  }

  loading.value = true;
  try {
    const response = await apiClient.get(props.src, {
      responseType: 'blob',
    });
    
    const blob = response.data;
    objectUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    console.error('Error loading secure image:', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const handleError = () => {
  error.value = true;
};

// Cargar imagen al montar
onMounted(() => {
  loadImage();
});

// Recargar si cambia la prop src
watch(() => props.src, () => {
  loadImage();
});

// Limpieza de memoria obligatoria
onUnmounted(() => {
  revokeUrl();
});
</script>

<style scoped>
.placeholder-image, .error-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
}
</style>
