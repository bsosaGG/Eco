<template>
  <div v-if="show && request" class="modal__overlay" @click.self="close">
    <div class="modal__content card vacation-detail-modal">
      <div class="modal__header card__header">
        <div class="vacation-detail-modal__title-group">
          <span class="badge badge--info">{{ request.correlativo || 'SOLICITUD' }}</span>
          <h3 class="font-heading">Detalle de Solicitud de Vacaciones</h3>
        </div>
        <button class="btn btn--sm btn--secondary" @click="close" aria-label="Cerrar">&times;</button>
      </div>

      <div class="modal__body card__body">
        <!-- Estado y Colaborador -->
        <div class="detail-section">
          <div class="detail-grid detail-grid--2">
            <div class="detail-item">
              <span class="detail-item__label">Colaborador:</span>
              <strong class="detail-item__value">{{ request.colaborador_nombre }}</strong>
              <span class="detail-item__sub">CUI / DPI: {{ request.cui_dpi }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">Estado del Trámite:</span>
              <div>
                <span :class="getStatusBadgeClass(request.estado)">
                  {{ formatEstado(request.estado) }}
                </span>
              </div>
              <span class="detail-item__sub">Renglón: {{ request.renglon_codigo || '011' }}</span>
            </div>
          </div>
        </div>

        <!-- Cómputo de Días Hábiles -->
        <div class="detail-section">
          <h4 class="detail-section__title">Cómputo Oficial de Días Hábiles</h4>
          <div class="detail-grid detail-grid--4">
            <div class="metric-card">
              <span class="metric-card__label">Fecha de Inicio</span>
              <strong class="metric-card__value text-primary">{{ formatDate(request.fecha_inicio) }}</strong>
            </div>
            <div class="metric-card">
              <span class="metric-card__label">Fecha de Fin</span>
              <strong class="metric-card__value text-primary">{{ formatDate(request.fecha_fin) }}</strong>
            </div>
            <div class="metric-card">
              <span class="metric-card__label">Días Hábiles</span>
              <strong class="metric-card__value text-gold">{{ request.dias_solicitados }} Días</strong>
            </div>
            <div class="metric-card">
              <span class="metric-card__label">Retorno a Labores</span>
              <strong class="metric-card__value text-success">{{ formatDate(request.fecha_retorno) }}</strong>
            </div>
          </div>
          <p class="detail-section__hint">
            * Cómputo legal conforme al Código de Trabajo y Ley de Servicio Civil: no computa sábados, domingos ni asuetos nacionales.
          </p>
        </div>

        <!-- Conciliación con Kardex -->
        <div class="detail-section" v-if="request.dias_derecho !== undefined">
          <h4 class="detail-section__title">Impacto en Kardex de Vacaciones (Período Anual)</h4>
          <div class="kardex-summary">
            <div class="kardex-summary__col">
              <span class="kardex-summary__label">Derecho Total Anual:</span>
              <strong class="kardex-summary__num">{{ request.dias_derecho || 15 }} días</strong>
            </div>
            <div class="kardex-summary__col">
              <span class="kardex-summary__label">Días Ya Utilizados:</span>
              <strong class="kardex-summary__num">{{ request.dias_utilizados || 0 }} días</strong>
            </div>
            <div class="kardex-summary__col">
              <span class="kardex-summary__label">Días Esta Solicitud:</span>
              <strong class="kardex-summary__num text-danger">-{{ request.dias_solicitados }} días</strong>
            </div>
            <div class="kardex-summary__col">
              <span class="kardex-summary__label">Saldo Remanente:</span>
              <strong class="kardex-summary__num text-success">
                {{ Math.max(0, (parseFloat(request.dias_pendientes || 15) - parseFloat(request.dias_solicitados || 0)).toFixed(0)) }} días
              </strong>
            </div>
          </div>
        </div>

        <!-- Justificación y Observaciones -->
        <div class="detail-section" v-if="request.observaciones">
          <span class="detail-item__label">Motivo u Observaciones:</span>
          <p class="detail-section__text">{{ request.observaciones }}</p>
        </div>
      </div>

      <!-- Footer con acciones de impresión por plantillas -->
      <div class="modal__footer card__footer">
        <div class="vacation-detail-modal__actions">
          <button 
            type="button" 
            class="btn btn--outline" 
            :disabled="printingDocx" 
            @click="handlePrint('docx')"
          >
            <span v-if="printingDocx">Generando...</span>
            <span v-else>📄 Descargar Plantilla (.docx)</span>
          </button>
          <button 
            type="button" 
            class="btn btn--primary" 
            :disabled="printingPdf" 
            @click="handlePrint('pdf')"
          >
            <span v-if="printingPdf">Generando PDF...</span>
            <span v-else>🖨️ Imprimir Boleta Oficial (.pdf)</span>
          </button>
          <button type="button" class="btn btn--secondary" @click="close">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useVacationsStore } from '../stores/vacations.store';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  request: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const vacationsStore = useVacationsStore();
