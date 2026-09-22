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
          <div class="doc-header">
            <div class="doc-crest">🇬🇹</div>
            <div class="doc-title-block">
              <h3>GOBIERNO DE LA REPÚBLICA DE GUATEMALA</h3>
              <h4>SECRETARÍA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA</h4>
              <h5>UNIDAD DE RECURSOS HUMANOS</h5>
            </div>
          </div>

          <div class="doc-meta-row">
            <span class="doc-correlativo">REF: {{ constanciaEmitida.correlativo }}</span>
            <span class="doc-date">Guatemala</span>
          </div>

          <div class="doc-title-main">
            {{ constanciaEmitida.texto_legal?.titulo }}
          </div>

          <div class="doc-body-text">
            {{ constanciaEmitida.texto_legal?.cuerpoTexto }}
          </div>

          <div class="doc-footer">
            <div class="doc-signer">
              <div class="signature-line"></div>
              <strong>Licda. María Elena Morales Paz</strong>
              <span>Jefa de la Unidad de Recursos Humanos</span>
              <span>SCSPR</span>
            </div>

            <div class="doc-qr-block">
              <img :src="constanciaEmitida.qr_code" alt="Código QR de Validación" class="qr-img" />
              <span class="qr-sub">Escanear para verificar autenticidad</span>
              <span class="qr-hash">{{ constanciaEmitida.hash_verificacion.substring(0, 16) }}...</span>
            </div>
          </div>

          <div class="doc-actions-bottom">
            <button class="btn btn-primary btn-sm" @click="imprimirDocumento">
              🖨️ Imprimir / Guardar PDF
            </button>
            <router-link :to="'/certificates/verifications/' + constanciaEmitida.hash_verificacion" class="btn btn-secondary btn-sm" target="_blank">
              🔗 Abrir Validador Web Público
            </router-link>
          </div>
        </div>

        <div v-else class="preview-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-light); margin-bottom: 1rem;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h4>Previsualización de Documento</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); max-width: 320px; margin-top: 0.25rem;">
            Seleccione un colaborador y presione el botón de generar para emitir la constancia con formato legal estandarizado y código QR.
          </p>
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
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useCollaboratorsStore } from "../stores/collaborators.store";
import apiClient from "../api/client";

const route = useRoute();
const colabStore = useCollaboratorsStore();

const loading = ref(false);
const constanciaEmitida = ref(null);
const constanciasList = ref([]);

const form = reactive({
  persona_id: "",
  dirigido_a: "A QUIEN INTERESE",
  incluye_salario: true,
});

const colaboradorSeleccionado = computed(() => {
  return colabStore.colaboradores.find((c) => c.id === form.persona_id);
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
    if (!constanciaEmitida.value && constanciasList.value.length > 0) {
      // Pre-cargar la primera para visualización
      constanciaEmitida.value = constanciasList.value[0];
    }
  } catch (err) {
    console.error("Error al cargar constancias:", err);
  }
};

const handleGenerarConstancia = async () => {
  loading.value = true;
  try {
    const res = await apiClient.post("/certificates", form);
    constanciaEmitida.value = res.data.data;
    await fetchHistorial();
  } catch (err) {
    alert(err.response?.data?.message || "Error al emitir constancia");
  } finally {
    loading.value = false;
  }
};

const imprimirDocumento = () => {
  window.print();
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

.doc-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 2px solid var(--color-primary-900);
  padding-bottom: 0.75rem;
}

.doc-crest {
  font-size: 2rem;
}

.doc-title-block h3 {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary-900);
  letter-spacing: 0.05em;
}

.doc-title-block h4 {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary-700);
}

.doc-title-block h5 {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.doc-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.doc-correlativo {
  font-weight: 700;
  color: var(--color-primary-800);
  font-family: monospace;
}

.doc-title-main {
  text-align: center;
  font-family: 'Outfit', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-primary-900);
  text-decoration: underline;
  margin: 0.5rem 0;
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
</style>
