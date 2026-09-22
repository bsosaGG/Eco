<template>
  <div class="login-view page-container">
    <div class="login-wrapper">
      <!-- Tarjeta Principal de Bienvenida Institucional -->
      <div class="card glass-panel login-card">
        <div class="login-header">
          <div class="brand-crest">🇬🇹</div>
          <div class="brand-badge">Gobierno de Guatemala &bull; SCSPR</div>
          <div class="dev-tag-banner">
            <span class="dev-badge-pulse">● ENTORNO DE DESARROLLO (DEV ONLY)</span>
          </div>
          <h1 class="font-heading login-title">CORE HUMANIS</h1>
          <p class="login-subtitle">
            Sistema de Gestión Integral del Talento Humano y Expediente Digital Único
          </p>
          <div class="divider-gold"></div>
        </div>

        <div class="login-body">
          <div class="alert alert--warning mb-4 dev-notice">
            <div class="dev-notice-icon">🛠️</div>
            <div class="dev-notice-text">
              <strong>Simulador de Sesiones y Roles (Modo Exclusivo de Desarrollo):</strong>
              <span>Esta pantalla es un mockup interactivo para alternar entre perfiles y validar flujos RBAC sin requerir el servidor central SSO de denuncias-scsp. En producción el login se realiza mediante el proveedor de identidad institucional.</span>
            </div>
          </div>

          <h2 class="section-title">
            <span class="step-num">1</span> Selecciona el Perfil para Iniciar Sesión
          </h2>
          <p class="section-desc">
            Selecciona con qué rol institucional deseas emular la navegación y evaluar sus permisos:
          </p>

          <div class="profiles-grid">
            <!-- 1. Jefa de Recursos Humanos -->
            <button 
              type="button" 
              class="profile-card"
              :class="{ 'profile-card--selected': selectedUsername === 'jefa.rrhh' }"
              @click="selectedUsername = 'jefa.rrhh'"
            >
              <div class="profile-avatar avatar-jefa">👩‍💼</div>
              <div class="profile-info">
                <div class="profile-role">Jefa de Recursos Humanos</div>
                <div class="profile-name">Licda. María Elena Morales Paz</div>
                <div class="profile-badges">
                  <span class="role-pill pill-primary">Aprobaciones</span>
                  <span class="role-pill pill-primary">Directorio</span>
                  <span class="role-pill pill-primary">Semáforos CGC</span>
                </div>
                <div class="profile-desc">
                  Supervisión general, aprobación de vacaciones/licencias y monitoreo de finiquitos.
                </div>
              </div>
            </button>

            <!-- 2. Analista de Recursos Humanos -->
            <button 
              type="button" 
              class="profile-card"
              :class="{ 'profile-card--selected': selectedUsername === 'analista.rrhh' }"
              @click="selectedUsername = 'analista.rrhh'"
            >
              <div class="profile-avatar avatar-analista">👨‍💻</div>
              <div class="profile-info">
                <div class="profile-role">Analista de Recursos Humanos</div>
                <div class="profile-name">Lic. Juan Pablo Gómez</div>
                <div class="profile-badges">
                  <span class="role-pill pill-info">Expedientes</span>
                  <span class="role-pill pill-info">Constancias QR</span>
                  <span class="role-pill pill-info">Marcajes</span>
                </div>
                <div class="profile-desc">
                  Gestión operativa diaria, carga de documentos y emisión de constancias laborales.
                </div>
              </div>
            </button>

            <!-- 3. Colaborador Institucional (Empleado) -->
            <button 
              type="button" 
              class="profile-card profile-card--highlight"
              :class="{ 'profile-card--selected': selectedUsername === 'colaborador.011' }"
              @click="selectedUsername = 'colaborador.011'"
            >
              <div class="profile-avatar avatar-colab">👤</div>
              <div class="profile-info">
                <div class="profile-role">Colaborador Institucional (Personal)</div>
                <div class="profile-name">Karina Judith García Ruano</div>
                <div class="profile-badges">
                  <span class="role-pill pill-gold">Portal Autogestión</span>
                  <span class="role-pill pill-gold">Mis Vacaciones</span>
                  <span class="role-pill pill-gold">Mi Asistencia</span>
                </div>
                <div class="profile-desc">
                  Flujo del empleado: consulta de expediente propio, solicitud de vacaciones y marcajes.
                </div>
              </div>
            </button>

            <!-- 4. Auditor de la CGC -->
            <button 
              type="button" 
              class="profile-card"
              :class="{ 'profile-card--selected': selectedUsername === 'auditor.cgc' }"
              @click="selectedUsername = 'auditor.cgc'"
            >
              <div class="profile-avatar avatar-auditor">🔍</div>
              <div class="profile-info">
                <div class="profile-role">Auditor Interno / Fiscalizador CGC</div>
                <div class="profile-name">Lic. Fernando Ruiz</div>
                <div class="profile-badges">
                  <span class="role-pill pill-purple">Solo Lectura</span>
                  <span class="role-pill pill-purple">Auditoría Forense</span>
                </div>
                <div class="profile-desc">
                  Acceso estricto a consulta de contratos, finiquitos y pista inmutable de auditoría.
                </div>
              </div>
            </button>
          </div>

          <div class="login-actions">
            <button 
              class="btn btn--primary btn--lg btn-enter" 
              :disabled="loading" 
              @click="handleLogin"
            >
              <span v-if="loading">Conectando...</span>
              <span v-else>Acceder al Sistema con este Perfil &rarr;</span>
            </button>
          </div>
        </div>

        <div class="login-footer">
          <span>Secretaría de Comunicación Social de la Presidencia &bull; República de Guatemala</span>
          <span>Seguridad Normativa &bull; ONSEC &bull; CGC &bull; Ley de Acceso a la Información Pública</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { useCollaboratorsStore } from "../stores/collaborators.store";

