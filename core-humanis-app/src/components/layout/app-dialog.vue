<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="dialogState.visible"
        class="ch-dialog-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`dialog-title-${uid}`"
        @mousedown.self="_resolve(false)"
        @keydown.esc="_resolve(false)"
      >
        <div class="ch-dialog" :class="`ch-dialog--${dialogState.variant}`">
          <!-- Icono de cabecera -->
          <div class="ch-dialog__icon-wrap" :class="`ch-dialog__icon-wrap--${dialogState.variant}`">
            <span class="ch-dialog__icon" aria-hidden="true">
              <template v-if="dialogState.variant === 'danger'">🗑️</template>
              <template v-else-if="dialogState.variant === 'warning'">⚠️</template>
              <template v-else-if="dialogState.variant === 'success'">✅</template>
              <template v-else>ℹ️</template>
            </span>
          </div>

          <!-- Contenido -->
          <div class="ch-dialog__body">
            <h3 :id="`dialog-title-${uid}`" class="ch-dialog__title">
              {{ dialogState.title }}
            </h3>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <p class="ch-dialog__message" v-html="dialogState.message" />
          </div>

          <!-- Acciones -->
          <div class="ch-dialog__actions">
            <button
              v-if="dialogState.type === 'confirm'"
              type="button"
              class="btn btn--ghost ch-dialog__btn-cancel"
              @click="_resolve(false)"
            >
              {{ dialogState.cancelLabel }}
            </button>
            <button
              type="button"
              class="btn ch-dialog__btn-confirm"
              :class="`ch-dialog__btn-confirm--${dialogState.variant}`"
              @click="_resolve(true)"
            >
              {{ dialogState.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { getCurrentInstance } from 'vue';
import { useDialog } from '../../composables/useDialog';

const { dialogState, _resolve } = useDialog();
const uid = getCurrentInstance()?.uid ?? Math.random().toString(36).slice(2);
</script>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────────── */
.ch-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(11, 37, 69, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* ── Panel ──────────────────────────────────────────────────────────────── */
.ch-dialog {
  background: var(--bg-card, #fff);
  border-radius: var(--radius-lg, 14px);
  box-shadow: var(--shadow-xl,
    0 20px 25px -5px rgba(11,37,69,.15),
    0 10px 10px -5px rgba(11,37,69,.08));
  width: 100%;
  max-width: 440px;
  overflow: hidden;
  border-top: 4px solid var(--color-warning, #F59E0B);
}

.ch-dialog--danger  { border-top-color: var(--color-danger, #EF4444); }
.ch-dialog--success { border-top-color: var(--color-success, #10B981); }
.ch-dialog--info    { border-top-color: var(--color-info, #3B82F6); }
.ch-dialog--warning { border-top-color: var(--color-warning, #F59E0B); }

/* ── Icono ──────────────────────────────────────────────────────────────── */
.ch-dialog__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1.5rem 0;
}

.ch-dialog__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  font-size: 1.5rem;
  background: var(--color-warning-bg, #FFFBEB);
}

.ch-dialog__icon-wrap--danger  .ch-dialog__icon { background: var(--color-danger-bg, #FEF2F2); }
.ch-dialog__icon-wrap--success .ch-dialog__icon { background: var(--color-success-bg, #ECFDF5); }
.ch-dialog__icon-wrap--info    .ch-dialog__icon { background: var(--color-info-bg, #EFF6FF); }

/* ── Cuerpo ─────────────────────────────────────────────────────────────── */
.ch-dialog__body {
  padding: 1rem 1.75rem 0;
  text-align: center;
}

.ch-dialog__title {
  font-family: 'Inter', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main, #0F172A);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.ch-dialog__message {
  font-size: 0.9rem;
  color: var(--text-muted, #64748B);
  line-height: 1.6;
}

/* ── Acciones ───────────────────────────────────────────────────────────── */
.ch-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.75rem 1.5rem;
}

.ch-dialog__btn-cancel {
  color: var(--text-muted, #64748B);
  border: 1px solid var(--border-light, #E2E8F0);
}

.ch-dialog__btn-cancel:hover {
  background: var(--bg-subtle, #F1F5F9);
  border-color: var(--border-focus, #94A3B8);
}

/* Confirmación – variantes de color */
.ch-dialog__btn-confirm {
  color: #fff;
  border: none;
  min-width: 100px;
}

.ch-dialog__btn-confirm--warning {
  background: var(--color-warning, #F59E0B);
}
.ch-dialog__btn-confirm--warning:hover {
  background: #D97706;
}

.ch-dialog__btn-confirm--danger {
  background: var(--color-danger, #EF4444);
}
.ch-dialog__btn-confirm--danger:hover {
  background: #DC2626;
}

.ch-dialog__btn-confirm--success {
  background: var(--color-success, #10B981);
}
.ch-dialog__btn-confirm--success:hover {
  background: #059669;
}

.ch-dialog__btn-confirm--info {
  background: var(--color-primary-700, #134074);
}
.ch-dialog__btn-confirm--info:hover {
  background: var(--color-primary-800, #13315C);
}

/* ── Transición ─────────────────────────────────────────────────────────── */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
