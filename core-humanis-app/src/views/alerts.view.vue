<template>
  <div class="alertas-page">
    <div class="adaptive-bar mb-4">
      <div>
        <h1 class="font-heading">Alertas Tempranas, Semáforos Legales y Avisos</h1>
        <p class="subtitle">
          Control de Cumplimiento Institucional (Colegiados, CGC, RTU, DPI, Licencias de Piloto y Cumpleaños)
        </p>
      </div>

      <div class="summary-chips">
        <span class="badge badge-rojo">
          🔴 {{ stats.vencidos }} Vencidos
        </span>
        <span class="badge badge-amarillo">
          🟡 {{ stats.por_vencer }} Próximos (&le; 30 días)
        </span>
        <span class="badge badge-info">
          🎂 {{ cumpleanios.length }} Cumpleaños del Mes
        </span>
      </div>
    </div>

    <!-- Filtro de Categorías Tab Grid -->
    <div class="category-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeCategory === 'TODAS' }"
        @click="activeCategory = 'TODAS'"
      >
        📌 Todas las Alertas ({{ alertas.length }})
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeCategory === 'COLEGIADO' }"
        @click="activeCategory = 'COLEGIADO'"
      >
        🎓 Colegiados Activos ({{ stats.colegiados }})
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeCategory === 'FINIQUITO_CGC' }"
        @click="activeCategory = 'FINIQUITO_CGC'"
      >
        ⚖️ Finiquitos CGC ({{ stats.cgc }})
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeCategory === 'RTU_DPI' }"
        @click="activeCategory = 'RTU_DPI'"
      >
        📄 RTU & DPI ({{ stats.rtu_dpi }})
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeCategory === 'LICENCIA_PILOTO' }"
        @click="activeCategory = 'LICENCIA_PILOTO'"
      >
        🚗 Licencias Pilotos ({{ stats.licencias }})
      </button>
      <button 
        class="tab-btn tab-cumple" 
        :class="{ active: activeCategory === 'CUMPLEANIOS' }"
        @click="activeCategory = 'CUMPLEANIOS'"
      >
        🎉 Avisos Cumpleaños ({{ cumpleanios.length }})
      </button>
    </div>

    <!-- Pestaña de Cumpleaños -->
    <div v-if="activeCategory === 'CUMPLEANIOS'" class="card card-body">
      <h3 class="panel-title">🎂 Cumpleañeros del Mes de {{ mesActualNombre }}</h3>
      
      <div v-if="cumpleanios.length > 0" class="birthday-grid">
        <div 
          v-for="c in cumpleanios" 
          :key="c.id" 
          class="birthday-card"
          :class="{ 'is-today': c.es_hoy }"
        >
          <div class="birthday-avatar">
            <span v-if="!c.foto_url" class="avatar-placeholder">{{ c.nombre.charAt(0) }}</span>
            <img v-else :src="c.foto_url" alt="Avatar" class="avatar-img" />
          </div>
          <div class="birthday-info">
            <div class="birthday-name">{{ c.nombre }}</div>
            <div class="birthday-dept">{{ c.unidad }}</div>
            <div class="birthday-date">
              <span v-if="c.es_hoy" class="badge badge-rojo font-bold">🎉 ¡HOY CUMPLE AÑOS!</span>
              <span v-else class="text-muted">🗓️ Día {{ c.dia }} de {{ mesActualNombre }}</span>
            </div>
          </div>
          <div class="birthday-action">
            <router-link :to="'/collaborators/' + c.id" class="btn btn-secondary btn-xs">
              Ver Ficha 360°
            </router-link>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        🎈 No hay cumpleaños registrados para este mes.
      </div>
    </div>

    <!-- Lista de Alertas por Categoría -->
    <div v-else class="card card-body">
      <h3 class="panel-title">
        Monitoreo Activo &bull; {{ getCategoryTitle(activeCategory) }}
      </h3>

      <div class="alerts-list">
        <div
          v-for="a in filteredAlertas"
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
              Unidad: <strong>{{ a.unidad_nombre }}</strong> &bull;
              Renglón: <strong>{{ a.renglon }}</strong>
            </div>
            <div class="alert-meta">
              Documento: <span class="font-mono">{{ a.numero_documento }}</span> &bull;
              Fecha de Vencimiento: <strong>{{ formatDate(a.fecha_vencimiento) }}</strong> &bull;
              <span v-if="a.dias_restantes < 0" class="text-danger font-bold">
                (Expiró hace {{ Math.abs(a.dias_restantes) }} días)
              </span>
              <span v-else class="text-warning font-bold">
                (Faltan {{ a.dias_restantes }} días para vencer)
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
              title="Cargar documento vigente o gestionar actualización"
            >
              Atender Alerta ⚡
            </button>
          </div>
        </div>

        <div v-if="filteredAlertas.length === 0" class="empty-state">
          🎉 Todos los documentos y registros de esta categoría se encuentran actualmente vigentes.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCollaboratorsStore } from "../stores/collaborators.store";

const router = useRouter();
const colabStore = useCollaboratorsStore();

const activeCategory = ref("TODAS");

const alertas = computed(() => colabStore.alertas);
const cumpleanios = computed(() => colabStore.cumpleanios);
const stats = computed(() => colabStore.alertasStats);

const mesActualNombre = computed(() => {
  return new Date().toLocaleDateString("es-GT", { month: "long" }).toUpperCase();
});

const filteredAlertas = computed(() => {
  if (activeCategory.value === "TODAS") return alertas.value;
  return alertas.value.filter((a) => a.categoria === activeCategory.value);
});

onMounted(() => {
  colabStore.fetchAlertas();
});

const getCategoryTitle = (cat) => {
  switch (cat) {
    case "COLEGIADO": return "Alertas de Colegiados Activos (Colegio Profesional)";
    case "FINIQUITO_CGC": return "Control de Finiquito CGC (Vigencia 6 meses)";
    case "RTU_DPI": return "Constancias de RTU (SAT) y Vencimiento DPI";
    case "LICENCIA_PILOTO": return "Licencias de Conducir (Puestos de Piloto)";
    default: return "Listado General de Alertas Tempranas";
  }
};

const formatDate = (dStr) => {
  if (!dStr) return "N/A";
  const d = new Date(dStr);
  return d.toLocaleDateString("es-GT", { year: "numeric", month: "long", day: "numeric" });
};

const atenderAlerta = (alerta) => {
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

.subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.summary-chips {
  display: flex;
  gap: 0.75rem;
}

.category-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.625rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  background: var(--bg-hover, #F3F4F6);
}

.tab-btn.active {
  background: var(--color-primary-900, #0B2545);
  color: #FFFFFF;
  border-color: var(--color-primary-900, #0B2545);
}

.tab-cumple.active {
  background: #E02424;
  border-color: #E02424;
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

.birthday-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.birthday-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.birthday-card.is-today {
  border: 2px solid #E02424;
  background: #FFF5F5;
}

.birthday-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: #0B2545;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.25rem;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.birthday-info {
  flex: 1;
}

.birthday-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-primary-900);
}

.birthday-dept {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.birthday-date {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.font-mono {
  font-family: monospace;
}

.font-bold {
  font-weight: bold;
}

.badge-info {
  background: #E1F5FE;
  color: #0288D1;
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
