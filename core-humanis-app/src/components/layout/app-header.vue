<template>
  <header class="app-header">
    <div class="app-header__container">
      <!-- Izquierda: Botón Toggle Sidebar y Título Contextual -->
      <div class="app-header__left">
        <button 
          class="app-header__toggle-btn" 
          type="button" 
          @click="emit('toggle-sidebar')" 
          aria-label="Alternar menú lateral"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div class="app-header__context">
          <span class="app-header__badge">Gobierno de Guatemala &bull; SCSPR</span>
          <h1 class="app-header__title">{{ currentSectionTitle }}</h1>
        </div>
      </div>

      <!-- Derecha: Perfil de Usuario, Emulador de Roles y Salida -->
      <div class="app-header__right" ref="menuRef">
        <div class="user-menu-wrapper">
          <button 
            type="button" 
            class="user-menu-btn" 
            :class="{ 'user-menu-btn--active': isMenuOpen }"
            @click="isMenuOpen = !isMenuOpen" 
            aria-haspopup="true" 
            :aria-expanded="isMenuOpen"
          >
            <div class="user-menu-btn__avatar">👤</div>
            <div class="user-menu-btn__meta">
              <span class="user-menu-btn__name">{{ authStore.user?.nombres || authStore.user?.username || 'Administrador SCSPR' }}</span>
              <span class="user-menu-btn__role">{{ authStore.rolNombre }}</span>
            </div>
            <svg class="user-menu-btn__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- Dropdown Popover -->
          <div v-show="isMenuOpen" class="user-dropdown-popover shadow-card">
            <div class="user-dropdown-popover__header">
              <strong class="user-dropdown-popover__name">{{ authStore.user?.nombres || 'Usuario SCSPR' }}</strong>
              <div class="user-dropdown-popover__email">{{ authStore.user?.email || 'rrhh@scspr.gob.gt' }}</div>
              <span class="badge badge--info mt-1">{{ authStore.rolNombre }}</span>
            </div>


            <div class="user-dropdown-popover__actions p-2">
              <button type="button" class="btn btn--sm btn--secondary user-dropdown-action-btn" @click="openProfileModal">
                👤 Actualizar Mi Perfil
              </button>
              <button type="button" class="btn btn--sm btn--neutral user-dropdown-action-btn mt-1" @click="handleDownloadProfile">
                📥 Descargar Expediente
              </button>
            </div>

            <div class="user-dropdown-popover__footer">
              <button type="button" class="btn-logout" @click="handleLogout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Actualizar Perfil y Datos Personales -->
    <ProfileEditModal
      v-if="showProfileModal"
      @close="showProfileModal = false"
      @saved="showProfileModal = false"
    />
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import ProfileEditModal from '../profile-edit.modal.vue';

const emit = defineEmits(['toggle-sidebar']);
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isMenuOpen = ref(false);
const menuRef = ref(null);
const showProfileModal = ref(false);

const titlesMap = {
  collaborators: 'Directorio de Personal & Expediente Digital Único',
  'collaborator-detail': 'Ficha 360° de Colaborador',
  certificates: 'Constancias Laborales con Código QR & Firma SHA-256',
  vacations: 'Control de Vacaciones & Saldos Kardex',
  leaves: 'Licencias Médicas IGSS & Permisos Oficiales',
  attendance: 'Marcajes Biométricos, Retardos & Control de Asistencia',
  payrolls: 'Nóminas & Compensaciones Salariales',
  'payroll-detail': 'Detalle de Planilla Institucional',
  'personnel-actions': 'Acciones de Personal & Nombramientos (DJP CGC)',
  disciplinary: 'Régimen Disciplinario Institucional',
  recruitments: 'Reclutamiento, Convocatorias & Ternas por Oposición',
  evaluations: 'Evaluación del Desempeño (Escala Oficial ONSEC)',
  'executive-dashboard': 'Dashboard Ejecutivo & Portal de Transparencia (LAIP)',
  trainings: 'Capacitaciones Continuas PAC & Diplomas SHA-256',
  'occupational-health': 'Salud y Seguridad Ocupacional (SSO - AG 229-2014)',
  climate: 'Clima Laboral, Cultura y Bienestar (Voto Ciego eNPS)',
  hiring: 'Módulo de Contratación de Personal (Flujo Reglamentario)',
  templates: 'Gestor de Plantillas de Documentos Modificables (DOCX/PDF)',
  alerts: 'Semáforo de Alertas y Vencimientos CGC',
  'audit-logs': 'Pista de Auditoría Forense e Inmutable',
  portal: 'Mi Portal del Colaborador',
  complaints: 'Buzón Institucional de Denuncias Éticas y Laborales (SCSPR)',
};

const currentSectionTitle = computed(() => {
  return titlesMap[route.name] || 'Plataforma Core Humanis';
});


const handleLogout = () => {
  authStore.logout();
  isMenuOpen.value = false;
  router.push('/login');
};

const openProfileModal = () => {
  isMenuOpen.value = false;
  showProfileModal.value = true;
};

const handleDownloadProfile = async () => {
  isMenuOpen.value = false;
  await authStore.downloadProfile();
};

const handleClickOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
  padding: 0.85rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 1020;
}

.app-header__container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1440px;
  margin: 0 auto;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-header__toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 6px;
  background-color: var(--color-bg-alt, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
  color: var(--color-institucional, #0c2340);
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-header__toggle-btn:hover {
  background-color: #e2e8f0;
}

.app-header__context {
  display: flex;
  flex-direction: column;
}

.app-header__badge {
  font-size: 0.7rem;
  color: var(--color-dorado, #c5a059);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.app-header__title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-institucional, #0c2340);
  margin: 0;
}

.user-menu-wrapper {
  position: relative;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.4rem 0.75rem;
  background-color: var(--color-bg-alt, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.user-menu-btn:hover,
.user-menu-btn--active {
  background-color: #e2e8f0;
}

.user-menu-btn__avatar {
  font-size: 1.1rem;
}

.user-menu-btn__meta {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user-menu-btn__name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-institucional, #0c2340);
  line-height: 1.1;
}

.user-menu-btn__role {
  font-size: 0.7rem;
  color: var(--color-text-muted, #64748b);
}

.user-menu-btn__chevron {
  color: var(--color-text-muted, #64748b);
}

.user-dropdown-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 290px;
  background: #ffffff;
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  z-index: 1050;
  overflow: hidden;
}

.user-dropdown-popover__header {
  padding: 12px 16px;
  background: var(--color-bg-alt, #f8fafc);
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
}

.user-dropdown-popover__name {
  font-size: 0.9rem;
  color: var(--color-institucional, #0c2340);
  display: block;
}

.user-dropdown-popover__email {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
}


.user-dropdown-popover__footer {
  padding: 10px 14px;
  background: #ffffff;
}

.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #b91c1c;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  cursor: pointer;
  transition: all 0.15s ease;
}

.user-dropdown-action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 6px;
}

.btn-logout:hover {
  background-color: #fee2e2;
}

@media (max-width: 768px) {
  .app-header__context {
    display: none;
  }
}
</style>
