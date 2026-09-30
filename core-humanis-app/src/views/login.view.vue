<template>
  <div class="login-view page-container">
    <div class="login-wrapper">
      <div class="card glass-panel login-card">
        <div class="login-header">
          <div class="brand-crest">🇬🇹</div>
          <div class="brand-badge">Gobierno de Guatemala &bull; SCSPR</div>
          <h1 class="font-heading login-title">CORE HUMANIS</h1>
          <p class="login-subtitle">
            Sistema de Gestión Integral del Talento Humano y Expediente Digital Único
          </p>
          <div class="divider-gold"></div>
        </div>

        <div class="login-body">
          <div class="alert alert--info mb-4">
            <div class="dev-notice-text">
              <strong>Autenticación Institucional Centralizada:</strong>
              <p class="text-sm mt-1">
                El acceso y los permisos de Core Humanis se gestionan a través del Portal Central de SCSPR en <code>http://localhost:8080/profiles</code>.
              </p>
            </div>
          </div>

          <div class="login-actions">
            <a href="/login" class="btn btn--primary btn--lg btn-enter" style="text-decoration: none; text-align: center; display: block;">
              Ir al Inicio de Sesión Central &rarr;
            </a>
            <a href="/" class="btn btn--secondary btn--lg mt-3" style="text-decoration: none; text-align: center; display: block;">
              Volver al Portal General
            </a>
          </div>
        </div>

        <div class="login-footer">
          <span>Secretaría de Comunicación Social de la Presidencia &bull; República de Guatemala</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  if (authStore.isAuthenticated) {
    if (authStore.isColaborador) {
      router.push("/portal");
    } else if (authStore.isAuditor) {
      router.push("/audit-logs");
    } else {
      router.push("/collaborators");
    }
  }
});
</script>

<style scoped>
.login-view {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.login-wrapper {
  width: 100%;
  max-width: 600px;
}

.login-card {
  padding: 2.5rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-crest {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.brand-badge {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-primary-dark);
  letter-spacing: 0.05em;
}

.login-title {
  font-size: 2rem;
  color: var(--color-primary-dark);
  margin-top: 0.5rem;
  letter-spacing: 0.05em;
}

.login-subtitle {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.divider-gold {
  height: 3px;
  width: 60px;
  background: var(--color-gold, #c5a059);
  margin: 1.5rem auto 0;
  border-radius: 2px;
}

.login-actions {
  margin-top: 2rem;
}

.btn-enter {
  width: 100%;
}

.login-footer {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 2rem;
  border-top: 1px solid var(--color-border-light);
  padding-top: 1rem;
}
</style>
