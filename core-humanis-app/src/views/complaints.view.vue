<template>
  <div class="complaints-view page-container">
    <!-- Encabezado Institucional -->
    <div class="adaptive-bar mb-4">
      <div>
        <span class="badge badge--neutral mb-1">Transparencia, Integridad & Clima Laboral &bull; SCSPR</span>
        <h2 class="font-heading m-0 text-institucional">Buzón de Denuncias Éticas y Laborales</h2>
        <p class="text-muted mt-1 mb-0">
          Canal institucional seguro y confidencial para la prevención del acoso laboral, faltas a la probidad e irregularidades.
        </p>
      </div>

      <div class="adaptive-bar__actions">
        <button
          class="btn btn--secondary"
          :class="{ 'btn--primary': activeTab === 'track' }"
          @click="activeTab = 'track'"
        >
          🔍 Rastrear con Código
        </button>
        <button
          class="btn btn--primary"
          :class="{ 'btn--secondary': activeTab === 'new' }"
          @click="activeTab = 'new'"
        >
          📢 Presentar Denuncia
        </button>
      </div>
    </div>

    <!-- Pestañas de Navegación -->
    <div class="tabs-nav mb-4">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'new' }"
        @click="activeTab = 'new'"
      >
        <span>📝 Formulario de Denuncia</span>
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'track' }"
        @click="activeTab = 'track'"
      >
        <span>🔎 Consulta & Seguimiento</span>
      </button>
      <button
        v-if="canManage"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'manage' }"
        @click="activeTab = 'manage'"
      >
        <span>⚖️ Gestión Institucional (RRHH / Auditoría)</span>
        <span class="badge badge--warning ml-2">{{ complaintsStore.pendientesCount }}</span>
      </button>
    </div>

    <!-- PESTAÑA 1: FORMULARIO DE NUEVA DENUNCIA -->
    <div v-if="activeTab === 'new'" class="card">
      <div class="card__header">
        <h3 class="card__title">Garantía de Confidencialidad y Protección al Denunciante</h3>
      </div>
      <div class="card__body">
        <div class="rule-box rule-box--info mb-4">
          <strong>🔒 Principio de Reserva Institucional:</strong> Las denuncias presentadas a través de este buzón están amparadas por reserva absoluta conforme al Código de Ética de la SCSPR. Si opta por la modalidad anónima, ningún dato de identidad quedará vinculado a su trámite. Se generará un <u>Código Criptográfico SHA-256 único</u> para consultar avances.
        </div>

        <!-- Recibo Criptográfico tras Envío -->
        <div v-if="submittedComplaint" class="receipt-card mb-4">
          <div class="receipt-card__header">
            <span class="badge badge--success">✓ Denuncia Registrada Exitosamente</span>
            <span class="receipt-card__correlativo">{{ submittedComplaint.correlativo }}</span>
          </div>
          <p class="receipt-card__instruction">
            Guarde de forma segura el siguiente <strong>Código Criptográfico de Seguimiento</strong>. Lo necesitará para consultar la resolución o avances de su caso de manera totalmente anónima:
          </p>
          <div class="tracking-code-display">
            <code>{{ submittedComplaint.codigo_seguimiento }}</code>
            <button type="button" class="btn btn--sm btn--secondary" @click="copyTrackingCode">
              {{ copied ? '¡Copiado!' : 'Copiar Código' }}
            </button>
          </div>
          <div class="receipt-card__footer mt-3">
            <button class="btn btn--primary" @click="resetForm">
              Presentar Otra Denuncia
            </button>
            <button class="btn btn--secondary" @click="goToTrack(submittedComplaint.codigo_seguimiento)">
              Rastrear Denuncia Ahora
            </button>
          </div>
        </div>

        <form v-else @submit.prevent="handleSubmitComplaint">
          <!-- Modalidad Anónima -->
          <div class="anonymity-switch mb-4">
            <label class="switch-container">
              <input type="checkbox" v-model="form.es_anonima" />
              <span class="switch-slider"></span>
            </label>
            <div class="switch-meta">
              <strong>Presentar de forma Anónima (Recomendado para máxima reserva)</strong>
              <small class="text-muted d-block">
                {{ form.es_anonima ? 'Sus datos personales NO serán solicitados ni almacenados.' : 'Podrá ingresar sus datos de contacto para recibir notificaciones directas.' }}
              </small>
            </div>
          </div>

          <!-- Datos del Denunciante (si no es anónima) -->
          <div v-if="!form.es_anonima" class="grid grid--3 mb-3">
            <div class="form-group">
              <label class="form-group__label">Su Nombre Completo</label>
              <input v-model="form.denunciante_nombre" type="text" class="form-group__control" placeholder="Nombre opcional" />
            </div>
            <div class="form-group">
              <label class="form-group__label">Correo Electrónico</label>
              <input v-model="form.denunciante_correo" type="email" class="form-group__control" placeholder="correo@ejemplo.com" />
            </div>
            <div class="form-group">
              <label class="form-group__label">Teléfono Móvil</label>
              <input v-model="form.denunciante_telefono" type="text" class="form-group__control" placeholder="5555-0000" />
            </div>
          </div>

          <!-- Tipo y Prioridad -->
          <div class="grid grid--2">
            <div class="form-group">
              <label class="form-group__label">Tipo de Hecho o Conducta Denunciada *</label>
              <select v-model="form.tipo_denuncia" class="form-group__control" required>
                <option value="ACOSO_LABORAL">Acoso Laboral / Hostigamiento</option>
                <option value="DISCRIMINACION">Discriminación o Menoscabo de Derechos</option>
                <option value="FALTA_ETICA">Infracción al Código de Ética Institucional</option>
                <option value="CORRUPCION_IRREGULARIDAD">Irregularidad Administrativa o Corrupción</option>
                <option value="SSO_PELIGRO">Riesgo Grave de Salud y Seguridad (SSO)</option>
                <option value="OTRO">Otro Hecho Relevante</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-group__label">Nivel de Prioridad Estimado</label>
              <select v-model="form.prioridad" class="form-group__control">
                <option value="BAJA">Baja - Asunto informativo o de mejora</option>
                <option value="MEDIA">Media - Infracción reglamentaria ordinaria</option>
                <option value="ALTA">Alta - Acoso reiterado o falta grave</option>
                <option value="URGENTE">Urgente - Afectación inmediata a integridad o patrimonio</option>
              </select>
            </div>
          </div>

          <!-- Persona o Unidad Denunciada -->
          <div class="grid grid--3">
            <div class="form-group">
              <label class="form-group__label">Persona o Sujeto Denunciado</label>
              <input v-model="form.persona_denunciada" type="text" class="form-group__control" placeholder="Nombre o referencia de la persona" />
            </div>
            <div class="form-group">
              <label class="form-group__label">Cargo Funcional (si lo conoce)</label>
              <input v-model="form.cargo_denunciado" type="text" class="form-group__control" placeholder="Ej. Encargado de área" />
            </div>
            <div class="form-group">
              <label class="form-group__label">Dirección o Dependencia Afectada</label>
              <input v-model="form.dependencia_denunciada" type="text" class="form-group__control" placeholder="Ej. Dirección de Prensa" />
            </div>
          </div>

          <!-- Fecha y Lugar -->
          <div class="grid grid--2">
            <div class="form-group">
              <label class="form-group__label">Fecha Aproximada del Incidente *</label>
              <input v-model="form.fecha_incidente" type="date" class="form-group__control" required />
            </div>
            <div class="form-group">
              <label class="form-group__label">Lugar o Espacio Físico/Virtual</label>
              <input v-model="form.lugar_incidente" type="text" class="form-group__control" placeholder="Oficina, piso, sede o canal digital" />
            </div>
          </div>

          <!-- Relato de Hechos -->
          <div class="form-group">
            <label class="form-group__label">Descripción Detallada de los Hechos *</label>
            <textarea
              v-model="form.descripcion"
              class="form-group__control"
              rows="5"
              required
              placeholder="Indique con la mayor claridad posible las circunstancias de tiempo, modo y lugar de los hechos denunciados..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-group__label">Elementos de Prueba o Testigos (Opcional)</label>
            <textarea
              v-model="form.pruebas_descripcion"
              class="form-group__control"
              rows="2"
              placeholder="Describa documentos, correos, mensajes, grabaciones o personas que presenciaron los hechos..."
            ></textarea>
          </div>

          <div class="form-actions mt-4">
            <button type="submit" class="btn btn--primary" :disabled="complaintsStore.submitting">
              <span>{{ complaintsStore.submitting ? 'Registrando Denuncia...' : '🔒 Enviar Denuncia Confidencial' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- PESTAÑA 2: SEGUIMIENTO CON CÓDIGO CRIPTOGRÁFICO -->
    <div v-if="activeTab === 'track'" class="card">
      <div class="card__header">
        <h3 class="card__title">Consulta y Estado de Denuncia Confidencial</h3>
      </div>
      <div class="card__body">
        <p class="text-muted mb-3">
          Ingrese el código de seguimiento de 64 caracteres generado al presentar su denuncia. No se le solicitará usuario ni contraseña.
        </p>

        <form @submit.prevent="handleTrackSubmit" class="tracking-search-bar mb-4">
          <input
            v-model="trackingInput"
            type="text"
            class="form-group__control"
            placeholder="Pegue aquí su Código Criptográfico de Seguimiento (64 caracteres)..."
            required
          />
          <button type="submit" class="btn btn--primary" :disabled="complaintsStore.trackingLoading">
            <span>{{ complaintsStore.trackingLoading ? 'Consultando...' : '🔍 Consultar Estado' }}</span>
          </button>
        </form>

        <div v-if="complaintsStore.trackingError" class="alert-box alert-box--danger mb-3">
          {{ complaintsStore.trackingError }}
        </div>

        <!-- Ficha de Estado Encontrada -->
        <div v-if="complaintsStore.trackedComplaint" class="status-result-card">
          <div class="status-result-card__header">
            <div>
              <span class="badge" :class="getStatusBadgeClass(complaintsStore.trackedComplaint.estado)">
                {{ complaintsStore.trackedComplaint.estado }}
              </span>
              <h4 class="mt-2 mb-0 font-heading">Expediente: {{ complaintsStore.trackedComplaint.correlativo }}</h4>
            </div>
            <div class="text-right">
              <small class="text-muted d-block">Fecha de Ingreso:</small>
              <strong>{{ formatDate(complaintsStore.trackedComplaint.created_at) }}</strong>
            </div>
          </div>

          <div class="grid grid--2 mt-3">
            <div>
              <p><strong>Tipo de Hecho:</strong> {{ complaintsStore.trackedComplaint.tipo_denuncia }}</p>
              <p><strong>Prioridad:</strong> {{ complaintsStore.trackedComplaint.prioridad }}</p>
              <p><strong>Dependencia:</strong> {{ complaintsStore.trackedComplaint.dependencia_denunciada || 'No especificada' }}</p>
            </div>
            <div>
              <p><strong>Modalidad:</strong> {{ complaintsStore.trackedComplaint.es_anonima ? 'Anónima Reservada' : 'Identificada' }}</p>
              <p><strong>Última Actualización:</strong> {{ formatDate(complaintsStore.trackedComplaint.updated_at) }}</p>
            </div>
          </div>

          <div class="resolution-box mt-3 p-3">
            <h5 class="mb-2">Determinación Institucional & Resolución Oficial:</h5>
            <p v-if="complaintsStore.trackedComplaint.resolucion_nota" class="m-0 text-dark">
              {{ complaintsStore.trackedComplaint.resolucion_nota }}
            </p>
            <p v-else class="m-0 text-muted fst-italic">
              Su denuncia se encuentra en fase de análisis preliminar por parte de la autoridad competente. Los avances se reflejarán en este panel.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 3: GESTIÓN INSTITUCIONAL (RRHH / AUDITORÍA) -->
    <div v-if="activeTab === 'manage' && canManage" class="card">
      <div class="card__header adaptive-bar">
        <h3 class="card__title">Panel de Control de Denuncias Institucionales</h3>
        <div class="adaptive-bar__actions">
          <select v-model="complaintsStore.filters.estado" @change="complaintsStore.fetchComplaints(1)" class="select-sm">
            <option value="ALL">Todos los Estados</option>
            <option value="RECIBIDA">Recibidas</option>
            <option value="EN_INVESTIGACION">En Investigación</option>
            <option value="RESUELTA">Resueltas</option>
            <option value="DESESTIMADA">Desestimadas</option>
          </select>
          <select v-model="complaintsStore.filters.prioridad" @change="complaintsStore.fetchComplaints(1)" class="select-sm">
            <option value="ALL">Todas las Prioridades</option>
            <option value="URGENTE">Urgente</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>
      </div>

      <div class="card__body p-0">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Correlativo</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in complaintsStore.complaints" :key="item.id">
                <td>
                  <strong>{{ item.correlativo }}</strong>
                </td>
                <td>{{ formatDate(item.created_at) }}</td>
                <td><small>{{ item.tipo_denuncia }}</small></td>
                <td>
                  <span class="badge" :class="item.prioridad === 'URGENTE' || item.prioridad === 'ALTA' ? 'badge--danger' : 'badge--neutral'">
                    {{ item.prioridad }}
                  </span>
                </td>
                <td>{{ item.es_anonima ? 'Anónima' : (item.denunciante_nombre || 'Identificada') }}</td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(item.estado)">
                    {{ item.estado }}
                  </span>
                </td>
                <td>
                  <button class="btn btn--sm btn--secondary" @click="openManageModal(item)">
                    ⚖️ Revisar
                  </button>
                </td>
              </tr>
              <tr v-if="complaintsStore.complaints.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">
                  No se encontraron denuncias registradas con los filtros seleccionados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Revisión y Resolución (Para RRHH / Auditor) -->
    <div v-if="selectedComplaint" class="modal modal--open" role="dialog">
      <div class="modal__overlay" @click="selectedComplaint = null"></div>
      <div class="modal__content modal__content--md">
        <div class="modal__header">
          <div>
            <h3 class="modal__title">Expediente {{ selectedComplaint.correlativo }}</h3>
            <p class="modal__subtitle">Revisión de hechos y dictamen de resolución</p>
          </div>
          <button type="button" class="modal__close-btn" @click="selectedComplaint = null">&times;</button>
        </div>
        <div class="modal__body">
          <p><strong>Tipo:</strong> {{ selectedComplaint.tipo_denuncia }} | <strong>Prioridad:</strong> {{ selectedComplaint.prioridad }}</p>
          <p><strong>Persona Denunciada:</strong> {{ selectedComplaint.persona_denunciada || 'No individualizada' }} ({{ selectedComplaint.cargo_denunciado || 'Sin cargo' }})</p>
          <p><strong>Dependencia:</strong> {{ selectedComplaint.dependencia_denunciada || 'SCSPR' }}</p>
          <div class="p-3 bg-light rounded mb-3">
            <strong>Hechos Denunciados:</strong>
            <p class="mt-1 mb-0">{{ selectedComplaint.descripcion }}</p>
          </div>

          <div class="form-group">
            <label class="form-group__label">Actualizar Estado Oficial</label>
            <select v-model="resolveForm.estado" class="form-group__control">
              <option value="RECIBIDA">RECIBIDA</option>
              <option value="EN_INVESTIGACION">EN INVESTIGACIÓN</option>
              <option value="RESUELTA">RESUELTA</option>
              <option value="DESESTIMADA">DESESTIMADA</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-group__label">Nota Oficial de Resolución o Dictamen</label>
            <textarea
              v-model="resolveForm.resolucion_nota"
              class="form-group__control"
              rows="3"
              placeholder="Ingrese las medidas tomadas o el dictamen oficial..."
            ></textarea>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--neutral" @click="selectedComplaint = null">Cerrar</button>
          <button class="btn btn--primary" @click="saveResolution">Guardar Dictamen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useComplaintsStore } from '../stores/complaints.store';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '../composables/useToast';
import { formatDate } from '../utils/date';

const complaintsStore = useComplaintsStore();
const authStore = useAuthStore();
const toast = useToast();

const activeTab = ref('new');
const trackingInput = ref('');
const submittedComplaint = ref(null);
const copied = ref(false);
const selectedComplaint = ref(null);

const canManage = computed(() => {
  return authStore.isRRHH || authStore.isAuditor || authStore.user?.role === 'ADMIN_TI';
});

const form = reactive({
  tipo_denuncia: 'ACOSO_LABORAL',
  prioridad: 'MEDIA',
  es_anonima: true,
  denunciante_nombre: '',
  denunciante_correo: '',
  denunciante_telefono: '',
  denunciante_unidad: '',
  persona_denunciada: '',
  cargo_denunciado: '',
  dependencia_denunciada: '',
  fecha_incidente: new Date().toISOString().split('T')[0],
  lugar_incidente: '',
  descripcion: '',
  pruebas_descripcion: '',
});

const resolveForm = reactive({
  estado: 'EN_INVESTIGACION',
  resolucion_nota: '',
});

onMounted(() => {
  if (canManage.value) {
    complaintsStore.fetchComplaints();
  }
});

const handleSubmitComplaint = async () => {
  try {
    const res = await complaintsStore.createComplaint({ ...form });
    submittedComplaint.value = res;
    toast.success('Denuncia registrada exitosamente');
  } catch (err) {
    toast.error(err.message || 'Error al enviar denuncia');
  }
};

const handleTrackSubmit = async () => {
  try {
    await complaintsStore.trackComplaint(trackingInput.value);
  } catch (err) {}
};

const copyTrackingCode = async () => {
  if (submittedComplaint.value?.codigo_seguimiento) {
    await navigator.clipboard.writeText(submittedComplaint.value.codigo_seguimiento);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
};

const resetForm = () => {
  submittedComplaint.value = null;
  form.descripcion = '';
  form.pruebas_descripcion = '';
};

const goToTrack = (code) => {
  trackingInput.value = code;
  activeTab.value = 'track';
  handleTrackSubmit();
};

const openManageModal = (item) => {
  selectedComplaint.value = item;
  resolveForm.estado = item.estado || 'EN_INVESTIGACION';
  resolveForm.resolucion_nota = item.resolucion_nota || '';
};

const saveResolution = async () => {
  if (!selectedComplaint.value) return;
  await complaintsStore.updateStatus(selectedComplaint.value.id, resolveForm.estado, resolveForm.resolucion_nota);
  selectedComplaint.value = null;
};

const getStatusBadgeClass = (st) => {
  switch (st) {
    case 'RESUELTA': return 'badge--success';
    case 'EN_INVESTIGACION': return 'badge--info';
    case 'DESESTIMADA': return 'badge--neutral';
    default: return 'badge--warning';
  }
};

</script>

<style scoped>
.receipt-card {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 1.5rem;
}

.receipt-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.receipt-card__correlativo {
  font-weight: 700;
  font-size: 1.1rem;
  color: #166534;
}

.tracking-code-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  overflow-x: auto;
}

.tracking-code-display code {
  font-family: monospace;
  font-size: 0.9rem;
  color: #0c2340;
  word-break: break-all;
}

.anonymity-switch {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.switch-container {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch-container input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.2s;
  border-radius: 24px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .switch-slider {
  background-color: #0c2340;
}

input:checked + .switch-slider:before {
  transform: translateX(20px);
}

.tracking-search-bar {
  display: flex;
  gap: 0.75rem;
}

.status-result-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  background-color: #ffffff;
}

.status-result-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
}

.resolution-box {
  background-color: #f8fafc;
  border-left: 4px solid #0c2340;
  border-radius: 4px;
}

.select-sm {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}
</style>
