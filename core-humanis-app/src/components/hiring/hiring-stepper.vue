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
            <div v-if="cuiStatus" :class="cuiStatusClass" class="cui-feedback">
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

        <div class="grid grid--2">
          <div class="form-group">
            <label class="form-group__label">Correo Institucional / Contacto *</label>
            <input 
              type="email" 
              v-model="hiringStore.formData.persona.correo_institucional" 
              class="form-group__control" 
            />
          </div>
          <div class="form-group">
            <label class="form-group__label">Teléfono</label>
            <input 
              type="text" 
              v-model="hiringStore.formData.persona.telefono" 
              class="form-group__control" 
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
        <div v-else class="direct-hiring-note">
          <p class="text-muted">
            Formalización de contratación administrativa directa (o candidato preseleccionado manualmente).
          </p>
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
import { ref, computed } from 'vue';
import { useHiringStore } from '../../stores/hiring.store';
import { useCollaboratorsStore } from '../../stores/collaborators.store';

const props = defineProps({
  selectedCandidate: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['completed', 'cancel']);

const hiringStore = useHiringStore();
const colabStore = useCollaboratorsStore();

const activeStep = ref(1);
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
  return cuiStatus.value.exists ? 'cui-feedback--warning' : 'cui-feedback--success';
});

const handleCuiBlur = () => {
  const cui = hiringStore.formData.persona.cui_dpi;
  if (cui && cui.trim().length === 13) {
    hiringStore.validateCui(cui.trim());
  }
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
    emit('completed', res);
  } catch (err) {
    alert(err.message || 'Error al formalizar la contratación');
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
</style>
