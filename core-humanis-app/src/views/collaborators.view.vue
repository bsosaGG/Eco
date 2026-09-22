<template>
  <div class="directorio-page">
    <!-- Encabezado de la Vista -->
    <div class="adaptive-bar mb-4">
      <div>
        <h1 class="font-heading">Directorio Institucional de Personal</h1>
        <p class="subtitle">
          Expediente Digital Único &bull; Renglones 011, 022, 021, 029 y Subgrupo 18 (SCSPR)
        </p>
      </div>

      <div class="adaptive-bar__actions">
        <button v-if="authStore.canWrite" class="btn btn-primary" @click="showNuevoModal = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Colaborador
        </button>
      </div>
    </div>

    <!-- Tarjetas de Métricas de Personal -->
    <div class="grid-adaptive mb-4">
      <div class="stat-card">
        <div class="stat-icon icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="stat-data">
          <span class="stat-val">{{ colabStore.colaboradores.length }}</span>
          <span class="stat-lbl">Total Expedientes Activos</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-teal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        </div>
        <div class="stat-data">
          <span class="stat-val">{{ countRenglon("011") + countRenglon("022") }}</span>
          <span class="stat-lbl">Renglones 011 / 022 (Planilla)</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <div class="stat-data">
          <span class="stat-val">{{ countRenglon("029") + countRenglon("189") + countRenglon("183") }}</span>
          <span class="stat-lbl">029 / Subgrupo 18 (Servicios)</span>
        </div>
      </div>

      <div class="stat-card stat-alert" @click="$router.push('/alerts')">
        <div class="stat-icon icon-amber">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-data">
          <span class="stat-val">{{ colabStore.alertasStats.total }}</span>
          <span class="stat-lbl">Alertas CGC / Vencimientos</span>
        </div>
      </div>
    </div>

    <!-- Filtros Multicriterio -->
    <div class="filters-card card">
      <div class="search-box">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="colabStore.filtros.search"
          @input="colabStore.fetchColaboradores(1)"
          type="text"
          class="search-input"
          placeholder="Buscar por Nombres, Apellidos, DPI (CUI), NIT, o Puesto Funcional..."
        />
      </div>

      <div class="filter-pills-row">
        <span class="pills-label">Renglón:</span>
        <button
          v-for="r in ['ALL', '011', '022', '021', '029', '183', '189']"
          :key="r"
          class="pill-btn"
          :class="{ active: colabStore.filtros.renglon === r }"
          @click="setRenglonFilter(r)"
        >
          {{ r === 'ALL' ? 'Todos' : r }}
        </button>

        <span class="pills-label" style="margin-left: 1rem;">Semáforo:</span>
        <select v-model="colabStore.filtros.estado_expediente" @change="colabStore.fetchColaboradores(1)" class="select-filter">
          <option value="ALL">Todos los Estados</option>
          <option value="COMPLETO">Expediente Completo 🟢</option>
          <option value="POR_VENCER">Por Vencer 🟡</option>
          <option value="CON_VENCIMIENTOS">Con Vencidos 🔴</option>
          <option value="INCOMPLETO">Incompleto 🟠</option>
        </select>
      </div>
    </div>

    <!-- Listado de Colaboradores (Tabla y Dossier Links) -->
    <div class="table-container table-responsive card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Colaborador / Identificación</th>
            <th>Renglón</th>
            <th>Puesto Funcional (Operativo)</th>
            <th>Unidad / Despacho</th>
            <th>Honorarios / Salario</th>
            <th>Semáforo Expediente</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in colabStore.colaboradores"
            :key="c.id"
            @click="verColaborador(c.id)"
            class="clickable-row"
          >
            <td>
              <div class="colab-info">
                <img :src="c.foto_url || 'https://ui-avatars.com/api/?name=User'" class="avatar-sm" alt="Foto" />
                <div>
                  <div class="colab-name">
                    {{ c.primer_nombre }} {{ c.segundo_nombre || '' }} {{ c.primer_apellido }} {{ c.segundo_apellido || '' }}
                  </div>
                  <div class="colab-sub">
                    DPI: <strong>{{ c.cui_dpi }}</strong> &bull; NIT: {{ c.nit || 'Pendiente' }}
                  </div>
                </div>
              </div>
            </td>

            <td>
              <span class="badge badge-neutral" :class="'badge-' + c.contrato_actual?.renglon_codigo">
                Renglón {{ c.contrato_actual?.renglon_codigo || '011' }}
              </span>
            </td>

            <td>
              <div class="job-func">{{ c.contrato_actual?.puesto_funcional }}</div>
              <div class="job-nom">{{ c.contrato_actual?.puesto_nominal }}</div>
            </td>

            <td>
              <span class="unit-text">{{ c.contrato_actual?.unidad_admin }}</span>
            </td>

            <td>
              <span class="salary-text">
                Q {{ Number(c.contrato_actual?.salario_honorarios || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 }) }}
              </span>
              <span class="salary-type">
                {{ ['011','022','021'].includes(c.contrato_actual?.renglon_codigo) ? 'Salario' : 'Honorarios' }}
              </span>
            </td>

            <td>
              <span
                class="badge"
                :class="'badge-' + (c.semaforo_expediente?.color || 'verde')"
              >
                <span class="indicator-dot" :class="c.semaforo_expediente?.color || 'verde'"></span>
                {{ c.semaforo_expediente?.badge || 'Completo' }}
              </span>
            </td>

            <td style="text-align: right;" @click.stop>
              <div class="action-buttons">
                <button class="btn btn-secondary btn-sm" @click="verColaborador(c.id)">
                  Ficha 360°
                </button>
                <button
                  v-if="authStore.canIssueConstancias"
                  class="btn btn-primary btn-sm"
                  @click="emitirConstancia(c.id)"
                  title="Emitir constancia oficial con QR"
                >
                  Constancia
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="colabStore.colaboradores.length === 0">
            <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
              No se encontraron colaboradores con los criterios de búsqueda seleccionados.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Barra de Paginación Hipermedia HATEOAS -->
      <div class="pagination-bar" v-if="colabStore.pagination.total > 0">
        <div class="pagination-info">
          Mostrando página <strong>{{ colabStore.pagination.page }}</strong> de <strong>{{ colabStore.pagination.totalPages }}</strong>
          &bull; <strong>{{ colabStore.pagination.total }}</strong> colaboradores en total
        </div>

        <div class="pagination-controls">
          <button
            class="btn btn-secondary btn-sm"
            :disabled="!colabStore.links.prev"
            @click="colabStore.irAPagina(colabStore.pagination.page - 1)"
            title="Página anterior"
          >
            ← Anterior
          </button>

          <div class="page-numbers">
            <button
              v-for="p in colabStore.pagination.totalPages"
              :key="p"
              class="page-number-btn"
              :class="{ active: p === colabStore.pagination.page }"
              @click="colabStore.irAPagina(p)"
            >
              {{ p }}
            </button>
          </div>

          <button
            class="btn btn-secondary btn-sm"
            :disabled="!colabStore.links.next"
            @click="colabStore.irAPagina(colabStore.pagination.page + 1)"
            title="Página siguiente"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Nuevo Colaborador -->
    <NuevoColaboradorModal
      v-if="showNuevoModal"
      @close="showNuevoModal = false"
      @created="handleColabCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { useCollaboratorsStore } from "../stores/collaborators.store";
