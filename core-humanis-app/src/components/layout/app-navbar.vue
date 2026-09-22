<template>
  <header class="navbar-wrapper">
    <!-- Barra Superior Institucional -->
    <div class="top-banner">
      <div class="top-banner-content">
        <div class="gov-identity">
          <span class="gov-crest">🇬🇹</span>
          <span class="gov-text">Gobierno de Guatemala &bull; Secretaría de Comunicación Social de la Presidencia</span>
        </div>
        <div class="top-meta">
          <span class="meta-tag">Ola 4 &bull; Talento, Desempeño & BI</span>
        </div>
      </div>
    </div>

    <!-- Navegación Principal SOTA -->
    <nav class="main-navbar">
      <div class="navbar-container">
        <!-- Logo y Título -->
        <router-link to="/collaborators" class="brand-link">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="brand-info">
            <span class="brand-title">CORE HUMANIS</span>
            <span class="brand-sub">Recursos Humanos &bull; SCSPR</span>
          </div>
        </router-link>

        <!-- Enlaces de Navegación Condicionados por Rol (Ocultos en pantalla de Login) -->
        <div v-if="route.name !== 'login'" class="nav-links">
          <!-- 1. Flujo Colaborador Institucional -->
          <template v-if="authStore.isColaborador">
            <router-link to="/portal" class="nav-item nav-item--highlight" active-class="active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Mi Portal de Autogestión</span>
            </router-link>
          </template>

          <!-- 2. Flujo Auditor Interno / Fiscalizador CGC -->
          <template v-else-if="authStore.isAuditor">
            <router-link to="/collaborators" class="nav-item" active-class="active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>Expedientes Fiscalizados</span>
            </router-link>

            <router-link to="/alerts" class="nav-item" active-class="active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Vencimientos CGC</span>
            </router-link>

            <router-link to="/audit-logs" class="nav-item" active-class="active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Pista de Auditoría</span>
            </router-link>
          </template>

          <!-- 3. Flujo RRHH (Jefa de RRHH / Analista / Administrador TI) -->
          <template v-else>
            <router-link to="/collaborators" class="nav-item" active-class="active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>Directorio de Personal</span>
            </router-link>

            <router-link to="/certificates" class="nav-item" active-class="active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Constancias QR</span>
            </router-link>

            <!-- Menú Desplegable Elegante: Gestión de Tiempo -->
            <div
              ref="timeMenuRef"
              class="dropdown-wrapper"
              @mouseenter="onTimeMenuEnter"
              @mouseleave="onTimeMenuLeave"
            >
              <button
                type="button"
                class="nav-item dropdown-toggle"
                :class="{ 'active': isTimeRouteActive || isTimeMenuOpen }"
                @click="toggleTimeMenu"
                aria-haspopup="true"
                :aria-expanded="isTimeMenuOpen"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Control de Tiempo</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <div v-show="isTimeMenuOpen" class="dropdown-menu shadow-card">
                <router-link to="/vacations" class="dropdown-item" active-class="dropdown-item--active" @click="closeAllMenus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                  </svg>
                  <div>
                    <div class="dropdown-title">Vacaciones & Saldos</div>
                    <div class="dropdown-desc">Kardex institucional y solicitudes</div>
                  </div>
                </router-link>

                <router-link to="/leaves" class="dropdown-item" active-class="dropdown-item--active" @click="closeAllMenus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  <div>
                    <div class="dropdown-title">Licencias & Permisos</div>
                    <div class="dropdown-desc">Médicas IGSS y justificaciones</div>
                  </div>
                </router-link>

                <router-link to="/attendance" class="dropdown-item" active-class="dropdown-item--active" @click="closeAllMenus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <div>
                    <div class="dropdown-title">Marcajes & Horarios</div>
                    <div class="dropdown-desc">Biometría y aprobación de retardos</div>
                  </div>
                </router-link>
              </div>
            </div>

            <!-- Menú Desplegable Elegante: Nóminas & Legal (Ola 3) -->
            <div
              ref="compensationMenuRef"
              class="dropdown-wrapper"
              @mouseenter="onCompMenuEnter"
              @mouseleave="onCompMenuLeave"
            >
              <button
                type="button"
                class="nav-item dropdown-toggle"
                :class="{ 'active': isCompensationRouteActive || isCompensationMenuOpen }"
                @click="toggleCompensationMenu"
                aria-haspopup="true"
                :aria-expanded="isCompensationMenuOpen"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>Nóminas & Legal</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <div v-show="isCompensationMenuOpen" class="dropdown-menu shadow-card">
                <router-link to="/payrolls" class="dropdown-item" active-class="dropdown-item--active" @click="closeAllMenus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <line x1="6" y1="8" x2="18" y2="8"></line>
                    <line x1="6" y1="12" x2="18" y2="12"></line>
                    <line x1="6" y1="16" x2="12" y2="16"></line>
                  </svg>
                  <div>
                    <div class="dropdown-title">Nóminas & Compensaciones</div>
                    <div class="dropdown-desc">Planillas, retenciones y dispersión</div>
                  </div>
                </router-link>

                <router-link to="/personnel-actions" class="dropdown-item" active-class="dropdown-item--active" @click="closeAllMenus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="17 11 19 13 23 9"></polyline>
                  </svg>
                  <div>
                    <div class="dropdown-title">Acciones de Personal</div>
                    <div class="dropdown-desc">Nombramientos, ascensos y DJP CGC</div>
                  </div>
                </router-link>

                <router-link to="/disciplinary" class="dropdown-item" active-class="dropdown-item--active" @click="closeAllMenus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <div>
                    <div class="dropdown-title">Régimen Disciplinario</div>
                    <div class="dropdown-desc">Faltas, audiencias y resoluciones</div>
                  </div>
                </router-link>
              </div>
            </div>

            <!-- Menú Desplegable Elegante: Dirección & Talento (Ola 4) -->
            <div
              ref="talentMenuRef"
              class="dropdown-wrapper"
              @mouseenter="onTalentMenuEnter"
              @mouseleave="onTalentMenuLeave"
            >
              <button
                type="button"
                class="nav-item dropdown-toggle"
                :class="{ 'active': isTalentRouteActive || isTalentMenuOpen }"
                @click="toggleTalentMenu"
                aria-haspopup="true"
                :aria-expanded="isTalentMenuOpen"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Dirección & Talento</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <div v-show="isTalentMenuOpen" class="dropdown-menu shadow-card">
                <router-link to="/recruitments" class="dropdown-item" active-class="dropdown-item--active" @click="closeAllMenus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <div>
                    <div class="dropdown-title">Reclutamiento & Selección</div>
                    <div class="dropdown-desc">Convocatorias y ternas de mérito</div>
                  </div>
                </router-link>

                <router-link to="/evaluations" class="dropdown-item" active-class="dropdown-item--active" @click="closeAllMenus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <div>
                    <div class="dropdown-title">Evaluación del Desempeño</div>
                    <div class="dropdown-desc">Escala ONSEC, TDR y planes de mejora</div>
                  </div>
                </router-link>

                <router-link to="/executive-dashboard" class="dropdown-item" active-class="dropdown-item--active" @click="closeAllMenus">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  <div>
                    <div class="dropdown-title">Dashboard BI & LAIP</div>
                    <div class="dropdown-desc">Masa salarial y Art. 10 Num. 4</div>
                  </div>
                </router-link>
              </div>
            </div>

            <router-link to="/alerts" class="nav-item" active-class="active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Semáforos</span>
              <span v-if="alertasStats.vencidos > 0" class="badge badge-rojo badge-count">
                {{ alertasStats.vencidos }}
              </span>
            </router-link>

            <router-link to="/portal" class="nav-item" active-class="active"
              title="Vista preliminar de portal del empleado">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Portal</span>
            </router-link>

            <router-link to="/audit-logs" class="nav-item" active-class="active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Auditoría</span>
            </router-link>
          </template>
        </div>

        <!-- Perfil con Menú Desplegable SOTA (Oculto en pantalla de Login) -->
        <div v-if="route.name !== 'login'" class="user-role-section">
          <div ref="userMenuRef" class="user-menu-wrapper">
            <button type="button" class="user-pill-btn" :class="{ 'user-pill-btn--active': isUserMenuOpen }"
              @click="toggleUserMenu" aria-label="Menú de cuenta de usuario" aria-haspopup="true">
              <div class="avatar-circle avatar-circle--sm">
                {{ (authStore.user?.nombres || 'M').charAt(0) }}
              </div>
              <div class="user-text">
                <span class="user-name">{{ authStore.user?.nombres || 'Usuario' }}</span>
                <span class="user-role">{{ authStore.rolNombre }}</span>
              </div>
              <svg class="user-chevron" :class="{ 'user-chevron--rotate': isUserMenuOpen }" width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <!-- Popover / Menú Desplegable de Usuario -->
            <div v-show="isUserMenuOpen" class="user-dropdown-menu glass-panel shadow-lg">
              <!-- Encabezado de Perfil Institucional -->
              <div class="user-dropdown-header">
                <div class="avatar-circle avatar-circle--lg">
                  {{ (authStore.user?.nombres || 'M').charAt(0) }}
                </div>
                <div class="user-dropdown-profile">
                  <div class="user-dropdown-name">{{ authStore.user?.nombres || 'Usuario Institucional' }}</div>
                  <div class="user-dropdown-email">{{ authStore.user?.email || 'usuario@scspr.gob.gt' }}</div>
                  <span class="badge badge-subtle user-dropdown-badge">{{ authStore.rolNombre }}</span>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <!-- Acciones de Perfil -->
              <div class="user-dropdown-links">
                <router-link to="/portal" class="user-dropdown-item" @click="isUserMenuOpen = false">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Mi Expediente & Portal</span>
                </router-link>

                <router-link v-if="authStore.isColaborador" to="/vacations" class="user-dropdown-item" @click="isUserMenuOpen = false">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                  </svg>
                  <span>Mis Vacaciones</span>
                </router-link>
              </div>

              <div class="dropdown-divider"></div>

              <!-- Cerrar Sesión -->
              <button type="button" class="user-dropdown-item user-dropdown-item--logout" @click="handleLogout">
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
        <div v-else class="login-banner-tag">
          <span class="portal-badge-pill">Portal Institucional de Autenticación & Acceso</span>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.store";
