<template>
  <aside class="sidebar">
    <!-- Encabezado de la barra lateral -->
    <div class="sidebar__header">
      <a href="/" class="sidebar__brand" title="Volver al Portal General SCSPR">
        <span class="sidebar__brand-flag">🇬🇹</span>
        <div class="sidebar__brand-info">
          <span class="sidebar__brand-title">Recursos Humanos</span>
          <span class="sidebar__brand-sub">Core Humanis &bull; SCSPR</span>
        </div>
      </a>
      <a href="/" class="sidebar__portal-link" title="Regresar al Portal Central de Administración">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Portal General</span>
      </a>
    </div>

    <!-- Menú de Navegación Vertical -->
    <div class="sidebar__nav-container">
      <ul class="sidebar__menu">
        <!-- ROL: Colaborador Institucional -->
        <template v-if="authStore.isColaborador">
          <li class="sidebar__item">
            <router-link to="/portal" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Mi Portal de Autogestión</span>
            </router-link>
          </li>
          <li class="sidebar__item">
            <router-link to="/complaints" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              <span>Buzón de Denuncias</span>
            </router-link>
          </li>
        </template>

        <!-- ROL: Auditor Interno / Fiscalizador CGC -->
        <template v-else-if="authStore.isAuditor">
          <li class="sidebar__item">
            <router-link to="/collaborators" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>Expedientes Fiscalizados</span>
            </router-link>
          </li>
          <li class="sidebar__item">
            <router-link to="/alerts" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Vencimientos CGC</span>
            </router-link>
          </li>
          <li class="sidebar__item">
            <router-link to="/audit-logs" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Pista de Auditoría</span>
            </router-link>
          </li>
        </template>

        <!-- ROL: RRHH (Jefa de RRHH / Analista / Administrador TI) -->
        <template v-else>
          <!-- 1. Enlaces Principales -->
          <li class="sidebar__item">
            <router-link to="/collaborators" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>Directorio de Personal</span>
            </router-link>
          </li>

          <li class="sidebar__item">
            <router-link to="/organigram" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v6" />
                <path d="M6 10v4" />
                <path d="M18 10v4" />
                <rect width="8" height="6" x="8" y="2" rx="1" />
                <rect width="6" height="6" x="3" y="14" rx="1" />
                <rect width="6" height="6" x="15" y="14" rx="1" />
                <path d="M6 10h12" />
              </svg>
              <span>Organigramas (En Dev)</span>
            </router-link>
          </li>

          <li class="sidebar__item">
            <router-link to="/hiring" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              <span>Contratación de Personal</span>
            </router-link>
          </li>

          <li class="sidebar__item">
            <router-link to="/certificates" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Constancias QR</span>
            </router-link>
          </li>

          <!-- 2. Submenú: Control de Tiempo -->
          <li class="sidebar__item sidebar__item--group">
            <button 
              type="button" 
              class="sidebar__toggle" 
              :class="{ 'sidebar__toggle--active': isTimeActive }"
              @click="timeOpen = !timeOpen"
            >
              <span class="sidebar__toggle-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Control de Tiempo</span>
              </span>
              <svg 
                class="sidebar__chevron" 
                :class="{ 'sidebar__chevron--open': timeOpen }"
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <ul v-show="timeOpen" class="sidebar__submenu">
              <li>
                <router-link to="/vacations" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Vacaciones & Saldos</small>
                </router-link>
              </li>
              <li>
                <router-link to="/leaves" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Licencias & Permisos</small>
                </router-link>
              </li>
              <li>
                <router-link to="/attendance" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Marcajes & Horarios</small>
                </router-link>
              </li>
            </ul>
          </li>

          <!-- 3. Submenú: Nóminas & Legal -->
          <li class="sidebar__item sidebar__item--group">
            <button 
              type="button" 
              class="sidebar__toggle" 
              :class="{ 'sidebar__toggle--active': isCompensationActive }"
              @click="compOpen = !compOpen"
            >
              <span class="sidebar__toggle-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>Nóminas & Legal</span>
              </span>
              <svg 
                class="sidebar__chevron" 
                :class="{ 'sidebar__chevron--open': compOpen }"
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <ul v-show="compOpen" class="sidebar__submenu">
              <li>
                <router-link to="/payrolls" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Nóminas & Compensaciones</small>
                </router-link>
              </li>
              <li>
                <router-link to="/personnel-actions" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Acciones de Personal</small>
                </router-link>
              </li>
              <li>
                <router-link to="/disciplinary" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Régimen Disciplinario</small>
                </router-link>
              </li>
            </ul>
          </li>

          <!-- 4. Submenú: Dirección & Talento -->
          <li class="sidebar__item sidebar__item--group">
            <button 
              type="button" 
              class="sidebar__toggle" 
              :class="{ 'sidebar__toggle--active': isTalentActive }"
              @click="talentOpen = !talentOpen"
            >
              <span class="sidebar__toggle-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Dirección & Talento</span>
              </span>
              <svg 
                class="sidebar__chevron" 
                :class="{ 'sidebar__chevron--open': talentOpen }"
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <ul v-show="talentOpen" class="sidebar__submenu">
              <li>
                <router-link to="/recruitments" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Reclutamiento & Selección</small>
                </router-link>
              </li>
              <li>
                <router-link to="/evaluations" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Evaluación del Desempeño</small>
                </router-link>
              </li>
              <li>
                <router-link to="/trainings" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Capacitación PAC</small>
                </router-link>
              </li>
              <li>
                <router-link to="/occupational-health" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Salud y Seguridad (SSO)</small>
                </router-link>
              </li>
              <li>
                <router-link to="/climate" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Clima Laboral & eNPS</small>
                </router-link>
              </li>
              <li>
                <router-link to="/executive-dashboard" class="sidebar__sublink" active-class="sidebar__sublink--active" @click="linkClicked">
                  <small>Dashboard BI & LAIP</small>
                </router-link>
              </li>
            </ul>
          </li>

          <!-- 5. Herramientas & Cumplimiento -->
          <li class="sidebar__item">
            <router-link to="/templates" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>Plantillas DOCX</span>
            </router-link>
          </li>

          <li class="sidebar__item">
            <router-link to="/alerts" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Vencimientos CGC</span>
            </router-link>
          </li>

          <li class="sidebar__item">
            <router-link to="/audit-logs" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Pista de Auditoría</span>
            </router-link>
          </li>

          <li class="sidebar__item">
            <router-link to="/complaints" class="sidebar__link" active-class="sidebar__link--active" @click="linkClicked">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              <span>Buzón de Denuncias</span>
            </router-link>
          </li>
        </template>

        <!-- Acceso Global al Simulador de Perfiles (Dev Mode) -->
        <li class="sidebar__item sidebar__item--separator">
          <router-link to="/login" class="sidebar__link sidebar__link--dev" title="Simulador de Perfiles Institucionales" @click="linkClicked">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Simulador de Perfiles</span>
            <span class="badge--gold-dev">DEV</span>
          </router-link>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';

