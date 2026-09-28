<template>
  <div v-if="route.name === 'login'" class="app-layout app-layout--login">
    <router-view />
  </div>

  <div v-else class="app-layout" :data-sidebar-visible="isSidebarVisible">
    <!-- Overlay oscuro en móvil cuando el Sidebar está abierto -->
    <div 
      v-if="isSidebarVisible && isMobile" 
      class="sidebar-overlay" 
      @click="isSidebarVisible = false"
    ></div>

    <AppSidebar @navigate="handleNavigation" />

    <div class="main-content-wrapper">
      <AppHeader @toggle-sidebar="toggleSidebar" />
      <main class="content-area">
        <router-view />
      </main>
      <footer class="app-footer">
        <div class="footer-container">
          <span>&copy; 2026 Secretaría de Comunicación Social de la Presidencia (SCSPR) &bull; Unidad de Recursos Humanos</span>
          <span class="footer-version">Core Humanis v{{ APP_VERSION }} ({{ APP_STAGE }})</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from './components/layout/app-sidebar.vue';
import AppHeader from './components/layout/app-header.vue';
import { APP_VERSION, APP_STAGE } from './config/version';

const route = useRoute();
const isSidebarVisible = ref(true);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);

const isMobile = computed(() => windowWidth.value < 992);

const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value;
};

const handleNavigation = () => {
  if (isMobile.value) {
    isSidebarVisible.value = false;
  }
};

const checkScreenSize = () => {
  if (typeof window === 'undefined') return;
  windowWidth.value = window.innerWidth;
  if (!isMobile.value) {
    isSidebarVisible.value = true;
  } else {
    isSidebarVisible.value = false;
  }
};

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreenSize);
  }
});
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  background-color: var(--color-bg-page, #f8fafc);
}

.app-layout--login {
  display: block;
  height: auto;
  min-height: 100vh;
  overflow-y: auto;
}

.main-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  min-width: 0;
}

.content-area {
  flex: 1;
  padding: 1.5rem;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}

.app-footer {
  margin-top: auto;
  background: #ffffff;
  border-top: 1px solid var(--color-border-light, #e2e8f0);
  padding: 0.85rem 1.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
}

.footer-container {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.footer-version {
  font-weight: 600;
  color: var(--color-institucional, #0c2340);
}

/* Ocultar / Deslizar Sidebar */
.app-layout[data-sidebar-visible='false'] :deep(.sidebar) {
  transform: translateX(-100%);
  margin-right: -280px;
}

/* Comportamiento móvil (< 992px) */
@media (max-width: 991.98px) {
  .app-layout :deep(.sidebar) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1040;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.25);
  }

  .app-layout[data-sidebar-visible='false'] :deep(.sidebar) {
    margin-right: 0;
  }

  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1035;
    transition: opacity 0.25s ease-in-out;
  }

  .content-area {
    padding: 1rem;
  }
}
</style>