const printingPdf = ref(false);
const printingDocx = ref(false);

const close = () => {
  emit('close');
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatEstado = (st) => {
  const map = {
    PENDIENTE_JEFE: 'Pendiente Visto Bueno Jefe',
    APROBADO_JEFE: 'Visto Bueno de Jefe',
    APROBADO_RRHH: 'Aprobado por RRHH',
    RECHAZADO: 'Rechazado',
    CANCELADO: 'Cancelado'
  };
  return map[st] || st || 'PENDIENTE';
};

const getStatusBadgeClass = (st) => {
  if (st === 'APROBADO_RRHH') return 'badge badge--success';
  if (st === 'APROBADO_JEFE') return 'badge badge--info';
  if (st === 'RECHAZADO') return 'badge badge--danger';
  return 'badge badge--warning';
};

const handlePrint = async (format) => {
  if (!props.request?.id) return;
  if (format === 'pdf') printingPdf.value = true;
  if (format === 'docx') printingDocx.value = true;

  try {
    await vacationsStore.printRequest(props.request.id, format);
  } catch (err) {
    console.error('Error al imprimir boleta de vacaciones:', err);
  } finally {
    printingPdf.value = false;
    printingDocx.value = false;
  }
};
</script>

<style scoped>
.vacation-detail-modal {
  max-width: 680px;
  width: 95%;
}

.vacation-detail-modal__title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 8px);
}

.detail-section {
  margin-bottom: var(--spacing-md, 16px);
  padding-bottom: var(--spacing-sm, 8px);
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-institucional, #0c2340);
  margin-bottom: var(--spacing-sm, 8px);
}

.detail-section__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
  margin-top: 6px;
  font-style: italic;
}

.detail-section__text {
  font-size: 0.875rem;
  color: var(--color-text-primary, #1e293b);
  background: var(--color-bg-alt, #f8fafc);
  padding: var(--spacing-sm, 8px);
  border-radius: var(--border-radius-sm, 6px);
  margin-top: 4px;
}

.detail-grid {
  display: grid;
  gap: var(--spacing-md, 12px);
}

.detail-grid--2 {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.detail-grid--4 {
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-text-muted, #64748b);
  letter-spacing: 0.5px;
}

.detail-item__value {
  font-size: 1rem;
  color: var(--color-institucional, #0c2340);
}

.detail-item__sub {
  font-size: 0.8rem;
  color: var(--color-text-muted, #64748b);
}

.metric-card {
  background: var(--color-bg-alt, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: var(--border-radius-sm, 6px);
  padding: 8px 12px;
  text-align: center;
}

.metric-card__label {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted, #64748b);
  text-transform: uppercase;
}

.metric-card__value {
  display: block;
  font-size: 0.95rem;
  margin-top: 2px;
}

.kardex-summary {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  background: var(--color-bg-alt, #f8fafc);
  border-radius: var(--border-radius-sm, 6px);
  padding: 10px 14px;
}

.kardex-summary__col {
  display: flex;
  flex-direction: column;
}

.kardex-summary__label {
  font-size: 0.72rem;
  color: var(--color-text-muted, #64748b);
}

.kardex-summary__num {
  font-size: 0.95rem;
  color: var(--color-institucional, #0c2340);
}

.vacation-detail-modal__actions {
  display: flex;
  gap: var(--spacing-sm, 8px);
  justify-content: flex-end;
  width: 100%;
  flex-wrap: wrap;
}

.text-gold {
  color: var(--color-dorado, #c5a059);
}
</style>