import { useCollaboratorsStore } from "../../stores/collaborators.store";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const colabStore = useCollaboratorsStore();

const isTimeMenuOpen = ref(false);
const isCompensationMenuOpen = ref(false);
const isTalentMenuOpen = ref(false);
const isUserMenuOpen = ref(false);

const timeMenuRef = ref(null);
const compensationMenuRef = ref(null);
const talentMenuRef = ref(null);
const userMenuRef = ref(null);

let timeMenuTimeout = null;
let compMenuTimeout = null;
let talentMenuTimeout = null;

const alertasStats = computed(() => colabStore.alertasStats);

const isTimeRouteActive = computed(() => {
  return ["vacations", "leaves", "attendance"].includes(route.name);
});

const isCompensationRouteActive = computed(() => {
  return ["payrolls", "payroll-detail", "personnel-actions", "disciplinary"].includes(route.name);
});

const isTalentRouteActive = computed(() => {
  return ["recruitments", "evaluations", "executive-dashboard"].includes(route.name);
});

const onTimeMenuEnter = () => {
  if (timeMenuTimeout) clearTimeout(timeMenuTimeout);
  if (compMenuTimeout) clearTimeout(compMenuTimeout);
  if (talentMenuTimeout) clearTimeout(talentMenuTimeout);
  isCompensationMenuOpen.value = false;
  isTalentMenuOpen.value = false;
  isTimeMenuOpen.value = true;
};

