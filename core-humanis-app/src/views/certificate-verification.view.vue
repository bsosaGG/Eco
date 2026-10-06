<template>
  <div class="validador-page">
    <div class="validador-card card">
      <div class="validador-header">
        <div class="crest-icon">🇬🇹</div>
        <h2>SECRETARÍA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA</h2>
        <h3>SISTEMA DE VERIFICACIÓN ELECTRÓNICA DE DOCUMENTOS</h3>
      </div>

      <div v-if="loading" style="text-align: center; padding: 2rem;">
        <p>Consultando base de datos institucional...</p>
      </div>

      <div v-else-if="resultado && resultado.valido" class="resultado-box valido">
        <div class="status-icon">✅</div>
        <h3 class="status-title">DOCUMENTO OFICIAL AUTÉNTICO</h3>
        <p class="status-sub">
          La presente certificación ha sido validada directamente contra los registros de la Unidad de Recursos Humanos de la SCSPR.
        </p>

        <div class="info-grid">
          <div class="info-row">
            <span class="info-lbl">Correlativo Institucional:</span>
            <span class="info-val font-mono">{{ resultado.data.correlativo }}</span>
          </div>

          <div class="info-row">
            <span class="info-lbl">Titular del Documento:</span>
            <span class="info-val">{{ resultado.data.colaborador_nombre }}</span>
          </div>

          <div class="info-row">
            <span class="info-lbl">CUI / DPI:</span>
            <span class="info-val font-mono">{{ resultado.data.cui_dpi_enmascarado }}</span>
          </div>

          <div class="info-row">
            <span class="info-lbl">Tipo de Constancia:</span>
            <span class="info-val">{{ resultado.data.tipo_constancia }}</span>
          </div>

          <div class="info-row">
            <span class="info-lbl">Fecha de Emisión:</span>
            <span class="info-val">{{ formatHumanDate(resultado.data.fecha_emision) }}</span>
          </div>

          <div class="info-row">
            <span class="info-lbl">Emitido Por:</span>
            <span class="info-val">{{ resultado.data.emitido_por }}</span>
          </div>
        </div>
      </div>

      <div v-else class="resultado-box invalido">
        <div class="status-icon">⚠️</div>
        <h3 class="status-title" style="color: var(--color-danger);">DOCUMENTO NO ENCONTRADO</h3>
        <p class="status-sub">
          El código QR o identificador consultado no corresponde a ningún documento emitido por la SCSPR o ha sido revocado.
        </p>
      </div>

      <div class="validador-footer">
        <a href="/rrhh" class="btn btn-secondary btn-sm">
          ← Portal Institucional SCSPR
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import apiClient from "../api/client";
import { formatHumanDate } from "../utils/date";

const route = useRoute();
const loading = ref(true);
const resultado = ref(null);

onMounted(async () => {
  const hash = route.params.hash;
  try {
    const res = await apiClient.get(`/certificates/verifications/${hash}`);
    resultado.value = res.data;
  } catch (err) {
    resultado.value = { valido: false };
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.validador-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.validador-card {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  box-shadow: var(--shadow-xl);
}

.validador-header {
  text-align: center;
  border-bottom: 2px solid var(--color-primary-900);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.crest-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.validador-header h2 {
  font-size: 0.875rem;
  color: var(--color-primary-900);
  letter-spacing: 0.04em;
}

.validador-header h3 {
  font-size: 0.75rem;
  color: var(--color-primary-700);
  font-weight: 500;
}

.resultado-box {
  text-align: center;
  padding: 1.5rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.resultado-box.valido {
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
}

.resultado-box.invalido {
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
}

.status-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.status-title {
  font-size: 1.125rem;
  color: var(--color-success-text);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.status-sub {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
  margin-bottom: 1.25rem;
}

.info-grid {
  text-align: left;
  background: white;
  border-radius: var(--radius-md);
  padding: 1rem;
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  border-bottom: 1px dashed var(--border-light);
  padding-bottom: 0.375rem;
}

.info-lbl {
  color: var(--text-muted);
}

.info-val {
  font-weight: 600;
  color: var(--color-primary-900);
}

.validador-footer {
  text-align: center;
}

.font-mono {
  font-family: monospace;
}

@media (max-width: 599px) {
  .validador-page {
    padding: 1rem 0.5rem;
  }

  .validador-card {
    padding: 1.25rem 1rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .validador-footer .btn {
    width: 100%;
    min-height: 44px;
    justify-content: center;
  }
}
</style>
