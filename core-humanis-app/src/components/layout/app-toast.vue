<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-item--${toast.type}`"
      >
        <span class="toast-item__icon">
          <template v-if="toast.type === 'success'">✅</template>
          <template v-else-if="toast.type === 'error'">❌</template>
          <template v-else-if="toast.type === 'warning'">⚠️</template>
          <template v-else>ℹ️</template>
        </span>
        <span class="toast-item__message">{{ toast.message }}</span>
        <button type="button" class="toast-item__close" @click="removeToast(toast.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '../../composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  width: calc(100vw - 40px);
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  border-left: 4px solid #3b82f6;
  color: #0f172a;
}

.toast-item--success {
  border-left-color: #10b981;
  background-color: #f0fdf4;
  color: #166534;
}

.toast-item--error {
  border-left-color: #ef4444;
  background-color: #fef2f2;
  color: #991b1b;
}

.toast-item--warning {
  border-left-color: #f59e0b;
  background-color: #fffbeb;
  color: #92400e;
}

.toast-item--info {
  border-left-color: #3b82f6;
  background-color: #eff6ff;
  color: #1e40af;
}

.toast-item__icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.toast-item__message {
  flex: 1;
}

.toast-item__close {
  background: none;
  border: none;
  font-size: 1rem;
  color: currentColor;
  opacity: 0.6;
  cursor: pointer;
  padding: 0 4px;
}

.toast-item__close:hover {
  opacity: 1;
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
</style>