const onTimeMenuLeave = () => {
  if (timeMenuTimeout) clearTimeout(timeMenuTimeout);
  timeMenuTimeout = setTimeout(() => {
    isTimeMenuOpen.value = false;
  }, 250);
};

const toggleTimeMenu = () => {
  if (timeMenuTimeout) clearTimeout(timeMenuTimeout);
  isTimeMenuOpen.value = !isTimeMenuOpen.value;
  if (isTimeMenuOpen.value) {
    isCompensationMenuOpen.value = false;
    isTalentMenuOpen.value = false;
    isUserMenuOpen.value = false;
  }
};

const onCompMenuEnter = () => {
  if (timeMenuTimeout) clearTimeout(timeMenuTimeout);
  if (compMenuTimeout) clearTimeout(compMenuTimeout);
  if (talentMenuTimeout) clearTimeout(talentMenuTimeout);
  isTimeMenuOpen.value = false;
  isTalentMenuOpen.value = false;
  isCompensationMenuOpen.value = true;
};

const onCompMenuLeave = () => {
  if (compMenuTimeout) clearTimeout(compMenuTimeout);
  compMenuTimeout = setTimeout(() => {
    isCompensationMenuOpen.value = false;
  }, 250);
};

const toggleCompensationMenu = () => {
  if (compMenuTimeout) clearTimeout(compMenuTimeout);
  isCompensationMenuOpen.value = !isCompensationMenuOpen.value;
  if (isCompensationMenuOpen.value) {
    isTimeMenuOpen.value = false;
    isTalentMenuOpen.value = false;
    isUserMenuOpen.value = false;
  }
};

const onTalentMenuEnter = () => {
  if (timeMenuTimeout) clearTimeout(timeMenuTimeout);
  if (compMenuTimeout) clearTimeout(compMenuTimeout);
  if (talentMenuTimeout) clearTimeout(talentMenuTimeout);
  isTimeMenuOpen.value = false;
  isCompensationMenuOpen.value = false;
  isTalentMenuOpen.value = true;
};

