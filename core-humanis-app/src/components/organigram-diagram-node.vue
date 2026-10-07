<template>
  <div class="diagram-branch">
    <!-- NODO DE UNIDAD ADMINISTRATIVA (ESTILO MERMAID UNIDAD) -->
    <div class="diagram-unit-container">
      <div class="diagram-unit-box">
        <span class="material-symbols-outlined unit-symbol">domain</span>
        <span class="unit-name">{{ node.nombre }}</span>
        <span class="unit-code font-mono">({{ node.codigo }})</span>
      </div>

      <!-- PERSONAL ASIGNADO A LA UNIDAD (LÍNEAS PUNTEADAS -.-) -->
      <div v-if="hasPersonal" class="diagram-staff-container">
        <!-- Conector punteado superior -->
        <div class="dotted-connector-vertical"></div>

        <div class="diagram-staff-grid">
          <!-- NIVEL 1: JEFATURA / DIRECCIÓN (ESTILO MERMAID JEFE) -->
          <div
            v-for="j in (node.jefes || [])"
            :key="j.persona_id || j.cui_dpi"
            class="diagram-card diagram-card--jefe"
          >
            <div class="dotted-pin"></div>
            <div class="card-title font-bold d-inline-flex align-center justify-center gap-1">
              <span class="material-symbols-outlined role-symbol role-symbol--jefe material-symbols-outlined--fill">supervisor_account</span>
              {{ formatNombre(j) }}
            </div>
            <div class="card-subtitle">
              {{ j.puesto_funcional || j.puesto_nominal || 'Director / Jefe' }}
            </div>
          </div>

          <!-- NIVEL 2: EQUIPO TÉCNICO & SUBORDINADOS (ESTILO MERMAID SUBORDINADO) -->
          <div
            v-for="s in (node.subordinados || [])"
            :key="s.persona_id || s.cui_dpi"
            class="diagram-card diagram-card--subordinado"
          >
            <div class="dotted-pin"></div>
            <div class="card-title font-bold d-inline-flex align-center justify-center gap-1">
              <span class="material-symbols-outlined role-symbol role-symbol--sub">group</span>
              {{ formatNombre(s) }}
            </div>
            <div class="card-subtitle">
              {{ s.puesto_funcional || s.puesto_nominal || 'Colaborador' }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="diagram-empty-staff">
        <span class="empty-badge">(Sin personal asignado)</span>
      </div>
    </div>

    <!-- CONECTOR JERÁRQUICO HACIA SUBUNIDADES (FLECHA GRUESA ===>) -->
    <div v-if="node.subunidades && node.subunidades.length" class="diagram-subunits-section">
      <!-- Flecha descendente -->
      <div class="diagram-arrow-connector">
        <div class="arrow-stem"></div>
        <div class="arrow-head"></div>
      </div>

      <!-- Contenedor horizontal de subunidades -->
      <div class="diagram-subunits-row">
        <OrganigramDiagramNode
          v-for="sub in node.subunidades"
          :key="sub.id || sub.codigo"
          :node="sub"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
});

const hasPersonal = computed(() => {
  const j = props.node.jefes?.length || 0;
  const s = props.node.subordinados?.length || 0;
  return (j + s) > 0;
});

const formatNombre = (c) => {
  const pNom = c.primer_nombre || '';
  const sNom = c.segundo_nombre ? ` ${c.segundo_nombre}` : '';
  const pApe = c.primer_apellido ? ` ${c.primer_apellido}` : '';
  const sApe = c.segundo_apellido ? ` ${c.segundo_apellido}` : '';
  const full = `${pNom}${sNom}${pApe}${sApe}`.trim();
  return full || 'Colaborador';
};
</script>

<style scoped>
.diagram-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.5rem 1rem;
  position: relative;
}

.diagram-unit-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* CAJA DE UNIDAD (ESTILO MERMAID classDef unidad) */
.diagram-unit-box {
  background-color: #eff6ff !important;
  border: 2px solid #3b82f6 !important;
  color: #1e3a8a !important;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.625rem 1.25rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.12);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  position: relative;
  z-index: 2;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.unit-code {
  font-size: 0.85rem;
  opacity: 0.9;
  letter-spacing: 0.03em;
}

/* CONEXIÓN PUNTEADA DE PERSONAL (-.-) */
.diagram-staff-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
}

.dotted-connector-vertical {
  width: 2px;
  height: 18px;
  border-left: 2px dotted #64748b;
  margin: 0 auto;
}

.diagram-staff-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  position: relative;
  padding-top: 0.25rem;
}

.diagram-empty-staff {
  margin-top: 0.35rem;
}

.empty-badge {
  font-size: 0.7rem;
  color: #94a3b8;
  font-style: italic;
}

/* TARJETAS DE PERSONAL */
.diagram-card {
  padding: 0.5rem 0.875rem;
  border-radius: 8px;
  text-align: center;
  min-width: 160px;
  max-width: 240px;
  position: relative;
  transition: transform 0.15s ease;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

/* JEFATURA (NIVEL 1) (ESTILO MERMAID classDef jefe) */
.diagram-card--jefe {
  background-color: #fefce8 !important;
  border: 2px solid #f59e0b !important;
  color: #b45309 !important;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.15);
}

.diagram-card--jefe .card-title {
  color: #92400e;
  font-size: 0.875rem;
}

.diagram-card--jefe .card-subtitle {
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.15rem;
}

/* SUBORDINADOS (NIVEL 2) (ESTILO MERMAID classDef subordinado) */
.diagram-card--subordinado {
  background-color: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #334155 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.diagram-card--subordinado .card-title {
  color: #1e293b;
  font-size: 0.875rem;
}

.diagram-card--subordinado .card-subtitle {
  color: #64748b;
  font-size: 0.75rem;
  margin-top: 0.15rem;
}

.dotted-pin {
  width: 1px;
  height: 8px;
  border-left: 2px dotted #94a3b8;
  position: absolute;
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
}

/* SECCIÓN DE SUBUNIDADES JERÁRQUICAS (FLECHA ===>) */
.diagram-subunits-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 1rem;
  position: relative;
}

.diagram-arrow-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.5rem;
}

.arrow-stem {
  width: 4px;
  height: 28px;
  background-color: #1e3a8a;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.arrow-head {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid #1e3a8a;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.diagram-subunits-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  position: relative;
  padding-top: 0.5rem;
  width: 100%;
}

@media print {
  .diagram-branch {
    page-break-inside: auto !important;
    break-inside: auto !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    margin: 0.5rem 0.5rem !important;
    height: auto !important;
    overflow: visible !important;
  }

  .diagram-unit-container {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .diagram-unit-box {
    box-shadow: none !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .diagram-staff-container {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .diagram-card {
    box-shadow: none !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .diagram-arrow-connector {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .diagram-subunits-section {
    page-break-inside: auto !important;
    break-inside: auto !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }

  .diagram-subunits-row {
    page-break-inside: auto !important;
    break-inside: auto !important;
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 1.25rem !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }
}
</style>