const router = useRouter();
const authStore = useAuthStore();
const colabStore = useCollaboratorsStore();

const selectedUsername = ref("jefa.rrhh");
const loading = ref(false);

async function handleLogin() {
  try {
    loading.value = true;
    await authStore.switchDevRole(selectedUsername.value);
    await colabStore.fetchColaboradores();
    await colabStore.fetchAlertas();

    // Redirigir al flujo apropiado según el rol
    if (authStore.isColaborador) {
      router.push("/portal");
    } else if (authStore.isAuditor) {
      router.push("/audit-logs");
    } else {
      router.push("/collaborators");
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Error al iniciar sesión: " + (error.message || "Verifique conexión"));
  } finally {
    loading.value = false;
  }
}
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
  max-width: 960px;
}

.login-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 30px rgba(11, 37, 69, 0.1);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.login-header {
  text-align: center;
  padding: 2.5rem 2rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary-900), var(--color-primary-800));
  color: white;
}

.brand-crest {
  font-size: 2.5rem;
  margin-bottom: 0.25rem;
}

.brand-badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-gold-400);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.login-title {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
  color: #ffffff;
}

.login-subtitle {
  font-size: 0.9375rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.4;
}

.dev-tag-banner {
  margin: 0.25rem 0 0.5rem;
}

.dev-badge-pulse {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fff;
  background: rgba(239, 68, 68, 0.35);
  border: 1px solid rgba(239, 68, 68, 0.7);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
}

.dev-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-md);
}

.dev-notice-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.dev-notice-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: #92400e;
  line-height: 1.4;
}

.divider-gold {
  width: 60px;
  height: 3px;
  background: var(--color-gold-500);
  margin: 1.5rem auto 0;
  border-radius: var(--radius-full);
}

.login-body {
  padding: 2rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-primary-900);
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-num {
  width: 24px;
  height: 24px;
  background: var(--color-primary-700);
  color: white;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.section-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.profile-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-subtle);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
}

.profile-card:hover {
  border-color: var(--color-primary-400);
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(11, 37, 69, 0.08);
}

.profile-card--selected {
  border-color: var(--color-primary-700);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(11, 37, 69, 0.15);
}

.profile-card--highlight {
  border-color: rgba(212, 175, 55, 0.4);
}

.profile-card--highlight.profile-card--selected {
  border-color: var(--color-gold-600);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.25);
}

.profile-avatar {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  background: #ffffff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.profile-info {
  flex: 1;
}

.profile-role {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-primary-700);
  margin-bottom: 0.25rem;
}

.profile-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 0.5rem;
}

.profile-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.role-pill {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.pill-primary {
  background: var(--color-primary-100);
  color: var(--color-primary-800);
}

.pill-info {
  background: #e0f2fe;
  color: #0369a1;
}

.pill-gold {
  background: #fef3c7;
  color: #92400e;
}

.pill-purple {
  background: #f3e8ff;
  color: #6b21a8;
}

.profile-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.login-actions {
  display: flex;
  justify-content: center;
}

.btn-enter {
  padding: 0.875rem 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
}

.login-footer {
  padding: 1rem 2rem;
  background: var(--bg-subtle);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  font-size: 0.6875rem;
  color: var(--text-muted);
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .login-footer {
    flex-direction: column;
    text-align: center;
  }
}
</style>
