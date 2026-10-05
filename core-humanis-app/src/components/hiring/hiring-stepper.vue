<template>
  <div class="hiring-stepper card">
    <div class="card__header hiring-stepper__header">
      <div class="stepper-indicator">
        <div 
          v-for="s in steps" 
          :key="s.num" 
          class="stepper-step"
          :class="{ 
            'stepper-step--active': activeStep === s.num,
            'stepper-step--completed': activeStep > s.num 
          }"
        >
          <div class="stepper-step__circle">{{ activeStep > s.num ? '✓' : s.num }}</div>
          <span class="stepper-step__label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <div class="card__body hiring-stepper__body">
      <!-- Banner de borrador guardado en localStorage -->
      <div v-if="hiringStore.hasDraft && !selectedCandidate" class="draft-banner">
        <div class="draft-banner__content">
          <span class="draft-banner__icon">💾</span>
          <div>
            <strong>Borrador recuperado:</strong> Se han restaurado los datos que tenías en progreso.
          </div>
        </div>
        <button 
          type="button" 
          class="btn btn--sm btn--secondary" 
          @click="handleDiscardDraft"
        >
          Descartar borrador
        </button>
      </div>

      <!-- PASO 1: PERSONA (DPI ÚNICO) -->
      <div v-if="activeStep === 1" class="step-pane">
        <h4 class="step-pane__title">Paso 1: Identificación de Persona (Validación CUI / DPI)</h4>
        <p class="step-pane__desc">
          El CUI / DPI es único en el Estado guatemalteco y no se puede duplicar en el sistema.
        </p>

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-group__label">CUI / DPI (13 dígitos) *</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.persona.cui_dpi" 
              class="form-group__control" 
              placeholder="Ej. 1984567290101" 
              maxlength="13"
              @blur="handleCuiBlur"
            />
            <div v-if="cuiStatus && cuiStatus.message" :class="cuiStatusClass" class="cui-feedback">
              {{ cuiStatus.message }}
            </div>
          </div>
          <div class="form-group">
            <label class="form-group__label">NIT *</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.persona.nit" 
              class="form-group__control" 
              placeholder="Ej. 9876543-2" 
            />
          </div>
        </div>

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-group__label">Primer Nombre *</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.persona.primer_nombre" 
              class="form-group__control" 
            />
          </div>
          <div class="form-group">
            <label class="form-group__label">Segundo Nombre</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.persona.segundo_nombre" 
              class="form-group__control" 
            />
          </div>
        </div>

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-group__label">Primer Apellido *</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.persona.primer_apellido" 
              class="form-group__control" 
            />
          </div>
          <div class="form-group">
            <label class="form-group__label">Segundo Apellido</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.persona.segundo_apellido" 
              class="form-group__control" 
            />
          </div>
        </div>

        <div class="grid grid--3">
          <div class="form-group">
            <label class="form-group__label">Fecha de Nacimiento</label>
            <input 
              type="date" 
              v-model="hiringStore.formData.persona.fecha_nacimiento" 
              class="form-group__control" 
            />
          </div>
          <div class="form-group">
            <label class="form-group__label">Género</label>
            <select v-model="hiringStore.formData.persona.genero" class="form-group__control">
              <option value="">Seleccione género...</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-group__label">Estado Civil</label>
            <select v-model="hiringStore.formData.persona.estado_civil" class="form-group__control">
              <option value="">Seleccione estado civil...</option>
              <option value="SOLTERO/A">Soltero/a</option>
              <option value="CASADO/A">Casado/a</option>
            </select>
          </div>
        </div>

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-group__label">Teléfono</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.persona.telefono" 
              class="form-group__control" 
              placeholder="Ej. 55551234"
            />
          </div>
          <div class="form-group">
            <label class="form-group__label">Dirección de Residencia</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.persona.direccion" 
              class="form-group__control" 
              placeholder="Ej. Ciudad de Guatemala, Guatemala"
            />
          </div>
        </div>
      </div>

      <!-- PASO 2: CANDIDATO -->
      <div v-if="activeStep === 2" class="step-pane">
        <h4 class="step-pane__title">Paso 2: Asociación de Candidato & Terna</h4>
        <p class="step-pane__desc">
          Vinculación de la persona con la postulación o proceso de selección por oposición.
        </p>

        <!-- Banner Explicativo de Origen de Datos (UI/UX) -->
        <div class="data-origin-callout mb-3">
          <div class="data-origin-callout__icon">💡</div>
          <div class="data-origin-callout__content">
            <span class="data-origin-callout__title">¿De dónde vienen los datos de este paso?</span>
            <p v-if="selectedCandidate" class="data-origin-callout__text">
              <strong>Canal A (Oposición por Terna):</strong> Estos datos fueron importados automáticamente desde el módulo de 
              <router-link to="/recruitments" class="data-origin-link">Reclutamiento & Selección (/recruitments)</router-link>, 
              tras la calificación ciega por mérito y la selección del candidato ganador de la terna oficial.
            </p>
            <p v-else class="data-origin-callout__text">
              <strong>Canal B (Contratación Directa Externa):</strong> Los datos del candidato provienen directamente de la persona física registrada en el 
              <button type="button" class="data-origin-btn-step" @click="activeStep = 1">Paso 1 (Identificación de Persona)</button>. 
              Opcionalmente puedes enlazarlo a una plaza disponible publicada en 
              <router-link to="/recruitments" class="data-origin-link">Reclutamiento & Selección</router-link>.
            </p>
          </div>
        </div>

        <!-- Caso A: Candidato seleccionado desde pipeline/terna -->
        <div v-if="selectedCandidate" class="candidate-summary card p-3">
          <div class="candidate-summary__header">
            <strong>{{ selectedCandidate.nombres }} {{ selectedCandidate.apellidos }}</strong>
            <span class="badge badge--success">Terna Preseleccionada</span>
          </div>
          <p class="text-muted candidate-summary__plaza">
            Plaza: {{ selectedCandidate.titulo_plaza }} ({{ selectedCandidate.convocatoria_correlativo }})
          </p>
          <div class="candidate-summary__details">
            <span>Punteo Curricular: {{ selectedCandidate.punteo_curricular }}</span>
            <span>Punteo Técnico: {{ selectedCandidate.punteo_tecnico }}</span>
            <strong>Punteo Total: {{ selectedCandidate.punteo_total }} pts</strong>
          </div>
        </div>

        <!-- Caso B: Contratación Administrativa Directa con Persona Identificada en Paso 1 -->
        <div v-else class="candidate-summary card p-3">
          <div class="candidate-summary__header">
            <div>
              <strong>{{ candidateFullName || 'Persona por Contratar' }}</strong>
              <div class="text-muted text-xs">CUI: {{ hiringStore.formData.persona.cui_dpi || 'Sin CUI ingresado' }}</div>
            </div>
            <span class="badge badge--info">Contratación Directa (Sin Oposición)</span>
          </div>

          <div class="candidate-summary__details mt-2">
            <span><strong>NIT:</strong> {{ hiringStore.formData.persona.nit || 'Pendiente' }}</span>
            <span v-if="hiringStore.formData.persona.correo_institucional"><strong>Correo:</strong> {{ hiringStore.formData.persona.correo_institucional }}</span>
            <span><strong>Teléfono:</strong> {{ hiringStore.formData.persona.telefono || 'No indicado' }}</span>
          </div>

          <hr class="candidate-divider" />

          <!-- Vinculación opcional con convocatoria / plaza activa del pipeline -->
          <div class="form-group mt-2">
            <label class="form-group__label">Vincular a Plaza / Convocatoria Vigente (Opcional):</label>
            
            <div v-if="!availableConvocatorias.length" class="convocatoria-empty-callout mt-2">
              <div class="convocatoria-empty-callout__content">
                <span>💡 <strong>No hay convocatorias vigentes disponibles.</strong> Si deseas vincular este contrato a una plaza oficial de oposición por mérito, primero debes crear una convocatoria en Reclutamiento & Selección.</span>
                <div>
                  <router-link to="/recruitments" class="btn btn--sm btn--secondary mt-1 inline-block">
                    Ir a Reclutamiento & Selección (/recruitments) ➔
                  </router-link>
                </div>
              </div>
            </div>

            <select 
              v-else
              v-model="hiringStore.formData.convocatoria_id" 
              class="form-group__control"
              @change="handleConvocatoriaChange"
            >
              <option :value="null">-- Contratación Directa Externa (Sin Convocatoria previa) --</option>
              <option 
                v-for="c in availableConvocatorias" 
                :key="c.id" 
                :value="c.id"
              >
                {{ c.titulo_plaza }} ({{ c.correlativo }}) - Renglón {{ c.renglon }} ({{ c.plazas_disponibles > 0 ? c.plazas_disponibles + ' vacante(s) disponible(s)' : '⚠️ SIN VACANTES DISPONIBLES' }})
              </option>
            </select>

            <!-- Banner informativo de plazas / vacantes en la convocatoria seleccionada -->
            <div v-if="selectedConvocatoria" class="mt-2">
              <div v-if="selectedConvocatoria.plazas_disponibles > 0" class="card rule-box rule-box--info">
                <span>📌 <strong>Vacantes Disponibles:</strong> La convocatoria <strong>{{ selectedConvocatoria.correlativo }}</strong> dispone actualmente de <strong>{{ selectedConvocatoria.plazas_disponibles }} vacante(s) libre(s)</strong> para contratación institucional.</span>
              </div>
              <div v-else class="card rule-box rule-box--warning">
                <span>⚠️ <strong>Sin Vacantes Libres:</strong> La convocatoria <strong>{{ selectedConvocatoria.correlativo }}</strong> ya ha agotado sus plazas disponibles (<strong>0 vacantes libres</strong>). Si continuas formalizando la contratación, la vacante quedará excedente a las bases aprobadas.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PASO 3: EMPLEADO -->
      <div v-if="activeStep === 3" class="step-pane">
        <h4 class="step-pane__title">Paso 3: Ficha Institucional de Empleado</h4>
        <p class="step-pane__desc">
          Asignación de código de colaborador, puesto funcional y dirección administrativa.
        </p>

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-group__label">Código de Empleado *</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.empleado.codigo_empleado" 
              class="form-group__control" 
              placeholder="Ej. EMP-2026-042" 
            />
          </div>
          <div class="form-group">
            <label class="form-group__label">Dirección / Unidad Administrativa *</label>
            <select v-model="hiringStore.formData.empleado.unidad_admin_id" class="form-group__control">
              <option value="">Seleccione una unidad...</option>
              <option v-for="u in colabStore.catalogos.unidades" :key="u.id" :value="u.id">
                {{ u.nombre }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-group__label">Puesto Funcional *</label>
          <select v-model="hiringStore.formData.empleado.puesto_funcional_id" class="form-group__control">
            <option value="">Seleccione un puesto...</option>
            <option v-for="p in colabStore.catalogos.puestos_funcionales" :key="p.id" :value="p.id">
              {{ p.nombre }}
            </option>
          </select>
        </div>
      </div>

      <!-- PASO 4: CONTRATO (UN SOLO CONTRATO ACTIVO) -->
      <div v-if="activeStep === 4" class="step-pane">
        <h4 class="step-pane__title">Paso 4: Relación Laboral / Contrato</h4>
        <div class="rule-box rule-box--warning">
          <strong>Regla Estricta Institucional:</strong> Un colaborador puede tener historial de múltiples contratos, pero <u>únicamente uno activo</u> simultáneamente.
        </div>

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-group__label">Renglón Presupuestario *</label>
            <select v-model="hiringStore.formData.contrato.renglon_id" class="form-group__control">
              <option value="">Seleccione renglón...</option>
              <option v-for="r in colabStore.catalogos.renglones" :key="r.id" :value="r.id">
                Renglón {{ r.codigo }} - {{ r.nombre }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-group__label">Salario / Honorarios Mensuales (Q.) *</label>
            <input 
              type="number" 
              v-model="hiringStore.formData.contrato.salario_mensual" 
              class="form-group__control" 
              placeholder="Ej. 18000.00" 
            />
          </div>
        </div>

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-group__label">Fecha de Inicio *</label>
            <input 
              type="date" 
              v-model="hiringStore.formData.contrato.fecha_inicio" 
              class="form-group__control" 
            />
          </div>
          <div class="form-group">
            <label class="form-group__label">Fecha de Fin (Vigencia)</label>
            <input 
              type="date" 
              v-model="hiringStore.formData.contrato.fecha_fin" 
              class="form-group__control" 
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-group__label">Objeto del Contrato / Servicios *</label>
          <textarea 
            v-model="hiringStore.formData.contrato.objeto_contrato" 
            class="form-group__control" 
            rows="2"
            placeholder="Descripción precisa de las atribuciones o servicios prestados..."
          ></textarea>
        </div>

        <div v-if="hiringStore.cuiValidation.exists && hiringStore.cuiValidation.persona?.contrato_activo_id" class="form-group form-check-box">
          <label class="form-check-label">
            <input 
              type="checkbox" 
              v-model="hiringStore.formData.contrato.cerrar_contrato_anterior" 
            />
            <span>Concluir automáticamente el contrato previo activo para habilitar este nuevo contrato</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Acciones Stepper -->
    <div class="card__footer hiring-stepper__footer">
      <button 
        v-if="activeStep > 1" 
        class="btn btn--secondary" 
        @click="activeStep--"
      >
        ⮜ Anterior
      </button>
      <div class="spacer"></div>
      <button 
        v-if="activeStep < 4" 
        class="btn btn--primary" 
        :disabled="!canProceedStep" 
        @click="activeStep++"
      >
        Siguiente ➔
      </button>
      <button 
        v-else 
        class="btn btn--success" 
        :disabled="submitting || !canFormalize" 
        @click="handleFormalize"
      >
        <span v-if="submitting">Formalizando...</span>
        <span v-else>✓ Emitir y Formalizar Contratación</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useHiringStore } from '../../stores/hiring.store';
import { useCollaboratorsStore } from '../../stores/collaborators.store';
import { useToast } from '../../composables/useToast';

const props = defineProps({
  selectedCandidate: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['completed', 'cancel']);

const hiringStore = useHiringStore();
const colabStore = useCollaboratorsStore();
const toast = useToast();

const activeStep = computed({
  get: () => hiringStore.activeStep,
  set: (val) => { hiringStore.activeStep = val; }
});
const submitting = ref(false);

const steps = [
  { num: 1, label: '1. Persona' },
  { num: 2, label: '2. Candidato' },
  { num: 3, label: '3. Empleado' },
  { num: 4, label: '4. Contrato' }
];

const cuiStatus = computed(() => hiringStore.cuiValidation);
const cuiStatusClass = computed(() => {
  if (!cuiStatus.value.message) return '';
  if (cuiStatus.value.validFormat === false) return 'cui-feedback--error';
  return cuiStatus.value.exists ? 'cui-feedback--warning' : 'cui-feedback--success';
});

const candidateFullName = computed(() => {
  const p = hiringStore.formData.persona;
  const names = [p.primer_nombre, p.segundo_nombre].filter(Boolean).join(' ');
  const lastNames = [p.primer_apellido, p.segundo_apellido].filter(Boolean).join(' ');
  const full = `${names} ${lastNames}`.trim();
  return full || '';
});

const availableConvocatorias = computed(() => {
  const map = new Map();

  // 1. Convocatorias vigentes publicadas en Reclutamiento & Selección (/recruitments)
  (hiringStore.convocatorias || []).forEach(c => {
    // Filtrar únicamente convocatorias activas (PUBLICADA o EN_EVALUACION)
    const isActiva = c.estado === 'PUBLICADA' || c.estado === 'EN_EVALUACION';
    if (c.id && isActiva) {
      map.set(c.id, {
        id: c.id,
        titulo_plaza: c.titulo_plaza || c.titulo || 'Plaza Institucional',
        correlativo: c.correlativo || 'SCSPR-CONV',
        renglon: c.renglon_presupuestario || c.renglon || '029',
        salario: c.salario_honorarios || c.salario || '',
        plazas_disponibles: c.plazas_disponibles ?? 1,
        total_postulaciones: c.total_postulaciones || 0
      });
    }
  });

  // 2. Preseleccionados en Pipeline (/hiring/pipeline)
  (hiringStore.pipeline || []).forEach(p => {
    const id = p.convocatoria_id || p.id;
    if (id && !map.has(id)) {
      map.set(id, {
        id,
        titulo_plaza: p.titulo_plaza || 'Plaza Institucional',
        correlativo: p.convocatoria_correlativo || 'SCSPR-CONV',
        renglon: p.renglon_presupuestario || '029',
        salario: p.salario_convocatoria || '',
        plazas_disponibles: p.plazas_disponibles ?? 1,
        total_postulaciones: p.total_postulaciones || 0
      });
    }
  });

  return Array.from(map.values());
});

const selectedConvocatoria = computed(() => {
  const convId = hiringStore.formData.convocatoria_id;
  if (!convId) return null;
  return availableConvocatorias.value.find(c => c.id === convId) || null;
});

// Auto-guardado en localStorage cada vez que el usuario modifica los campos o navega
watch(
  () => [hiringStore.formData, hiringStore.activeStep],
  () => {
    hiringStore.saveDraft();
  },
  { deep: true }
);

onMounted(async () => {
  // Si no se proporcionó un candidato explícito de terna, intentar restaurar borrador
  if (!props.selectedCandidate) {
    hiringStore.loadDraft();
  }
  // Garantizar que se carguen convocatorias y pipeline actualizados
  hiringStore.fetchPipeline().catch(() => {});
  hiringStore.fetchConvocatorias().catch(() => {});
});

const handleConvocatoriaChange = () => {
  const convId = hiringStore.formData.convocatoria_id;
  if (!convId) return;
  const match = availableConvocatorias.value.find(c => c.id === convId);
  if (match) {
    if (match.salario && !hiringStore.formData.contrato.salario_mensual) {
      hiringStore.formData.contrato.salario_mensual = match.salario;
    }
    if (match.titulo_plaza && !hiringStore.formData.contrato.objeto_contrato) {
      hiringStore.formData.contrato.objeto_contrato = match.titulo_plaza;
    }
  }
};

const handleDiscardDraft = () => {
  if (confirm('¿Está seguro de descartar el borrador actual y reiniciar el formulario?')) {
    hiringStore.resetForm();
    emit('cancel');
  }
};

const handleCuiBlur = () => {
  const cui = hiringStore.formData.persona.cui_dpi;
  if (!cui || cui.trim().length !== 13) {
    if (cui && cui.trim().length > 0) {
      toast.error('El CUI / DPI no es válido. Debe contener exactamente 13 dígitos numéricos.');
    }
    hiringStore.validateCui(cui || '');
    return;
  }
  hiringStore.validateCui(cui.trim());
};

const canProceedStep = computed(() => {
  if (activeStep.value === 1) {
    const p = hiringStore.formData.persona;
    return p.cui_dpi && p.cui_dpi.length === 13 && p.primer_nombre && p.primer_apellido;
  }
  if (activeStep.value === 2) return true;
  if (activeStep.value === 3) {
    const e = hiringStore.formData.empleado;
    return e.puesto_funcional_id && e.unidad_admin_id;
  }
  return true;
});

const canFormalize = computed(() => {
  const c = hiringStore.formData.contrato;
  return c.renglon_id && c.salario_mensual && c.fecha_inicio && c.objeto_contrato;
});

const handleFormalize = async () => {
  submitting.value = true;
  try {
    const res = await hiringStore.formalizeHiring();
    toast.success('Contratación formalizada exitosamente');
    emit('completed', res);
  } catch (err) {
    toast.error(err.message || 'Error al formalizar la contratación');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.stepper-indicator {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px 16px;
}

.stepper-step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted, #64748b);
  font-weight: 500;
}

.stepper-step--active {
  color: var(--color-institucional, #0c2340);
  font-weight: 700;
}

.stepper-step--completed {
  color: var(--color-success, #16a34a);
}

.stepper-step__circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-alt, #e2e8f0);
  font-size: 0.85rem;
}

.stepper-step--active .stepper-step__circle {
  background: var(--color-institucional, #0c2340);
  color: #fff;
}

.stepper-step--completed .stepper-step__circle {
  background: var(--color-success, #16a34a);
  color: #fff;
}

.step-pane__title {
  font-size: 1.1rem;
  color: var(--color-institucional, #0c2340);
  margin-bottom: 4px;
}

.step-pane__desc {
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
  margin-bottom: 16px;
}

.cui-feedback {
  font-size: 0.8rem;
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 4px;
}

.cui-feedback--warning {
  background: #fef3c7;
  color: #92400e;
}

.cui-feedback--error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.cui-feedback--success {
  background: #dcfce7;
  color: #166534;
}

.candidate-summary {
  background: var(--color-bg-alt, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
}

.candidate-summary {
  padding: 1.25rem;
  border-radius: var(--radius-md, 8px);
  background: var(--color-bg-alt, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
}

.candidate-summary__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.candidate-summary__plaza {
  margin: 4px 0 8px 0;
  font-size: 0.85rem;
}

.candidate-summary__details {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
}

.rule-box {
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 16px;
}

.rule-box--warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.form-check-box {
  background: var(--color-bg-alt, #f8fafc);
  padding: 10px 14px;
  border-radius: 6px;
}

.form-check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  cursor: pointer;
}

.hiring-stepper__footer {
  display: flex;
  align-items: center;
}

.spacer {
  flex: 1;
}

.draft-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 10px 16px;
  border-radius: var(--radius-md, 8px);
  margin-bottom: 1.25rem;
}

.draft-banner__content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
}

.draft-banner__icon {
  font-size: 1.1rem;
}

.candidate-divider {
  border: 0;
  border-top: 1px solid var(--color-border-light, #e2e8f0);
  margin: 12px 0;
}

.data-origin-callout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 0.85rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md, 8px);
  color: #166534;
}

.data-origin-callout__icon {
  font-size: 1.25rem;
  line-height: 1;
}

.data-origin-callout__title {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: #14532d;
  margin-bottom: 2px;
}

.data-origin-callout__text {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: #15803d;
  margin: 0;
}

.data-origin-link {
  color: #0369a1;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.data-origin-link:hover {
  color: #075985;
}

.data-origin-btn-step {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #14532d;
  font-weight: 600;
  font-size: 0.8125rem;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-block;
}

.data-origin-btn-step:hover {
  background: #bbf7d0;
}

.convocatoria-empty-callout {
  background: #fffbebf5;
  border: 1px solid #fde68a;
  border-radius: var(--radius-md, 8px);
  padding: 0.85rem 1rem;
  color: #92400e;
  font-size: 0.85rem;
  line-height: 1.4;
}

.convocatoria-empty-callout__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