const emit = defineEmits(['navigate']);
const route = useRoute();
const authStore = useAuthStore();

const isTimeActive = computed(() => ['vacations', 'leaves', 'attendance'].includes(route.name));
const isCompensationActive = computed(() => ['payrolls', 'payroll-detail', 'personnel-actions', 'disciplinary'].includes(route.name));
const isTalentActive = computed(() => ['recruitments', 'evaluations', 'executive-dashboard', 'trainings', 'occupational-health', 'climate'].includes(route.name));

const timeOpen = ref(true);
const compOpen = ref(true);
const talentOpen = ref(true);

const linkClicked = () => {
  emit('navigate');
};
</script>

<style scoped>
.sidebar {
  width: 280px;
  min-width: 280px;
  height: 100vh;
  background-color: #1e222d;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.3s ease-in-out;
  z-index: 1030;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar__header {
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #ffffff;
}

.sidebar__brand-flag {
  font-size: 1.4rem;
}

.sidebar__brand-info {
  display: flex;
  flex-direction: column;
}

.sidebar__brand-title {
  font-size: 1.1rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.01em;
  color: #ffffff;
}

.sidebar__brand-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}

.sidebar__portal-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #cbd5e1;
  text-decoration: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.06);
  width: fit-content;
  transition: background 0.15s ease;
}

.sidebar__portal-link:hover {
  background-color: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.sidebar__nav-container {
  flex: 1;
  padding: 1rem 0.75rem;
  overflow-y: auto;
}

.sidebar__menu {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar__item {
  width: 100%;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  color: #e2e8f0;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.15s ease;
}

.sidebar__link:hover {
  background-color: #343a40;
  color: #ffffff;
}

.sidebar__link--active {
  background-color: #495057;
  color: #ffffff;
  font-weight: 600;
}

.sidebar__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.75rem;
  color: #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.sidebar__toggle:hover {
  background-color: #343a40;
}

.sidebar__toggle--active {
  color: #c5a059;
}

.sidebar__toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar__chevron {
  transition: transform 0.2s ease;
}

.sidebar__chevron--open {
  transform: rotate(180deg);
}

.sidebar__submenu {
  list-style: none;
  padding: 0.25rem 0 0.25rem 2rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.sidebar__sublink {
  display: block;
  padding: 0.35rem 0.5rem;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.85rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.sidebar__sublink:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.05);
}

.sidebar__sublink--active {
  color: #ffffff;
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar__item--separator {
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar__link--dev {
  color: #c5a059 !important;
  font-weight: 500;
}

.sidebar__link--dev:hover {
  background: rgba(197, 160, 89, 0.12) !important;
  color: #dfba73 !important;
}

.badge--gold-dev {
  margin-left: auto;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.4rem;
  background: rgba(197, 160, 89, 0.2);
  color: #dfba73;
  border: 1px solid rgba(197, 160, 89, 0.4);
  border-radius: 4px;
}
</style>
