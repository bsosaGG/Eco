<template>
  <div class="constancias-page">
    <div class="header-section">
      <div>
        <h1>Emisión Rápida de Constancias Oficiales</h1>
        <p class="subtitle">
          Módulo 11 (Fase 1) &bull; Generación con Firma Institucional, Correlativo Único y Código QR de Validación Pública
        </p>
      </div>
    </div>

    <div class="grid-2" style="align-items: start;">
      <!-- Panel de Emisión y Parámetros -->
      <div class="card card-body">
        <h3 class="panel-title">Parámetros de la Constancia</h3>

        <form @submit.prevent="handleGenerarConstancia">
          <div class="form-group">
            <label class="form-label">Seleccionar Colaborador *</label>
            <select v-model="form.persona_id" class="form-control" required>
              <option value="" disabled>Seleccione un colaborador...</option>
              <option
                v-for="c in colabStore.colaboradores"
                :key="c.id"
                :value="c.id"
              >
                {{ c.primer_nombre }} {{ c.primer_apellido }} &mdash; Renglón {{ c.contrato_actual?.renglon_codigo }} ({{ c.contrato_actual?.puesto_funcional }})
              </option>
            </select>
          </div>

          <div v-if="colaboradorSeleccionado" class="colab-preview-box">
            <div style="font-size: 0.8125rem;">
              <strong>Renglón:</strong> {{ colaboradorSeleccionado.contrato_actual?.renglon_codigo }} ({{ colaboradorSeleccionado.contrato_actual?.renglon_nombre }})<br />
              <strong>Puesto Funcional:</strong> {{ colaboradorSeleccionado.contrato_actual?.puesto_funcional }}<br />
              <strong>Régimen:</strong>
              <span v-if="['011','022','021'].includes(colaboradorSeleccionado.contrato_actual?.renglon_codigo)" class="badge badge-info" style="margin-left: 0.5rem;">
                Relación de Dependencia (Constancia de Trabajo)
              </span>
              <span v-else class="badge badge-warning" style="margin-left: 0.5rem;">
                Servicios Técnicos / Profesionales (BR-04 Estricto: Honorarios)
              </span>
            </div>

            <!-- Explicación de la Regla de Selección de Plantillas -->
            <div v-if="['029','183','189'].includes(colaboradorSeleccionado.contrato_actual?.renglon_codigo)" class="legal-notice-box warning-notice">
              <strong>⚖️ Normativa Legal Estricta (Regla BR-04 - Contraloría General de Cuentas):</strong><br />
              Por disposición legal, a los prestadores de servicios bajo Renglón 029/Subgrupo 18 <u>NO se les emite Constancia Laboral</u> ni se usan términos como "salario" o "empleado". Únicamente se habilita la <strong>Plantilla Constancia 029-SG18.docx</strong> (Prestación de Servicios).
            </div>
            <div v-else class="legal-notice-box info-notice">
              <strong>⚖️ Régimen de Servicio Civil (Guatenóminas):</strong><br />
              Personal en relación de dependencia (Renglones 011, 021, 022). Se aplica la <strong>Plantilla Constancia Laboral.docx</strong> acreditando puesto nominal, renglón y salario devengado.
            </div>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
              <span>Formato de Plantilla Oficial (.docx) *</span>
              <span style="font-size: 0.75rem; color: var(--color-primary-700); font-weight: 500;">
                🔒 Filtrado por Régimen del Colaborador
              </span>
            </label>
            <select v-model="form.plantilla_id" class="form-control" required>
              <option value="" disabled>Seleccione un formato de plantilla oficial...</option>
              <option
                v-for="p in plantillasFiltradas"
                :key="p.id"
                :value="p.id"
              >
                {{ p.categoria }} &mdash; {{ p.nombre }}
              </option>
            </select>
          </div>

          <div v-if="plantillaSeleccionada" class="template-details-box">
            <div style="font-size: 0.8125rem;">
              <strong>📁 Archivo Plantilla:</strong> <code class="code-badge">{{ plantillaSeleccionada.ruta }}</code><br />
              <strong>🏢 Área Responsable:</strong> {{ plantillaSeleccionada.area }}<br />
              <strong>ℹ️ Descripción:</strong> {{ plantillaSeleccionada.descripcion }}
              <div style="margin-top: 0.5rem;">
                <strong>🏷️ Variables (<a href="https://github.com/alonrbar/easy-template-x" target="_blank" style="color: var(--color-primary-700); font-weight: 600;">easy-template-x</a>):</strong>
                <div class="tag-pills">
                  <span v-for="tag in plantillaSeleccionada.tags" :key="tag" class="tag-pill">
                    &#123;&#123; {{ tag }} &#125;&#125;
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Dirigido a:</label>
            <input
              v-model="form.dirigido_a"
              type="text"
              class="form-control"
              placeholder="Ej. A QUIEN INTERESE, Banco Industrial, Embajada..."
              required
            />
          </div>

          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem;">
              <input type="checkbox" v-model="form.incluye_salario" style="width: 16px; height: 16px;" />
              Incluir montos de sueldo / honorarios mensuales en el documento
            </label>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;" :disabled="loading">
            {{ loading ? 'Generando documento oficial...' : '⚡ Generar Constancia con Código QR' }}
          </button>
        </form>
      </div>

      <!-- Vista Previa Oficial en Tiempo Real -->
      <div class="card card-body official-doc-preview">
        <div v-if="constanciaEmitida" class="doc-sheet">
          <!-- Encabezado Oficial Hi-Fi SCSPR -->
          <div class="doc-header-hifi">
            <div class="header-left">
              <div class="emblem-box">
                <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5 L60 30 L85 30 L65 45 L75 70 L50 55 L25 70 L35 45 L15 30 L40 30 Z" fill="#0B2545" stroke="#0B2545" stroke-width="2"/>
                  <circle cx="50" cy="50" r="42" stroke="#0B2545" stroke-width="3" fill="none"/>
                  <text x="50" y="96" font-size="9" text-anchor="middle" font-weight="bold" fill="#0B2545">GOBIERNO DE LA REPÚBLICA DE GUATEMALA</text>
                </svg>
              </div>
              <div class="divider-line"></div>
              <div class="header-title-text">
                <span class="sec-light">Secretaría de</span><br />
                <span class="sec-bold">Comunicación Social de la Presidencia</span>
              </div>
            </div>
            <div class="header-right">
              <div class="doc-type-tag">Constancia</div>
              <div class="doc-correlativo-tag">{{ constanciaEmitida.correlativo || 'SCSP/URH/CONST-2026-00001' }}</div>
            </div>
          </div>

          <!-- Título Principal Centrado -->
          <div class="doc-title-hifi">
            {{ constanciaEmitida.texto_legal?.titulo || 'CONSTANCIA LABORAL' }}
          </div>

          <!-- Subtítulo e Infrascrito -->
          <div class="doc-intro-text">
            El infrascrito Analista de Monitoreo de Personal de la Unidad de Recursos Humanos de la Secretaría de Comunicación Social de la Presidencia.
          </div>

          <div class="doc-certifica-label">
            CERTIFICA
          </div>

          <!-- Cuerpo Legal -->
          <div class="doc-body-text">
            {{ constanciaEmitida.texto_legal?.cuerpoTexto }}
          </div>

          <!-- C.c. y Firma -->
          <div class="doc-footer-details">
            <div class="cc-box">
              <span>C.c. Archivo</span><br />
              <span>Expediente Personal</span>
            </div>

            <div class="doc-qr-block">
              <img :src="constanciaEmitida.qr_code" alt="Código QR de Validación" class="qr-img" />
              <span class="qr-sub">Validación QR Criptográfica</span>
              <span class="qr-hash">{{ constanciaEmitida.hash_verificacion?.substring(0, 16) }}...</span>
            </div>
          </div>

          <!-- Barra Azul Institucional y Pie de Página SCSPR -->
          <div class="hifi-blue-bar"></div>

          <div class="hifi-footer-row">
            <div class="social-links-col">
              <span class="social-label">Síguenos en:</span>
              <div class="social-icons">
                <span>f</span> <span>𝕏</span> <span>📷</span> <span>▶</span> <span>♪</span> <span>💬</span> <span>✈</span>
              </div>
            </div>

            <div class="contact-info-col">
              <span>3ª calle 5-19 zona 1. Teléfonos (502) 2461-4900</span><br />
              <a href="https://www.scspr.gob.gt" target="_blank" class="scspr-link">www.scspr.gob.gt</a>
            </div>
          </div>

          <div class="doc-actions-bottom" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; position: relative;">
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" @click="descargarCertificado('pdf')">
                📄 Descargar PDF Oficial
              </button>
              <router-link :to="'/certificates/verifications/' + constanciaEmitida.hash_verificacion" class="btn btn-secondary btn-sm" target="_blank">
                🔗 Validador QR
              </router-link>
            </div>

            <div class="dropdown-wrapper">
              <button class="btn btn-secondary btn-sm" @click="showMoreMenu = !showMoreMenu">
                ⚙️ Más Opciones ▾
              </button>
              <div v-if="showMoreMenu" class="dropdown-menu-box" @mouseleave="showMoreMenu = false">
                <button class="dropdown-item" @click="descargarCertificado('docx'); showMoreMenu = false;">
                  📝 Descargar Word (.docx)
                </button>
                <button class="dropdown-item" @click="imprimirDocumento(); showMoreMenu = false;">
                  🖨️ Imprimir Hoja
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="preview-placeholder" style="width: 100%;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-light); margin-bottom: 1rem;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--color-primary-900);">Previsualización de Documento</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 340px; margin-top: 0.25rem; text-align: center;">
            Seleccione un colaborador y presione el botón de generar para emitir la constancia con formato legal estandarizado y código QR de validación.
          </p>

          <div class="doc-actions-bottom" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; width: 100%; margin-top: 2.5rem; opacity: 0.55;">
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" disabled style="cursor: not-allowed;">
                📄 Descargar PDF Oficial
              </button>
              <button class="btn btn-secondary btn-sm" disabled style="cursor: not-allowed;">
                🔗 Validador QR
              </button>
            </div>
            <button class="btn btn-secondary btn-sm" disabled style="cursor: not-allowed;">
              ⚙️ Más Opciones ▾
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial de Constancias Emitidas -->
    <div class="card" style="margin-top: 2rem;">
      <div class="card-header">
        <h3 class="panel-title" style="margin: 0;">Historial de Constancias Emitidas (Pista Institucional)</h3>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Correlativo Institucional</th>
              <th>Colaborador</th>
              <th>Tipo</th>
              <th>Dirigido A</th>
              <th>Fecha Emisión</th>
              <th>Hash Validación</th>
              <th style="text-align: right;">Verificación</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in constanciasList" :key="c.id">
              <td><strong class="font-mono">{{ c.correlativo }}</strong></td>
              <td>{{ c.colaborador_nombre }}</td>
              <td>
                <span class="badge" :class="c.tipo_constancia === 'LABORAL' ? 'badge-info' : 'badge-amarillo'">
                  {{ c.tipo_constancia }}
                </span>
              </td>
              <td>{{ c.dirigido_a }}</td>
              <td>{{ new Date(c.fecha_emision).toLocaleDateString('es-GT') }}</td>
              <td><span class="font-mono" style="font-size: 0.75rem;">{{ c.hash_verificacion.substring(0, 14) }}...</span></td>
              <td style="text-align: right;">
                <router-link :to="'/certificates/verifications/' + c.hash_verificacion" class="btn btn-secondary btn-sm" target="_blank">
                  🔍 Validar QR
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
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useCollaboratorsStore } from "../stores/collaborators.store";
import { useToast } from "../composables/useToast";
import apiClient from "../api/client";

