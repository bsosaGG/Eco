<template>
  <div v-if="show" class="print-modal-overlay" @click.self="$emit('close')">
    <div class="print-modal-wrapper card" role="dialog" aria-modal="true">
      <!-- Barra Superior de Control (Oculta en Impresión) -->
      <div class="print-modal-header d-flex justify-between align-center p-3 border-bottom no-print">
        <div class="d-flex align-center gap-2">
          <span class="badge badge--primary">SCSPR</span>
          <div>
            <h3 class="m-0 font-heading text-primary font-bold">
              Previsualización de Impresión - Diagrama Jerárquico Oficial
            </h3>
            <p class="m-0 text-xs text-muted">
              Formato gráfico en orientación horizontal (Landscape) conforme a la especificación institucional.
            </p>
          </div>
        </div>

        <div class="d-flex align-center gap-2">
          <button type="button" class="btn btn--secondary btn--sm" @click="$emit('close')">
            ✕ Cerrar
          </button>
          <button type="button" class="btn btn--primary btn--sm d-flex align-center gap-1" @click="handlePrint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect width="12" height="8" x="6" y="14"></rect>
            </svg>
            🖨️ Imprimir / Guardar en PDF
          </button>
        </div>
      </div>

      <!-- LÁMINA IMPRIMIBLE DEL ORGANIGRAMA JERÁRQUICO -->
      <div class="print-modal-body p-4" id="organigramPrintArea">
        <div class="printable-sheet">
          <!-- Encabezado Institucional de la Lámina -->
          <div class="sheet-institutional-header mb-3 pb-3 border-bottom">
            <div class="d-flex align-center justify-between">
              <div class="d-flex align-center gap-3">
                <div class="scspr-crest-box">
                  <span class="crest-icon">🏛️</span>
                </div>
                <div>
                  <div class="text-xs font-bold text-uppercase text-muted letter-spacing-1">
                    GOBIERNO DE LA REPÚBLICA DE GUATEMALA
                  </div>
                  <h2 class="m-0 font-heading text-primary sheet-title">
                    SECRETARÍA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA (SCSPR)
                  </h2>
                  <div class="text-xs text-muted font-bold mt-1">
                    DIAGRAMA JERÁRQUICO INSTITUCIONAL Y ESTRUCTURA OCUPACIONAL
                  </div>
                </div>
              </div>

              <div class="sheet-meta-box text-right text-xs">
                <div><strong>Fecha de Emisión:</strong> {{ fechaEmision }}</div>
                <div><strong>Ámbito:</strong> {{ selectedUnitLabel }}</div>
                <div class="mt-1">
                  <span class="badge badge--info">{{ totalUnidades }} Áreas</span>
                  <span class="badge badge--success ml-1">{{ totalPersonal }} Colaboradores</span>
                </div>
              </div>
            </div>

            <!-- Leyenda de Convenciones del Diagrama -->
            <div class="sheet-legend mt-2 d-flex align-center gap-3 flex-wrap">
              <span class="legend-title text-xs font-bold text-uppercase text-muted">Convenciones:</span>
              <span class="legend-item legend-item--unidad text-xs">
                <span class="legend-box legend-box--unidad"></span> 🏢 Unidad Administrativa
              </span>
              <span class="legend-item legend-item--jefe text-xs">
                <span class="legend-box legend-box--jefe"></span> 👑 Jefatura / Dirección (Nivel 1)
              </span>
              <span class="legend-item legend-item--subordinado text-xs">
                <span class="legend-box legend-box--subordinado"></span> 👥 Equipo Técnico (Nivel 2)
              </span>
              <span class="legend-item text-xs text-muted font-mono">
                ━━━▶ Dependencia Jerárquica &bull; •••• Asignación de Personal
              </span>
            </div>
          </div>

          <!-- LIENZO JERÁRQUICO (ÁRBOL GRÁFICO TIPO MERMAID) -->
          <div class="diagram-canvas">
            <div v-if="!treeData.length" class="text-center p-5 text-muted">
              No hay áreas registradas para imprimir.
            </div>

            <div v-else class="diagram-roots-wrapper">
              <OrganigramDiagramNode
                v-for="rootNode in treeData"
                :key="rootNode.id || rootNode.codigo"
                :node="rootNode"
              />
            </div>
          </div>

          <!-- Pie de Página Institucional -->
          <div class="sheet-footer mt-4 pt-3 border-top d-flex justify-between align-end text-xs text-muted">
            <div>
              <div>Sistema Institucional Core Humanis &bull; Dirección de Recursos Humanos</div>
              <div>Documento Oficial de Organización Jerárquica y Puestos Ocupacionales</div>
            </div>
            <div class="text-center signature-space">
              <div class="signature-line"></div>
              <div>Dirección de Recursos Humanos / Autoridad Nominadora</div>
              <div>SCSPR - Presidencia de la República</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import OrganigramDiagramNode from './organigram-diagram-node.vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  treeData: {
    type: Array,
    default: () => [],
  },
  selectedUnitLabel: {
    type: String,
    default: 'Toda la Institución',
  },
  totalUnidades: {
    type: Number,
    default: 0,
  },
  totalPersonal: {
    type: Number,
    default: 0,
  },
});

defineEmits(['close']);

const fechaEmision = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
});

const handlePrint = () => {
  window.print();
};
</script>

<style scoped>
.print-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.print-modal-wrapper {
  max-width: 98vw;
  width: 1400px;
  max-height: 94vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.print-modal-body {
  overflow-y: auto;
  overflow-x: auto;
  background: #f8fafc;
  flex: 1;
}

/* LÁMINA BLANCA OFICIAL */
.printable-sheet {
  background: #ffffff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  min-width: 900px;
  margin: 0 auto;
}

.scspr-crest-box {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.sheet-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f2b48;
}

.letter-spacing-1 {
  letter-spacing: 0.05em;
}

/* LEYENDA */
.sheet-legend {
  padding: 0.4rem 0.75rem;
  background: #f1f5f9;
  border-radius: 6px;
}

.legend-box {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 4px;
}

.legend-box--unidad {
  background: #eff6ff;
  border: 1px solid #3b82f6;
}

.legend-box--jefe {
  background: #fefce8;
  border: 1px solid #f59e0b;
}

.legend-box--subordinado {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
}

/* LIENZO JERÁRQUICO */
.diagram-canvas {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  overflow-x: auto;
}

.diagram-roots-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  width: 100%;
}

.signature-space {
  min-width: 260px;
}

.signature-line {
  border-bottom: 1px solid #94a3b8;
  margin-bottom: 0.35rem;
  height: 35px;
}

/* ==========================================================================
   REGLAS DE IMPRESIÓN (@MEDIA PRINT)
   ========================================================================== */
@media print {
  @page {
    size: landscape;
    margin: 0.8cm;
  }

  /* Ocultar barra de control, fondo y cualquier elemento no imprimible */
  .no-print,
  .print-modal-header {
    display: none !important;
  }

  .print-modal-overlay {
    position: static !important;
    background: transparent !important;
    padding: 0 !important;
    display: block !important;
  }

  .print-modal-wrapper {
    box-shadow: none !important;
    border: none !important;
    max-width: 100% !important;
    width: 100% !important;
    max-height: none !important;
  }

  .print-modal-body {
    background: #ffffff !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .printable-sheet {
    box-shadow: none !important;
    padding: 0 !important;
    min-width: 100% !important;
    background: #ffffff !important;
  }

  body {
    background: #ffffff !important;
  }
}
</style>