const onTalentMenuLeave = () => {
  if (talentMenuTimeout) clearTimeout(talentMenuTimeout);
  talentMenuTimeout = setTimeout(() => {
    isTalentMenuOpen.value = false;
  }, 250);
};

const toggleTalentMenu = () => {
  if (talentMenuTimeout) clearTimeout(talentMenuTimeout);
  isTalentMenuOpen.value = !isTalentMenuOpen.value;
  if (isTalentMenuOpen.value) {
    isTimeMenuOpen.value = false;
    isCompensationMenuOpen.value = false;
    isUserMenuOpen.value = false;
  }
};

const closeAllMenus = () => {
  if (timeMenuTimeout) clearTimeout(timeMenuTimeout);
  if (compMenuTimeout) clearTimeout(compMenuTimeout);
  if (talentMenuTimeout) clearTimeout(talentMenuTimeout);
  isTimeMenuOpen.value = false;
  isCompensationMenuOpen.value = false;
  isTalentMenuOpen.value = false;
  isUserMenuOpen.value = false;
};

const toggleUserMenu = () => {
  isTimeMenuOpen.value = false;
  isCompensationMenuOpen.value = false;
  isTalentMenuOpen.value = false;
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

const handleClickOutside = (event) => {
  if (timeMenuRef.value && !timeMenuRef.value.contains(event.target)) {
    isTimeMenuOpen.value = false;
  }
  if (compensationMenuRef.value && !compensationMenuRef.value.contains(event.target)) {
    isCompensationMenuOpen.value = false;
  }
  if (talentMenuRef.value && !talentMenuRef.value.contains(event.target)) {
    isTalentMenuOpen.value = false;
  }
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    isUserMenuOpen.value = false;
  }
};

const handleKeyDown = (event) => {
  if (event.key === "Escape") {
    closeAllMenus();
  }
};

onMounted(() => {
  colabStore.fetchAlertas();
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  if (timeMenuTimeout) clearTimeout(timeMenuTimeout);
  if (compMenuTimeout) clearTimeout(compMenuTimeout);
  if (talentMenuTimeout) clearTimeout(talentMenuTimeout);
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeyDown);
});

const handleLogout = () => {
  closeAllMenus();
  authStore.logout();
  router.push("/login");
};
</script>

<style scoped>
.navbar-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.top-banner {
  background: var(--color-primary-900);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.375rem 1.5rem;
}

.top-banner-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gov-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.meta-tag {
  background: rgba(212, 175, 55, 0.2);
  color: #F8E7A2;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.main-navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-light);
  padding: 0.625rem 1.5rem;
  box-shadow: 0 1px 3px rgba(11, 37, 69, 0.04);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary-800), var(--color-primary-600));
  color: white;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(11, 37, 69, 0.3);
}

.brand-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-primary-900);
  display: block;
  line-height: 1.1;
}

.brand-sub {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: all var(--transition-fast);
  text-decoration: none;
}

.nav-item:hover {
  color: var(--color-primary-800);
  background-color: var(--color-primary-100);
}

.nav-item.active {
  color: var(--color-primary-700);
  background-color: var(--color-primary-100);
  font-weight: 600;
}

.nav-item--highlight {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
  color: var(--color-primary-900);
  border: 1px solid rgba(212, 175, 55, 0.4);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(212, 175, 55, 0.15);
}

.nav-item--highlight:hover {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(212, 175, 55, 0.1));
  border-color: rgba(212, 175, 55, 0.6);
}

/* Dropdown para Control de Tiempo */
.dropdown-wrapper {
  position: relative;
  display: inline-block;
}

.dropdown-toggle {
  cursor: pointer;
  background: transparent;
  border: none;
  font-family: inherit;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  min-width: 260px;
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 0.5rem;
  z-index: 150;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  box-shadow: 0 10px 25px rgba(11, 37, 69, 0.12);
  animation: fadeInDown 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Puente invisible para evitar que el cursor pierda foco en el espacio entre botón y menú */
.dropdown-menu::before {
  content: "";
  position: absolute;
  top: -0.75rem;
  left: 0;
  right: 0;
  height: 0.75rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-main);
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--color-primary-50);
  color: var(--color-primary-800);
}

.dropdown-item--active {
  background: var(--color-primary-100);
  color: var(--color-primary-800);
  font-weight: 600;
}

.dropdown-title {
  font-size: 0.8125rem;
  font-weight: 600;
}