import NuevoColaboradorModal from "../components/new-collaborator.modal.vue";

const router = useRouter();
const authStore = useAuthStore();
const colabStore = useCollaboratorsStore();

const showNuevoModal = ref(false);

onMounted(() => {
  colabStore.fetchCatalogos();
  colabStore.fetchColaboradores();
  colabStore.fetchAlertas();
});

const countRenglon = (codigo) => {
  return colabStore.colaboradores.filter((c) => c.contrato_actual?.renglon_codigo === codigo).length;
};

const setRenglonFilter = (r) => {
  colabStore.filtros.renglon = r;
  colabStore.fetchColaboradores(1);
};

const verColaborador = (id) => {
  router.push(`/collaborators/${id}`);
};

const emitirConstancia = (id) => {
  router.push({ path: "/certificates", query: { persona_id: id } });
};

const handleColabCreated = (nuevo) => {
  if (nuevo?.id) {
    router.push(`/collaborators/${nuevo.id}`);
  }
};
</script>

<style scoped>
.directorio-page {
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
  margin-top: 0.25rem;
}

/* Grilla de Métricas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-alert {
  cursor: pointer;
  border-color: var(--color-warning-border);
  background: linear-gradient(180deg, #FFFFFF, var(--color-warning-bg));
}

.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-blue { background: var(--color-primary-100); color: var(--color-primary-700); }
.icon-teal { background: #E6FFFA; color: #0D9488; }
.icon-purple { background: #F3E8FF; color: #7E22CE; }
.icon-amber { background: var(--color-warning-bg); color: var(--color-warning-text); }

.stat-data {
  display: flex;
  flex-direction: column;
}

.stat-val {
  font-family: 'Outfit', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary-900);
}

.stat-lbl {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* Filtros */
.filters-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  background: var(--bg-subtle);
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  background: var(--bg-card);
  border-color: var(--color-primary-700);
  box-shadow: 0 0 0 3px rgba(19, 64, 116, 0.15);
}

.filter-pills-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pills-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.pill-btn {
  padding: 0.3125rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 500;
  background: var(--bg-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);
}

.pill-btn:hover {
  background: var(--border-light);
  color: var(--color-primary-900);
}

.pill-btn.active {
  background: var(--color-primary-800);
  color: white;
  border-color: var(--color-primary-800);
}

.select-filter {
  padding: 0.3125rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-card);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-main);
}

/* Tabla */
.clickable-row {
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.colab-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-sm {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-light);
}

.colab-name {
  font-weight: 600;
  color: var(--color-primary-900);
}

.colab-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.job-func {
  font-weight: 500;
  color: var(--text-main);
}

.job-nom {
  font-size: 0.75rem;
  color: var(--text-light);
}

.unit-text {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.salary-text {
  font-weight: 600;
  color: var(--color-primary-800);
  display: block;
}

.salary-type {
  font-size: 0.6875rem;
  color: var(--text-light);
  text-transform: uppercase;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 650px) {
  .stats-grid { grid-template-columns: 1fr; }
  .header-section { flex-direction: column; }
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-surface, #ffffff);
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  font-size: 0.8125rem;
  color: var(--text-muted, #64748b);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--border-color, #cbd5e1);
  background: white;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  color: var(--text-main, #1e293b);
  transition: all 0.15s ease;
}

.page-number-btn:hover {
  background: var(--color-primary-50, #eff6ff);
  border-color: var(--color-primary-300, #93c5fd);
  color: var(--color-primary-800, #1e40af);
}

.page-number-btn.active {
  background: var(--color-primary-800, #0c2340);
  border-color: var(--color-primary-800, #0c2340);
  color: #ffffff;
  font-weight: 600;
}
</style>
