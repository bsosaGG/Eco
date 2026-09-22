<template>
  <div class="alertas-page">
    <div class="adaptive-bar mb-4">
      <div>
        <h1 class="font-heading">Alertas Tempranas y Semáforos Legales</h1>
        <p class="subtitle">
          Control de Cumplimiento Institucional ante la Contraloría General de Cuentas (CGC) y Vencimientos de Contratos
        </p>
      </div>

      <div class="summary-chips">
        <span class="badge badge-rojo">
          🔴 {{ stats.vencidos }} Documentos Vencidos
        </span>
        <span class="badge badge-amarillo">
          🟡 {{ stats.por_vencer }} Próximos a Vencer (&le; 30 días)
        </span>
      </div>
    </div>

    <!-- Lista de Alertas -->
    <div class="card card-body">
      <h3 class="panel-title">Monitoreo Activo de Finiquitos CGC y Contratos</h3>

      <div class="alerts-list">
        <div
          v-for="a in alertas"
          :key="a.id"
          class="alert-item"
          :class="'border-' + a.color"
        >
          <div class="alert-badge-box">
            <span class="badge" :class="'badge-' + a.color">
              <span class="indicator-dot" :class="a.color"></span>
              {{ a.estado === 'VENCIDO' ? 'VENCIDO' : 'POR VENCER' }}
            </span>
          </div>

          <div class="alert-content">
            <div class="alert-title">
              <strong>{{ a.titulo }}</strong>
            </div>
            <div class="alert-sub">
              Colaborador: <strong>{{ a.colaborador_nombre }}</strong> &bull;
              DPI: {{ a.cui_dpi }} &bull;
              Renglón: <strong>{{ a.renglon }}</strong>
            </div>
            <div class="alert-meta">
              Documento: <span class="font-mono">{{ a.numero_documento }}</span> &bull;
              Fecha de Vencimiento: <strong>{{ a.fecha_vencimiento }}</strong> &bull;
              <span v-if="a.dias_restantes < 0" class="text-danger">
                (Expiró hace {{ Math.abs(a.dias_restantes) }} días)
              </span>
              <span v-else class="text-warning">
                (Faltan {{ a.dias_restantes }} días)
              </span>
            </div>
          </div>

          <div class="alert-action">
            <router-link
              :to="'/collaborators/' + a.colaborador_id"
              class="btn btn-secondary btn-sm"
              title="Ir al expediente digital completo"
            >
              Ficha 360° →
            </router-link>

            <button
              class="btn btn-primary btn-sm"
              @click="atenderAlerta(a)"
              title="Cargar documento vigente o gestionar prórroga"
            >
              Atender Alerta ⚡
            </button>
          </div>
        </div>

        <div v-if="alertas.length === 0" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          🎉 Todos los expedientes y finiquitos de la CGC se encuentran actualmente vigentes.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCollaboratorsStore } from "../stores/collaborators.store";

const router = useRouter();
const colabStore = useCollaboratorsStore();

const alertas = computed(() => colabStore.alertas);
const stats = computed(() => colabStore.alertasStats);

onMounted(() => {
  colabStore.fetchAlertas();
});

const atenderAlerta = (alerta) => {
  // Navega al expediente del colaborador y enfoca el tab de expediente
  router.push({
    path: `/collaborators/${alerta.colaborador_id}`,
  });
};
</script>

<style scoped>
.alertas-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.summary-chips {
  display: flex;
  gap: 0.75rem;
}

.panel-title {
  font-size: 1.125rem;
  color: var(--color-primary-900);
  margin-bottom: 1.25rem;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.125rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-left-width: 4px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
}

.alert-item:hover {
  transform: translateX(3px);
}

.border-rojo { border-left-color: var(--color-danger); background: #FFFDFD; }
.border-amarillo { border-left-color: var(--color-warning); background: #FFFFFD; }

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 0.9375rem;
  color: var(--color-primary-900);
}

.alert-sub {
  font-size: 0.8125rem;
  color: var(--text-main);
  margin-top: 0.25rem;
}

.alert-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.alert-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.font-mono {
  font-family: monospace;
}

@media (max-width: 768px) {
  .alert-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .alert-action {
    width: 100%;
  }

  .alert-action .btn {
    width: 100%;
    justify-content: center;
    min-height: 44px;
  }
}
</style>