const route = useRoute();
const colabStore = useCollaboratorsStore();
const toast = useToast();

const loading = ref(false);
const showMoreMenu = ref(false);
const constanciaEmitida = ref(null);
const constanciasList = ref([]);

const plantillasDisponibles = [
  {
    id: "PLANTILLA_LABORAL",
    nombre: "Plantilla Constancia Laboral.docx",
    categoria: "Formatos Monitoreo",
    renglones: ["011", "021", "022"],
    ruta: "docs/plantillas/Formatos Monitoreo/Plantilla Constancia Laboral.docx",
    area: "Monitoreo de Personal & Nóminas",
    descripcion: "Constancia oficial laboral para personal en relación de dependencia con certificación de puesto, renglón y salario.",
    tags: ["CORRELATIVO", "NOMBRE_COMPLETO", "CUI", "PUESTO_NOMINAL", "RENGLON", "SALARIO_LETRAS", "SALARIO_NUMEROS", "FECHA_INICIO"],
  },
  {
    id: "PLANTILLA_LABORAL_INGRESOS",
    nombre: "Plantilla Constancia Laboral-Ingresos.docx",
    categoria: "Formatos Monitoreo",
    renglones: ["011", "021", "022"],
    ruta: "docs/plantillas/Formatos Monitoreo/Plantilla Constancia Laboral-Ingresos.docx",
    area: "Monitoreo de Personal & Nóminas",
    descripcion: "Constancia laboral detallada con desglose de sueldo nominal, bonificaciones y deducciones de ley.",
    tags: ["CORRELATIVO", "NOMBRE_COMPLETO", "CUI", "PUESTO_NOMINAL", "RENGLON", "SALARIO_NOMINAL", "BONIFICACION", "DESCUENTOS"],
  },
  {
    id: "PLANTILLA_029_SG18",
    nombre: "Plantilla Constancia 029-SG18.docx",
    categoria: "Formatos Monitoreo",
    renglones: ["029", "183", "189"],
    ruta: "docs/plantillas/Formatos Monitoreo/Plantilla Constancia 029-SG18.docx",
    area: "Monitoreo de Personal & Contrataciones",
    descripcion: "Constancia de servicios técnicos/profesionales bajo Ley de Contrataciones (BR-04: sin relación de dependencia).",
    tags: ["CORRELATIVO", "NOMBRE_COMPLETO", "CUI", "NUMERO_CONTRATO", "HONORARIOS_LETRAS", "HONORARIOS_NUMEROS"],
  },
  {
    id: "PLANTILLA_SIMPLE",
    nombre: "Plantilla Constancia Simple (Sin Montos)",
    categoria: "Formatos Monitoreo",
    renglones: ["011", "021", "022", "029", "183", "189"],
    ruta: "docs/plantillas/Formatos Monitoreo/Plantilla Constancia Laboral.docx",
    area: "Monitoreo de Personal",
    descripcion: "Constancia institucional simple acreditando cargo y vigencia, sin incluir montos de sueldo ni honorarios.",
    tags: ["CORRELATIVO", "NOMBRE_COMPLETO", "CUI", "PUESTO_NOMINAL", "FECHA_INICIO"],
  },
];

