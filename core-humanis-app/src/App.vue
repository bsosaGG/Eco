<template>
  <div class="app-layout">
    <AppNavbar />
    <main class="main-content">
      <router-view />
    </main>
    <footer class="app-footer">
      <div class="footer-container">
        <span>&copy; 2026 Secretaría de Comunicación Social de la Presidencia (SCSPR) &bull; Unidad de Recursos Humanos</span>
        <span class="footer-version">Core Humanis v{{ APP_VERSION }} ({{ APP_STAGE }})</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import AppNavbar from "./components/layout/app-navbar.vue";
import { APP_VERSION, APP_STAGE } from "./config/version";
</script>

<style scoped>
.app-footer {
  margin-top: auto;
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.footer-version {
  font-weight: 500;
  color: var(--color-primary-700);
}
</style>
