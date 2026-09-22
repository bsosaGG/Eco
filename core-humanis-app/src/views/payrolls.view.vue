<template>
  <div class="payrolls-page page-container">
    <div class="adaptive-bar">
      <div>
        <h1 class="page-title">Nóminas y Compensaciones</h1>
        <p class="page-subtitle">Gestión de planillas salariales, retenciones de ley y dispersión bancaria</p>
      </div>
      <div class="adaptive-bar__actions">
        <button @click="showNewModal = true" class="btn btn--primary">
          <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Aperturar Nómina
        </button>
      </div>
    </div>

    <!-- Filtros de Renglón y Estado -->
    <div class="card filter-card">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Renglón:</label>
          <select v-model="filtroRenglon" @change="cargarNominas" class="filter-select">
            <option value="">Todos los Renglones</option>
            <option value="011">011 - Personal Permanente</option>
            <option value="022">022 - Personal por Contrato</option>
            <option value="029">029 - Servicios Técnicos/Profesionales</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Estado:</label>
          <select v-model="filtroEstado" @change="cargarNominas" class="filter-select">
            <option value="">Todos los Estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="REVISADO">Revisado</option>
            <option value="APROBADO">Aprobado</option>
            <option value="PAGADO">Pagado</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tabla de Nóminas -->
    <div class="card table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Correlativo</th>
              <th>Período</th>
              <th>Renglón</th>
              <th>Tipo</th>
              <th>Total Devengado</th>
              <th>Total Descuentos</th>
              <th>Total Líquido</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="payrollsStore.loading">
              <td colspan="9" class="text-center py-4">Cargando nóminas institucionales...</td>
            </tr>
            <tr v-else-if="payrollsStore.payrolls.length === 0">
              <td colspan="9" class="text-center py-4">No se encontraron nóminas registradas.</td>
            </tr>
            <tr v-for="nom in payrollsStore.payrolls" :key="nom.id">
              <td class="font-bold text-primary">{{ nom.correlativo }}</td>
              <td>{{ nom.periodoMes }}/{{ nom.periodoAnio }}</td>
              <td>
                <span class="badge" :class="getBadgeClass(nom.renglonPresupuestario)">
                  Renglón {{ nom.renglonPresupuestario }}
                </span>
              </td>
              <td>{{ nom.tipoPlanilla }}</td>
              <td>Q {{ formatMoney(nom.totalDevengado) }}</td>
              <td class="text-danger">Q {{ formatMoney(nom.totalDescuentos) }}</td>
              <td class="font-bold text-success">Q {{ formatMoney(nom.totalLiquido) }}</td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(nom.estado)">
                  {{ nom.estado }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <router-link :to="`/payrolls/${nom.id}`" class="btn btn--sm btn--secondary">
                    Ver Detalle
                  </router-link>
                  <a
                    v-if="nom.estado === 'APROBADO' || nom.estado === 'PAGADO'"
                    :href="`/api/v1/core-humanis/payrolls/${nom.id}/bank-dispersion`"
                    class="btn btn--sm btn--outline"
                    title="Descargar archivo banco"
                    download
                  >
                    Banco
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Apertura de Nómina -->
    <div v-if="showNewModal" class="modal__overlay" @click.self="showNewModal = false">
      <div class="modal__content modal-dialog">
        <div class="card__header">
          <h2 class="card__title">Aperturar Nuevo Período de Nómina</h2>
        </div>
        <form @submit.prevent="handleCreatePayroll" class="modal-form">
          <div class="form-group">
            <label class="form-label">Mes:</label>
            <select v-model="form.periodo_mes" required class="form-control">
              <option v-for="m in 12" :key="m" :value="m">{{ getMonthName(m) }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Año:</label>
            <input v-model.number="form.periodo_anio" type="number" required class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Renglón Presupuestario:</label>
            <select v-model="form.renglon_presupuestario" required class="form-control">
              <option value="011">011 - Personal Permanente</option>
              <option value="022">022 - Personal por Contrato</option>
              <option value="029">029 - Servicios Técnicos/Profesionales</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Planilla:</label>
            <select v-model="form.tipo_planilla" required class="form-control">
              <option value="ORDINARIA">Ordinaria Mensual</option>
              <option value="AGUINALDO">Aguinaldo</option>
              <option value="BONO14">Bono 14</option>
              <option value="LIQUIDACION">Liquidación Final</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showNewModal = false" class="btn btn--secondary">Cancelar</button>
            <button type="submit" class="btn btn--primary" :disabled="submitting">
              {{ submitting ? "Aperturando..." : "Crear Período" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usePayrollsStore } from "../stores/payrolls.store";

const payrollsStore = usePayrollsStore();
const filtroRenglon = ref("");
const filtroEstado = ref("");
const showNewModal = ref(false);
const submitting = ref(false);

const form = ref({
  periodo_mes: new Date().getMonth() + 1,
  periodo_anio: new Date().getFullYear(),
  renglon_presupuestario: "011",
  tipo_planilla: "ORDINARIA",
});

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const getMonthName = (m) => meses[m - 1] || m;

const cargarNominas = () => {
  payrollsStore.fetchPayrolls({
    renglon: filtroRenglon.value || undefined,
    estado: filtroEstado.value || undefined,
  });
};

const handleCreatePayroll = async () => {
  submitting.value = true;
  try {
    await payrollsStore.createPayroll(form.value);
    showNewModal.value = false;
  } catch (err) {
    alert(err.message || "Error al crear nómina");
  } finally {
    submitting.value = false;
  }
};

const formatMoney = (val) => Number(val || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 });

const getBadgeClass = (renglon) => {
  if (renglon === "011") return "badge--info";
  if (renglon === "022") return "badge--warning";
  return "badge--secondary";
};

const getStatusBadgeClass = (estado) => {
  if (estado === "APROBADO") return "badge--success";
  if (estado === "PAGADO") return "badge--primary";
  if (estado === "REVISADO") return "badge--warning";
  return "badge--secondary";
};

onMounted(() => {
  cargarNominas();
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.filter-card {
  padding: 1rem 1.5rem;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
}
.filter-select {
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--color-border, #cbd5e1);
  background-color: var(--color-surface, #ffffff);
}
.action-buttons {
  display: flex;
  gap: 0.5rem;
}
.modal-dialog {
  max-width: 500px;
  width: 100%;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