const form = reactive({
  persona_id: "",
  plantilla_id: "PLANTILLA_LABORAL",
  dirigido_a: "A QUIEN INTERESE",
  incluye_salario: true,
});

const colaboradorSeleccionado = computed(() => {
  return colabStore.colaboradores.find((c) => c.id === form.persona_id);
});

const plantillasFiltradas = computed(() => {
  if (!colaboradorSeleccionado.value?.contrato_actual?.renglon_codigo) {
    return plantillasDisponibles;
  }
  const renglon = colaboradorSeleccionado.value.contrato_actual.renglon_codigo;
  return plantillasDisponibles.filter((p) => p.renglones.includes(renglon));
});

const plantillaSeleccionada = computed(() => {
  return plantillasDisponibles.find((p) => p.id === form.plantilla_id) || plantillasFiltradas.value[0] || plantillasDisponibles[0];
});

watch(() => form.persona_id, (newVal) => {
  if (!newVal) return;
  const colab = colabStore.colaboradores.find((c) => c.id === newVal);
  if (colab?.contrato_actual?.renglon_codigo) {
    const renglon = colab.contrato_actual.renglon_codigo;
    const disponibles = plantillasDisponibles.filter((p) => p.renglones.includes(renglon));
    if (disponibles.length > 0) {
      form.plantilla_id = disponibles[0].id;
    }
  }
});

