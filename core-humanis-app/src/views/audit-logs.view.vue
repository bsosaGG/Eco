<template>
  <div class="auditoria-page">
    <div class="adaptive-bar mb-4">
      <div>
        <h1 class="font-heading">Bitácora de Auditoría Inmutable</h1>
        <p class="subtitle">
          RF-10 &bull; Pista de Auditoría para Órganos de Control Interno y Contraloría General de Cuentas (CGC)
        </p>
      </div>

      <button class="btn btn-secondary btn-sm" @click="fetchLogs">
        🔄 Actualizar Registros
      </button>
    </div>

    <div class="card card-body">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha y Hora (UTC-6)</th>
              <th>Usuario Responsable</th>
              <th>Operación</th>
              <th>Módulo / Tabla</th>
              <th>Detalle de la Transacción</th>
              <th>IP Origen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in logs" :key="l.id">
              <td class="font-mono" style="font-size: 0.8125rem;">
                {{ new Date(l.created_at).toLocaleString('es-GT') }}
              </td>
              <td>
                <strong>{{ l.usuario }}</strong>
              </td>
              <td>
                <span class="badge" :class="getAccionBadge(l.accion)">
                  {{ l.accion }}
                </span>
              </td>
              <td class="font-mono" style="font-size: 0.8125rem;">
                {{ l.tabla_afectada }}
              </td>
              <td style="font-size: 0.8125rem; max-width: 380px;">
                {{ l.detalles || 'Sin observaciones' }}
              </td>
              <td class="font-mono" style="font-size: 0.75rem; color: var(--text-muted);">
                {{ l.ip_address || '127.0.0.1' }}
              </td>
            </tr>

            <tr v-if="logs.length === 0">
              <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                No hay eventos registrados en la bitácora de auditoría.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import apiClient from "../api/client";

const logs = ref([]);

const fetchLogs = async () => {
  try {
    const res = await apiClient.get("/audit-logs");
    logs.value = res.data.data || [];
  } catch (err) {
    console.error("Error al cargar auditoría:", err);
  }
};

const getAccionBadge = (accion) => {
  switch (accion) {
    case "CREATE": return "badge-verde";
    case "UPDATE": return "badge-info";
    case "DELETE": return "badge-rojo";
    case "EMITIR_CONSTANCIA": return "badge-amarillo";
    default: return "badge-neutral";
  }
};

onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.auditoria-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.font-mono {
  font-family: monospace;
}
</style>
