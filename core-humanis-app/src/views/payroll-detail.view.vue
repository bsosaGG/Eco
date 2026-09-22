<template>
  <div class="payroll-detail-page page-container">
    <!-- Barra Superior -->
    <div class="adaptive-bar">
      <div>
        <router-link to="/payrolls" class="back-link">
          ← Volver a Nóminas
        </router-link>
        <h1 class="page-title">{{ payroll?.correlativo || "Detalle de Nómina" }}</h1>
        <p class="page-subtitle">
          Período: {{ payroll?.periodoMes }}/{{ payroll?.periodoAnio }} • Renglón {{ payroll?.renglonPresupuestario }} • Estado:
          <span class="badge" :class="getStatusBadgeClass(payroll?.estado)">{{ payroll?.estado }}</span>
        </p>
      </div>
      <div class="adaptive-bar__actions">
        <button
          v-if="payroll?.estado === 'BORRADOR' || payroll?.estado === 'REVISADO'"
          @click="handleCalculate"
          class="btn btn--secondary"
          :disabled="calculating"
        >
          {{ calculating ? "Calculando..." : "Calcular Nómina" }}
        </button>
        <button
          v-if="payroll?.estado === 'BORRADOR' || payroll?.estado === 'REVISADO'"
          @click="handleApprove"
          class="btn btn--primary"
        >
          Aprobar Nómina
        </button>
        <a
          v-if="payroll?.estado === 'APROBADO' || payroll?.estado === 'PAGADO'"
          :href="`/api/v1/core-humanis/payrolls/${payroll?.id}/bank-dispersion`"
          class="btn btn--outline"
          download
        >
          Archivo Banco
        </a>
        <a
          v-if="payroll?.estado === 'APROBADO' || payroll?.estado === 'PAGADO'"
          :href="`/api/v1/core-humanis/payrolls/${payroll?.id}/igss-file`"
          class="btn btn--outline"
          download
        >
          Planilla IGSS
        </a>
      </div>
    </div>

    <!-- Tarjetas de Métricas -->
    <div class="grid-adaptive--sm">
      <div class="card metric-card">
        <span class="metric-label">Total Devengado</span>
        <span class="metric-value">Q {{ formatMoney(payroll?.totalDevengado) }}</span>
      </div>
      <div class="card metric-card">
        <span class="metric-label">Total Descuentos</span>
        <span class="metric-value text-danger">Q {{ formatMoney(payroll?.totalDescuentos) }}</span>
      </div>
      <div class="card metric-card">
        <span class="metric-label">Total Líquido</span>
        <span class="metric-value text-success">Q {{ formatMoney(payroll?.totalLiquido) }}</span>
      </div>
      <div class="card metric-card">
        <span class="metric-label">Colaboradores</span>
        <span class="metric-value">{{ payroll?.detalles?.length || 0 }}</span>
      </div>
    </div>

    <!-- Desglose de Liquidación -->
    <div class="card table-card">
      <div class="card__header">
        <h2 class="card__title">Desglose Individual de Colaboradores</h2>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>CUI (DPI)</th>
              <th>Puesto Funcional</th>
              <th>Sueldo / Honorarios</th>
              <th>Bonificaciones</th>
              <th>Descuentos Ley</th>
              <th>Otros Descuentos</th>
              <th>Líquido</th>
              <th>Comprobante</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!payroll?.detalles || payroll.detalles.length === 0">
              <td colspan="9" class="text-center py-4">
                No hay colaboradores calculados. Haz clic en "Calcular Nómina" para procesar las liquidaciones.
              </td>
            </tr>
            <tr v-for="d in payroll?.detalles" :key="d.id">
              <td class="font-bold">{{ d.primer_nombre }} {{ d.primer_apellido }}</td>
              <td>{{ d.cui_dpi || "N/A" }}</td>
              <td>{{ d.puesto_funcional || "Puesto Institucional" }}</td>
              <td>Q {{ formatMoney(d.sueldo_base_honorarios) }}</td>
              <td class="text-info">Q {{ formatMoney(d.total_bonificaciones) }}</td>
              <td class="text-danger">Q {{ formatMoney(d.total_descuentos_ley) }}</td>
              <td>Q {{ formatMoney(d.total_descuentos_otros) }}</td>
              <td class="font-bold text-success">Q {{ formatMoney(d.liquido_a_recibir) }}</td>
              <td>
                <router-link
                  v-if="d.boleta_hash_sha256"
                  :to="`/certificates/verifications/${d.boleta_hash_sha256}`"
                  class="hash-link"
                  target="_blank"
                >
                  {{ d.boleta_hash_sha256.substring(0, 8) }}...
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { usePayrollsStore } from "../stores/payrolls.store";

const route = useRoute();
const payrollsStore = usePayrollsStore();
const calculating = ref(false);

const payroll = computed(() => payrollsStore.currentPayroll);

const formatMoney = (val) => Number(val || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 });

const getStatusBadgeClass = (estado) => {
  if (estado === "APROBADO") return "badge--success";
  if (estado === "PAGADO") return "badge--primary";
  if (estado === "REVISADO") return "badge--warning";
  return "badge--secondary";
};

const handleCalculate = async () => {
  calculating.value = true;
  try {
    await payrollsStore.calculatePayroll(route.params.id);
  } catch (err) {
    alert(err.message || "Error al calcular nómina");
  } finally {
    calculating.value = false;
  }
};

const handleApprove = async () => {
  if (!confirm("¿Está seguro de aprobar la nómina? Esto congelará las cifras y generará las boletas definitivas.")) {
    return;
  }
  try {
    await payrollsStore.updatePayrollStatus(route.params.id, "APROBADO");
  } catch (err) {
    alert(err.message || "Error al aprobar nómina");
  }
};

onMounted(() => {
  payrollsStore.fetchPayrollById(route.params.id);
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.back-link {
  display: inline-block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-primary, #0c2340);
  text-decoration: none;
  font-weight: 500;
}
.metric-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.metric-label {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted, #64748b);
}
.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #1e293b);
}
.hash-link {
  font-family: monospace;
  font-size: 0.8125rem;
  color: var(--color-primary, #0c2340);
  text-decoration: underline;
}
</style>