onMounted(async () => {
  await colabStore.fetchColaboradores();
  if (route.query.persona_id) {
    form.persona_id = route.query.persona_id;
  }
  fetchHistorial();
});

const fetchHistorial = async () => {
  try {
    const res = await apiClient.get("/certificates");
    constanciasList.value = res.data.data || [];
  } catch (err) {
    console.error("Error al cargar constancias:", err);
  }
};

const handleGenerarConstancia = async () => {
  loading.value = true;
  try {
    const res = await apiClient.post("/certificates", form);
    constanciaEmitida.value = res.data.data;
    toast.success("Constancia oficial emitida exitosamente con código QR");
    await fetchHistorial();
  } catch (err) {
    toast.error(err.response?.data?.message || "Error al emitir constancia");
  } finally {
    loading.value = false;
  }
};

const imprimirDocumento = () => {
  window.print();
};

const descargarCertificado = async (format = "pdf") => {
  if (!constanciaEmitida.value?.id) return;
  try {
    toast.info(`Generando descarga en formato ${format.toUpperCase()}...`);
    const res = await apiClient.get(`/certificates/${constanciaEmitida.value.id}/download?format=${format}`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], {
      type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${constanciaEmitida.value.correlativo}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Archivo ${format.toUpperCase()} descargado exitosamente`);
  } catch (err) {
    toast.error("Error al descargar el archivo: " + (err.response?.data?.message || err.message));
  }
};
</script>

<style scoped>
.constancias-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.panel-title {
  font-size: 1.125rem;
  color: var(--color-primary-900);
  margin-bottom: 1rem;
}

.colab-preview-box {
  background: var(--bg-subtle);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
}

.legal-notice-box {
  margin-top: 0.625rem;
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-sm, 6px);
  font-size: 0.78125rem;
  line-height: 1.45;
}

.warning-notice {
  background: #FFFBEB;
  border: 1px solid #FCD34D;
  color: #78350F;
}

.info-notice {
  background: #EFF6FF;
  border: 1px solid #93C5FD;
  color: #1E3A8A;
}

.template-details-box {
  background: #F0F4F8;
  border: 1px solid #CBD5E1;
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
}

.code-badge {
  background: #E2E8F0;
  color: #1E293B;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.75rem;
}

.tag-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.375rem;
}

.tag-pill {
  background: var(--color-primary-100, #E0F2FE);
  color: var(--color-primary-900, #0369A1);
  font-family: monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-primary-200, #BAE6FD);
}

/* Hoja Oficial de Previsualización */
.official-doc-preview {
  background: #F8FAFC;
  min-height: 450px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.doc-sheet {
  background: #FFFFFF;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  width: 100%;
  padding: 2.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.doc-header-hifi {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.divider-line {
  width: 1px;
  height: 38px;
  background: #0B2545;
}

.header-title-text {
  font-family: 'Outfit', sans-serif;
  line-height: 1.2;
}

.sec-light {
  font-size: 0.875rem;
  color: #0B2545;
  font-weight: 300;
}

.sec-bold {
  font-size: 1rem;
  color: #0B2545;
  font-weight: 800;
}

.header-right {
  text-align: right;
  font-family: sans-serif;
}

.doc-type-tag {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1E293B;
}

.doc-correlativo-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0B2545;
  font-family: monospace;
}

.doc-title-hifi {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #000000;
  margin: 1.25rem 0 0.5rem 0;
  text-transform: uppercase;
}

.doc-intro-text {
  font-size: 0.875rem;
  color: #1E293B;
  text-align: center;
  margin-bottom: 0.75rem;
}

.doc-certifica-label {
  text-align: center;
  font-weight: 800;
  font-size: 1.125rem;
  letter-spacing: 0.06em;
  color: #000000;
  margin: 0.5rem 0 1rem 0;
}

.doc-footer-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 1.5rem;
}

.cc-box {
  font-size: 0.75rem;
  color: #475569;
}

.hifi-blue-bar {
  height: 3px;
  background: #005691;
  border-radius: 2px;
  margin-top: 1.5rem;
  width: 100%;
}

.hifi-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 0.6875rem;
  color: #475569;
  padding-top: 0.5rem;
}

.social-links-col {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.social-label {
  font-size: 0.625rem;
  color: #64748B;
}

.social-icons {
  display: flex;
  gap: 0.375rem;
  font-size: 0.75rem;
}

.contact-info-col {
  text-align: right;
  line-height: 1.3;
}

.scspr-link {
  color: #005691;
  text-decoration: none;
  font-weight: 600;
}

.doc-body-text {
  font-size: 0.875rem;
  line-height: 1.8;
  color: #1E293B;
  text-align: justify;
  white-space: pre-line;
}

.doc-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border-light);
}

.doc-signer {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.signature-line {
  width: 180px;
  height: 1px;
  background: #334155;
  margin-bottom: 0.5rem;
}

.doc-qr-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-img {
  width: 90px;
  height: 90px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
}

.qr-sub {
  font-size: 0.625rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.qr-hash {
  font-size: 0.5625rem;
  font-family: monospace;
  color: var(--text-light);
}

.doc-actions-bottom {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-light);
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
}

.font-mono {
  font-family: monospace;
}

@media (max-width: 599px) {
  .doc-sheet {
    padding: 1.25rem;
  }

  .doc-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .doc-footer {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
  }

  .doc-actions-bottom {
    flex-direction: column;
  }

  .doc-actions-bottom .btn {
    width: 100%;
    justify-content: center;
    min-height: 44px;
  }
}

.dropdown-wrapper {
  position: relative;
}

.dropdown-menu-box {
  position: absolute;
  right: 0;
  bottom: 100%;
  margin-bottom: 0.5rem;
  background: #ffffff;
  border: 1px solid var(--border-light, #CBD5E1);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 190px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding: 0.375rem;
}

.dropdown-item {
  background: transparent;
  border: none;
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--text-dark, #1E293B);
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.15s ease;
  width: 100%;
}

.dropdown-item:hover {
  background: var(--bg-subtle, #F1F5F9);
  color: var(--color-primary-900, #0B2545);
}
</style>