.dropdown-desc {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.badge-count {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
}

.user-role-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.user-menu-wrapper {
  position: relative;
  display: inline-block;
}

.user-pill-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.3125rem 0.875rem 0.3125rem 0.375rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.user-pill-btn:hover,
.user-pill-btn--active {
  background: #ffffff;
  border-color: var(--color-primary-300);
  box-shadow: 0 3px 10px rgba(11, 37, 69, 0.08);
}

.user-chevron {
  color: var(--text-muted);
  transition: transform var(--transition-fast);
}

.user-chevron--rotate {
  transform: rotate(180deg);
  color: var(--color-primary-700);
}

.avatar-circle {
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-800), var(--color-primary-600));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(11, 37, 69, 0.2);
}

.avatar-circle--sm {
  width: 32px;
  height: 32px;
  font-size: 0.8125rem;
}

.avatar-circle--lg {
  width: 44px;
  height: 44px;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.user-text {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.15;
  white-space: nowrap;
}

.user-role {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-primary-700);
  line-height: 1.1;
}

/* User Popover / Dropdown Menu */
.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 0.375rem);
  right: 0;
  width: 280px;
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 0.75rem;
  z-index: 200;
  box-shadow: 0 12px 30px rgba(11, 37, 69, 0.15);
  animation: fadeInDown 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.user-dropdown-menu::before {
  content: "";
  position: absolute;
  top: -0.5rem;
  left: 0;
  right: 0;
  height: 0.5rem;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.5rem 0.25rem 0.75rem;
}

.user-dropdown-profile {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  overflow: hidden;
}

.user-dropdown-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary-900);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-dropdown-email {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-dropdown-badge {
  margin-top: 0.25rem;
  align-self: flex-start;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.125rem 0.375rem;
  background: var(--color-primary-50);
  color: var(--color-primary-800);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-full);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-light);
  margin: 0.375rem 0;
}

.user-dropdown-links {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-main);
  text-decoration: none;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.user-dropdown-item:hover {
  background: var(--color-primary-50);
  color: var(--color-primary-800);
}

.user-dropdown-item--logout {
  color: var(--color-danger);
}

.user-dropdown-item--logout:hover {
  background: #fef2f2;
  color: #991b1b;
}

.portal-badge-pill {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary-800);
  background: var(--color-primary-100);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-primary-200);
  letter-spacing: 0.02em;
}

@media (max-width: 1024px) {
  .nav-item span {
    display: none;
  }

  .user-text {
    display: none;
  }
}

/* ==========================================================================
   MD3 ADAPTIVE BREAKPOINTS (COMPACT < 600px & MEDIUM < 840px)
   ========================================================================== */
@media (max-width: 840px) {
  .top-banner {
    padding: 0.25rem 0.75rem;
  }

  .gov-text {
    font-size: 0.6875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
  }

  .top-meta {
    display: none;
  }

  .main-navbar {
    padding: 0.5rem 1rem;
  }

  .navbar-container {
    gap: 0.5rem;
  }

  .brand-sub {
    display: none;
  }

  .brand-title {
    font-size: 0.9375rem;
  }

  .brand-icon {
    width: 32px;
    height: 32px;
  }

  .user-role-section {
    gap: 0.375rem;
  }

  .user-dropdown-menu {
    width: 250px;
  }
}

@media (max-width: 599px) {
  .top-banner {
    padding: 0.25rem 0.5rem;
  }

  .gov-text {
    max-width: 220px;
    font-size: 0.625rem;
  }

  .main-navbar {
    padding: 0.375rem 0.75rem;
  }

  .navbar-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.375rem;
  }

  .brand-link {
    gap: 0.375rem;
  }

  .brand-icon {
    width: 28px;
    height: 28px;
  }

  .brand-title {
    font-size: 0.8125rem;
  }

  .user-role-section {
    margin-left: auto;
    gap: 0.25rem;
  }

  .user-pill-btn {
    padding: 0.2rem 0.5rem 0.2rem 0.25rem;
  }

  .avatar-circle--sm {
    width: 26px;
    height: 26px;
    font-size: 0.6875rem;
  }

  .user-dropdown-menu {
    width: 240px;
    right: -10px;
  }

  .nav-links {
    order: 3;
    width: 100%;
    overflow-x: auto;
    padding-top: 0.375rem;
    margin-top: 0.25rem;
    border-top: 1px solid var(--border-light);
    justify-content: flex-start;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .nav-links::-webkit-scrollbar {
    display: none;
  }

  .nav-links .nav-item span {
    display: inline;
    font-size: 0.6875rem;
  }

  .nav-item {
    padding: 0.25rem 0.5rem;
    white-space: nowrap;
  }
}
</style>
