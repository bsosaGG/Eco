import { ref } from 'vue';

/**
 * useDialog — Reemplaza confirm() / alert() del navegador con diálogos
 * institucionales de Core Humanis (SCSPR).
 *
 * Uso:
 *   const { confirm, alert } = useDialog();
 *   const ok = await confirm({ title: '...', message: '...' });
 *   await alert({ title: '...', message: '...' });
 */

const dialogState = ref({
  visible: false,
  title: '',
  message: '',
  type: 'confirm',       // 'confirm' | 'alert'
  variant: 'warning',   // 'warning' | 'danger' | 'info' | 'success'
  confirmLabel: 'Aceptar',
  cancelLabel: 'Cancelar',
  resolve: null,
});

export function useDialog() {
  /**
   * Muestra un diálogo de confirmación y devuelve una Promise<boolean>.
   * @param {object} opts
   * @param {string} opts.title
   * @param {string} opts.message
   * @param {string} [opts.variant]  'warning' | 'danger' | 'info' | 'success'
   * @param {string} [opts.confirmLabel]
   * @param {string} [opts.cancelLabel]
   * @returns {Promise<boolean>}
   */
  const confirm = ({
    title = '¿Está seguro?',
    message = '',
    variant = 'warning',
    confirmLabel = 'Aceptar',
    cancelLabel = 'Cancelar',
  } = {}) => {
    return new Promise((resolve) => {
      dialogState.value = {
        visible: true,
        title,
        message,
        type: 'confirm',
        variant,
        confirmLabel,
        cancelLabel,
        resolve,
      };
    });
  };

  /**
   * Muestra un diálogo informativo (solo botón OK).
   * @returns {Promise<void>}
   */
  const alert = ({
    title = 'Aviso',
    message = '',
    variant = 'info',
    confirmLabel = 'Entendido',
  } = {}) => {
    return new Promise((resolve) => {
      dialogState.value = {
        visible: true,
        title,
        message,
        type: 'alert',
        variant,
        confirmLabel,
        cancelLabel: '',
        resolve,
      };
    });
  };

  const _resolve = (value) => {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(value);
    }
    dialogState.value.visible = false;
  };

  return {
    dialogState,
    confirm,
    alert,
    _resolve,
  };
}
