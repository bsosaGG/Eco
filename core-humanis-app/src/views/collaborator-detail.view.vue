<template>
  <div class="dossier-page" v-if="colaborador">
    <!-- Barra Superior de Retorno y Acciones -->
    <div class="top-nav-bar adaptive-bar mb-4">
      <router-link to="/collaborators" class="btn btn-secondary btn-sm">
        ← Volver al Directorio
      </router-link>

      <div class="top-actions adaptive-bar__actions">
        <button
          v-if="authStore.canIssueConstancias"
          class="btn btn-primary btn-sm"
          @click="irAConstancia"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          Emitir Constancia Oficial
        </button>

        <button class="btn btn-secondary btn-sm" @click="imprimirFicha">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect width="12" height="8" x="6" y="14"></rect>
          </svg>
          Imprimir Ficha Resumen
        </button>
      </div>
    </div>

    <!-- Tarjeta Principal de Identidad 360° -->
    <div class="header-card card">
      <div class="header-main">
        <img
          :src="colaborador.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'"
          class="avatar-lg"
          alt="Foto Colaborador"
        />

        <div class="header-info">
          <div class="badges-row">
            <span class="badge badge-info">
              Renglón {{ colaborador.contrato_actual?.renglon_codigo || '011' }} &bull; {{ colaborador.contrato_actual?.renglon_nombre }}
            </span>
            <span class="badge" :class="'badge-' + (colaborador.semaforo_expediente?.color || 'verde')">
              <span class="indicator-dot" :class="colaborador.semaforo_expediente?.color || 'verde'"></span>
              {{ colaborador.semaforo_expediente?.badge || 'Expediente Completo' }}
            </span>
          </div>

          <h1 class="colab-fullname">
            {{ colaborador.primer_nombre }} {{ colaborador.segundo_nombre || '' }} {{ colaborador.primer_apellido }} {{ colaborador.segundo_apellido || '' }}
          </h1>

          <p class="colab-puesto">
            <strong>{{ colaborador.contrato_actual?.puesto_funcional }}</strong> &mdash; {{ colaborador.contrato_actual?.unidad_admin }}
          </p>

          <div class="quick-meta-grid">
            <div class="meta-item">
              <span class="meta-label">CUI / DPI:</span>
              <span class="meta-val font-mono">{{ colaborador.cui_dpi }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">NIT (SAT):</span>
              <span class="meta-val">{{ colaborador.nit || 'No registrado' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">No. IGSS:</span>
              <span class="meta-val">{{ colaborador.igss_afiliacion || 'N/A (Sin afiliación)' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Compensación:</span>
              <span class="meta-val highlight">
                Q {{ Number(colaborador.contrato_actual?.salario_honorarios || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 }) }}
                <small>({{ ['011','022','021'].includes(colaborador.contrato_actual?.renglon_codigo) ? 'Salario' : 'Honorarios' }})</small>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pestañas del Dossier 360° -->
    <div class="tabs-nav">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'general' }"
        @click="activeTab = 'general'"
      >
        Resumen General
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'laboral' }"
        @click="activeTab = 'laboral'"
      >
        Puestos y Contratos
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'expediente' }"
        @click="activeTab = 'expediente'"
      >
        Expediente Digital ({{ colaborador.documentos?.length || 0 }} docs)
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'personal' }"
        @click="activeTab = 'personal'"
      >
        Datos Personales
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'academico' }"
        @click="activeTab = 'academico'"
      >
        Formación y Colegiado
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'constancias' }"
        @click="seleccionarTabConstancias"
      >
        Constancias QR ({{ colabStore.constanciasColaborador.length }})
      </button>
    </div>

    <!-- Contenido de las Pestañas -->
    <div class="tab-content">
      <!-- PESTAÑA 1: RESUMEN GENERAL -->
      <div v-if="activeTab === 'general'" class="grid-2">
        <div class="card card-body">
          <h3 class="section-title">Información de Nombramiento Vigente</h3>
          <div class="details-list">
            <div class="detail-row">
              <span class="detail-name">Puesto Funcional (Operativo):</span>
              <span class="detail-value"><strong>{{ colaborador.contrato_actual?.puesto_funcional }}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Puesto Nominal (ONSEC):</span>
              <span class="detail-value">{{ colaborador.contrato_actual?.puesto_nominal }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Unidad / Dirección:</span>
              <span class="detail-value">{{ colaborador.contrato_actual?.unidad_admin }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">No. Acuerdo / Contrato:</span>
              <span class="detail-value font-mono">{{ colaborador.contrato_actual?.numero_acuerdo_contrato || 'Pendiente' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Partida Presupuestaria:</span>
              <span class="detail-value font-mono">{{ colaborador.contrato_actual?.partida_presupuestaria }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Fecha de Inicio / Posesión:</span>
              <span class="detail-value">{{ colaborador.contrato_actual?.fecha_inicio }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Fecha Vencimiento Contrato:</span>
              <span class="detail-value">{{ colaborador.contrato_actual?.fecha_fin || 'Indefinido (Permanente)' }}</span>
            </div>
          </div>
        </div>

        <div class="card card-body">
          <h3 class="section-title">Semáforo de Cumplimiento Documental</h3>
          <div style="margin-bottom: 1rem;">
            <span class="badge" :class="'badge-' + (colaborador.semaforo_expediente?.color || 'verde')">
              {{ colaborador.semaforo_expediente?.badge }}
            </span>
          </div>

          <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.6;">
            El expediente digital consolida la documentación obligatoria y legal requerida por la Contraloría General de Cuentas (CGC) y ONSEC según el renglón presupuestario <strong>{{ colaborador.contrato_actual?.renglon_codigo }}</strong>.
          </p>

          <div style="margin-top: 1.25rem;">
            <button class="btn btn-secondary btn-sm" @click="activeTab = 'expediente'">
              Ver Repositorio de Documentos →
            </button>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 2: PUESTOS Y CONTRATOS (DUALIDAD BR-01) -->
      <div v-if="activeTab === 'laboral'" class="card card-body">
        <h3 class="section-title">Contrataciones y Movimientos Institucionales</h3>
        <p style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.5rem;">
          Implementación de la regla <strong>BR-01</strong>: Distinción entre Puesto Nominal oficial y Puesto Funcional operativo.
        </p>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Renglón</th>
                <th>Puesto Funcional</th>
                <th>Puesto Nominal</th>
                <th>Acuerdo / Contrato</th>
                <th>Vigencia</th>
                <th>Monto Mensual</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="badge badge-info">{{ colaborador.contrato_actual?.renglon_codigo }}</span></td>
                <td><strong>{{ colaborador.contrato_actual?.puesto_funcional }}</strong></td>
                <td>{{ colaborador.contrato_actual?.puesto_nominal }}</td>
                <td><span class="font-mono">{{ colaborador.contrato_actual?.numero_acuerdo_contrato }}</span></td>
                <td>{{ colaborador.contrato_actual?.fecha_inicio }} al {{ colaborador.contrato_actual?.fecha_fin || 'Vigente' }}</td>
                <td><strong>Q {{ Number(colaborador.contrato_actual?.salario_honorarios || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 }) }}</strong></td>
                <td><span class="badge badge-verde">ACTIVO</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PESTAÑA 3: EXPEDIENTE DIGITAL -->
      <div v-if="activeTab === 'expediente'" class="card card-body">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h3 class="section-title">Expediente Digital Único</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">
              Documentación digitalizada y semáforos de caducidad legal (CGC, Antecedentes, Colegiado)
            </p>
          </div>

          <button v-if="authStore.canWrite" class="btn btn-primary btn-sm" @click="showSubirDocModal = true">
            + Adjuntar Documento
          </button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tipo de Documento</th>
                <th>No. Documento</th>
                <th>Emisión</th>
                <th>Vencimiento</th>
                <th>Semáforo Legal</th>
                <th>Archivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in colaborador.documentos" :key="d.id">
                <td>
                  <strong>{{ d.tipo_nombre }}</strong>
                  <span v-if="d.tipo_codigo === 'DOC_FINIQ_CGC'" class="badge badge-amarillo" style="margin-left: 0.5rem; font-size: 0.6875rem;">
                    Regla 6 meses CGC
                  </span>
                </td>
                <td><span class="font-mono">{{ d.numero_documento || 'S/N' }}</span></td>
                <td>{{ d.fecha_emision || 'N/A' }}</td>
                <td>{{ d.fecha_vencimiento || 'No expira' }}</td>
                <td>
                  <span class="badge" :class="'badge-' + (d.vigencia_color || 'verde')">
                    <span class="indicator-dot" :class="d.vigencia_color || 'verde'"></span>
                    {{ d.vigencia_label || d.estado_vigencia }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" @click="verArchivo(d)">
                    📄 {{ d.nombre_archivo }}
                  </button>
                </td>
              </tr>

              <tr v-if="!colaborador.documentos || colaborador.documentos.length === 0">
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                  Aún no se han adjuntado documentos digitalizados a este expediente.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PESTAÑA 4: DATOS PERSONALES -->
      <div v-if="activeTab === 'personal'" class="card card-body">
        <h3 class="section-title">Datos Personales y de Contacto</h3>
        <div class="grid-2" style="margin-top: 1rem;">
          <div class="details-list">
            <div class="detail-row">
              <span class="detail-name">Nombres:</span>
              <span class="detail-value">{{ colaborador.primer_nombre }} {{ colaborador.segundo_nombre || '' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Apellidos:</span>
              <span class="detail-value">{{ colaborador.primer_apellido }} {{ colaborador.segundo_apellido || '' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Fecha de Nacimiento:</span>
              <span class="detail-value">{{ colaborador.fecha_nacimiento || 'No registrada' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Género:</span>
              <span class="detail-value">{{ colaborador.genero }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Estado Civil:</span>
              <span class="detail-value">{{ colaborador.estado_civil }}</span>
            </div>
          </div>

          <div class="details-list">
            <div class="detail-row">
              <span class="detail-name">Dirección de Residencia:</span>
              <span class="detail-value">{{ colaborador.direccion_residencia || 'Guatemala' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Teléfono Celular:</span>
              <span class="detail-value">{{ colaborador.telefono_personal || 'No registrado' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Correo Institucional:</span>
              <span class="detail-value">{{ colaborador.correo_institucional }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-name">Correo Personal:</span>
              <span class="detail-value">{{ colaborador.correo_personal || 'No registrado' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 5: FORMACIÓN Y COLEGIACIÓN -->
      <div v-if="activeTab === 'academico'" class="card card-body">
        <h3 class="section-title">Perfil Académico y Colegiación Profesional</h3>
        <div v-for="(est, i) in (colaborador.estudios || [])" :key="i" class="card" style="margin-top: 1rem; padding: 1.25rem; background: var(--bg-subtle);">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <h4 style="color: var(--color-primary-800);">{{ est.titulo_obtenido }}</h4>
              <p style="color: var(--text-muted); font-size: 0.875rem;">{{ est.institucion }} &bull; {{ est.nivel_academico }}</p>
            </div>
            <div v-if="est.numero_colegiado">
              <span class="badge badge-verde">Colegiado Activo: No. {{ est.numero_colegiado }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑA 6: CONSTANCIAS EMITIDAS (HATEOAS BIDIRECCIONAL) -->
      <div v-if="activeTab === 'constancias'" class="card card-body">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 class="section-title">Constancias Laborales Oficiales</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">
              Documentos generados con firma digital institucional y código QR de validación pública
            </p>
          </div>

          <button
            v-if="authStore.canIssueConstancias"
            class="btn btn-primary btn-sm"
            @click="irAConstancia"
          >
            + Emitir Nueva Constancia
          </button>
        </div>

        <div v-if="colabStore.loadingConstancias" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Cargando historial de constancias emitidas...
        </div>

        <div v-else-if="colabStore.constanciasColaborador.length === 0" style="text-align: center; padding: 2.5rem; color: var(--text-muted); background: var(--bg-subtle); border-radius: var(--radius-md);">
          📄 No se han emitido constancias laborales para este colaborador aún.
        </div>

        <div v-else class="table-container table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Correlativo</th>
                <th>Tipo</th>
                <th>Dirigido a</th>
                <th>Fecha Emisión</th>
                <th>Hash de Seguridad</th>
                <th style="text-align: right;">Verificación Pública</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in colabStore.constanciasColaborador" :key="c.id">
                <td><strong class="font-mono">{{ c.correlativo }}</strong></td>
                <td>
                  <span class="badge" :class="c.tipo_constancia === 'LABORAL' ? 'badge-info' : 'badge-warning'">
                    {{ c.tipo_constancia === 'LABORAL' ? 'Laboral (011/022)' : 'Servicios (029)' }}
                  </span>
                </td>
                <td>{{ c.dirigido_a || 'A QUIEN INTERESE' }}</td>
                <td>{{ new Date(c.fecha_emision).toLocaleDateString('es-GT') }}</td>
                <td><span class="font-mono" style="font-size: 0.75rem; color: var(--text-muted);">{{ c.hash_verificacion?.substring(0, 16) }}...</span></td>
                <td style="text-align: right;">
                  <a
                    :href="'/core-humanis/certificates/verifications/' + c.hash_verificacion"
                    target="_blank"
                    class="btn btn-secondary btn-sm"
                    title="Verificar en portal público QR"
                  >
                    Verificar QR ↗
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Subir Documento -->
    <SubirDocumentoModal
      v-if="showSubirDocModal"
      :colaborador-id="colaborador.id"
      :colaborador-nombre="colaborador.primer_nombre + ' ' + colaborador.primer_apellido"
      @close="showSubirDocModal = false"
      @uploaded="handleDocUploaded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import { useCollaboratorsStore } from "../stores/collaborators.store";
import SubirDocumentoModal from "../components/upload-document.modal.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const colabStore = useCollaboratorsStore();

const colaborador = ref(null);
const activeTab = ref("general");
const showSubirDocModal = ref(false);

const loadColaborador = async () => {
  colaborador.value = await colabStore.fetchColaboradorById(route.params.id);
  if (colaborador.value?.id) {
    colabStore.fetchConstanciasColaborador(colaborador.value.id);
  }
};

const seleccionarTabConstancias = () => {
  activeTab.value = "constancias";
  if (colaborador.value?.id) {
    colabStore.fetchConstanciasColaborador(colaborador.value.id);
  }
};

onMounted(() => {
  loadColaborador();
});

const handleDocUploaded = () => {
  loadColaborador();
  colabStore.fetchAlertas();
};

const irAConstancia = () => {
  router.push({ path: "/certificates", query: { persona_id: colaborador.value?.id } });
};

const imprimirFicha = () => {
  window.print();
};

const verArchivo = (doc) => {
  alert(`Visualizador Integrado: Previsualizando "${doc.nombre_archivo}" (No. ${doc.numero_documento || 'S/N'}). Estado de vigencia legal: ${doc.estado_vigencia}.`);
};
</script>

<style scoped>
.dossier-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.top-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.top-actions {
  display: flex;
  gap: 0.5rem;
}

.header-card {
  padding: 1.5rem;
}

.header-main {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.avatar-lg {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border-light);
  box-shadow: var(--shadow-md);
}

.header-info {
  flex: 1;
}

.badges-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.colab-fullname {
  font-size: 1.625rem;
  font-weight: 700;
  line-height: 1.2;
}

.colab-puesto {
  color: var(--text-muted);
  font-size: 0.9375rem;
  margin-top: 0.25rem;
}

.quick-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-light);
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-light);
}

.meta-val {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-main);
}

.meta-val.highlight {
  color: var(--color-primary-700);
}

.section-title {
  font-size: 1.125rem;
  color: var(--color-primary-900);
  margin-bottom: 1rem;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-light);
  font-size: 0.875rem;
}

.detail-name {
  color: var(--text-muted);
}

.font-mono {
  font-family: monospace;
}

@media (max-width: 768px) {
  .header-main { flex-direction: column; text-align: center; }
  .badges-row { justify-content: center; }
  .quick-meta-grid { justify-content: center; }
  .detail-row { flex-direction: column; gap: 0.25rem; }
}
</style>
