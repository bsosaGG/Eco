<template>
  <div class="modal modal--open" role="dialog" aria-modal="true">
    <div class="modal__overlay" @click.self="emit('close')">
      <div class="modal__content modal__content--md">
        <div class="modal__header">
          <div>
            <h3 class="modal__title">Actualizar Mi Información & Perfil</h3>
            <p class="modal__subtitle">Datos personales y de contacto registrados en el Expediente Digital Único</p>
          </div>
          <button type="button" class="modal__close-btn" @click="emit('close')" aria-label="Cerrar modal">
            &times;
          </button>
        </div>

        <form @submit.prevent="handleSubmit">
        <div class="modal__body">
          <div v-if="feedbackMsg" class="alert-box alert-box--success mb-3">
            {{ feedbackMsg }}
          </div>
          <div v-if="errorMsg" class="alert-box alert-box--danger mb-3">
            {{ errorMsg }}
          </div>

          <!-- Bloque Identidad Institucional -->
          <div class="profile-summary-card mb-3">
            <div class="profile-summary-card__avatar">👤</div>
            <div class="profile-summary-card__info">
              <strong>{{ authStore.user?.nombres || 'Colaborador SCSPR' }}</strong>
              <small class="text-muted d-block">{{ authStore.rolNombre }} &bull; {{ authStore.user?.email }}</small>
            </div>
          </div>

          <div class="grid grid--2">
            <div class="form-group">
              <label class="form-group__label">Nombres y Apellidos *</label>
              <input
                v-model="form.nombres"
                type="text"
                class="form-group__control"
                required
                placeholder="Nombres completos"
              />
            </div>

            <div class="form-group">
              <label class="form-group__label">Teléfono Personal / Móvil *</label>
              <input
                v-model="form.telefono_personal"
                type="text"
                class="form-group__control"
                required
                placeholder="Ej. 5551-0101"
              />
            </div>
          </div>

          <div class="grid grid--2">
            <div class="form-group">
              <label class="form-group__label">Correo Personal</label>
              <input
                v-model="form.correo_personal"
                type="email"
                class="form-group__control"
                placeholder="correo.personal@ejemplo.com"
              />
            </div>

            <div class="form-group">
              <label class="form-group__label">Correo Institucional (SCSPR)</label>
              <input
                :value="authStore.user?.email"
                type="email"
                class="form-group__control form-group__control--readonly"
                readonly
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-group__label">Dirección de Residencia *</label>
            <input
              v-model="form.direccion_residencia"
              type="text"
              class="form-group__control"
              required
              placeholder="Calle, avenida, zona o colonia"
            />
          </div>

          <div class="grid grid--2">
            <div class="form-group">
              <label class="form-group__label">Departamento</label>
              <select v-model="form.departamento" class="form-group__control">
                <option value="Guatemala">Guatemala</option>
                <option value="Sacatepéquez">Sacatepéquez</option>
                <option value="Chimaltenango">Chimaltenango</option>
                <option value="El Progreso">El Progreso</option>
                <option value="Escuintla">Escuintla</option>
                <option value="Santa Rosa">Santa Rosa</option>
                <option value="Quetzaltenango">Quetzaltenango</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-group__label">Municipio</label>
              <input
                v-model="form.municipio"
                type="text"
                class="form-group__control"
                placeholder="Municipio de residencia"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-group__label">Contacto de Emergencia (Nombre, Parentesco y Teléfono)</label>
            <input
              v-model="form.contacto_emergencia"
              type="text"
              class="form-group__control"
              placeholder="Ej. María Pérez (Esposa - 5555-4321)"
            />
          </div>
        </div>

        <div class="modal__footer">
          <button
            type="button"
            class="btn btn--secondary"
            :disabled="downloading"
            @click="handleDownload"
            title="Descargar mi expediente en formato digital JSON institucional"
          >
            <span>📥 Descargar Expediente</span>
          </button>
          
          <div class="modal__actions-right">
            <button type="button" class="btn btn--neutral" @click="emit('close')">
              Cancelar
            </button>
            <button type="submit" class="btn btn--primary" :disabled="saving">
              <span>{{ saving ? 'Guardando...' : '💾 Guardar Cambios' }}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';

const emit = defineEmits(['close', 'saved']);
const authStore = useAuthStore();

const saving = ref(false);
const downloading = ref(false);
const feedbackMsg = ref('');
const errorMsg = ref('');

const form = reactive({
  nombres: '',
  telefono_personal: '',
  correo_personal: '',
  direccion_residencia: '',
  departamento: 'Guatemala',
  municipio: 'Guatemala',
  contacto_emergencia: '',
});

onMounted(() => {
  if (authStore.user) {
    form.nombres = authStore.user.nombres || '';
    form.telefono_personal = authStore.user.telefono_personal || '5551-0101';
    form.correo_personal = authStore.user.correo_personal || '';
    form.direccion_residencia = authStore.user.direccion_residencia || 'Ciudad de Guatemala';
    form.departamento = authStore.user.departamento || 'Guatemala';
    form.municipio = authStore.user.municipio || 'Guatemala';
    form.contacto_emergencia = authStore.user.contacto_emergencia || '';
  }
});

const handleSubmit = async () => {
  saving.value = true;
  feedbackMsg.value = '';
  errorMsg.value = '';
  try {
    await authStore.updateProfile({ ...form });
    feedbackMsg.value = '¡Información y perfil actualizados exitosamente!';
    emit('saved', { ...form });
    setTimeout(() => {
      emit('close');
    }, 1200);
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Error al actualizar información';
  } finally {
    saving.value = false;
  }
};

const handleDownload = async () => {
  downloading.value = true;
  try {
    await authStore.downloadProfile();
  } catch (err) {
    errorMsg.value = 'Error al descargar archivo del expediente';
  } finally {
    downloading.value = false;
  }
};
</script>

<style scoped>
.modal__content--md {
  max-width: 650px;
  width: 95%;
}

.profile-summary-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-bg-alt, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 8px;
}

.profile-summary-card__avatar {
  font-size: 1.8rem;
}

.profile-summary-card__info strong {
  display: block;
  color: var(--color-institucional, #0c2340);
  font-size: 0.95rem;
}

.form-group__control--readonly {
  background-color: #f1f5f9;
  cursor: not-allowed;
  color: #64748b;
}

.alert-box {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.alert-box--success {
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.alert-box--danger {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.modal__actions-right {
  display: flex;
  gap: 0.75rem;
}
</style>
