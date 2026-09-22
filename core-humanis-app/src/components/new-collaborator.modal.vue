<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="card-header">
        <div>
          <h3>Nuevo Colaborador / Expediente</h3>
          <p style="font-size: 0.8125rem; color: var(--text-muted);">
            Registro inicial de Persona y Vinculación Laboral Institucional
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="card-body">
        <div v-if="errorMsg" class="badge badge-rojo" style="width: 100%; padding: 0.5rem; margin-bottom: 1rem; border-radius: var(--radius-md);">
          {{ errorMsg }}
        </div>

        <h4 style="font-size: 0.875rem; margin-bottom: 0.75rem; color: var(--color-primary-700); text-transform: uppercase; letter-spacing: 0.05em;">
          1. Identificación y Datos Personales
        </h4>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">CUI / DPI (13 dígitos) *</label>
            <input
              v-model="form.cui_dpi"
              type="text"
              maxlength="13"
              class="form-control"
              placeholder="Ej. 1984567290101"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">NIT (SAT)</label>
            <input
              v-model="form.nit"
              type="text"
              class="form-control"
              placeholder="Ej. 7845123-4"
            />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Primer Nombre *</label>
            <input v-model="form.primer_nombre" type="text" class="form-control" required />
          </div>
          <div class="form-group">
            <label class="form-label">Segundo Nombre</label>
            <input v-model="form.segundo_nombre" type="text" class="form-control" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Primer Apellido *</label>
            <input v-model="form.primer_apellido" type="text" class="form-control" required />
          </div>
          <div class="form-group">
            <label class="form-label">Segundo Apellido</label>
            <input v-model="form.segundo_apellido" type="text" class="form-control" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Fecha de Nacimiento</label>
            <input v-model="form.fecha_nacimiento" type="date" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Género</label>
            <select v-model="form.genero" class="form-control">
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Teléfono Celular</label>
            <input v-model="form.telefono_personal" type="text" class="form-control" placeholder="5555-0000" />
          </div>
          <div class="form-group">
            <label class="form-label">Correo Institucional</label>
            <input v-model="form.correo_institucional" type="email" class="form-control" placeholder="nombre.apellido@scspr.gob.gt" />
          </div>
        </div>

        <h4 style="font-size: 0.875rem; margin: 1rem 0 0.75rem; color: var(--color-primary-700); text-transform: uppercase; letter-spacing: 0.05em;">
          2. Relación Laboral / Nombramiento
        </h4>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Renglón Presupuestario *</label>
            <select v-model="form.renglon_codigo" class="form-control" required>
              <option value="011">011 - Personal Permanente</option>
              <option value="022">022 - Personal por Contrato</option>
              <option value="021">021 - Supernumerario</option>
              <option value="029">029 - Servicios Técnicos / Profesionales</option>
              <option value="183">183 - Servicios Jurídicos</option>
              <option value="189">189 - Otros Estudios y Servicios</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Unidad Administrativa *</label>
            <select v-model="form.unidad_admin" class="form-control" required>
              <option value="Despacho Superior (Secretaría)">Despacho Superior (Secretaría)</option>
              <option value="Despacho de la Subsecretaría">Despacho de la Subsecretaría</option>
              <option value="Dirección de Prensa y Noticias">Dirección de Prensa y Noticias</option>
              <option value="Dirección de Comunicación Digital">Dirección de Comunicación Digital</option>
              <option value="Dirección de Producción Audiovisual">Dirección de Producción Audiovisual</option>
              <option value="Dirección Administrativa y Financiera">Dirección Administrativa y Financiera</option>
              <option value="Unidad de Recursos Humanos">Unidad de Recursos Humanos</option>
              <option value="Unidad de Informática y Tecnología">Unidad de Informática y Tecnología</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Puesto Funcional (Operativo) *</label>
            <input v-model="form.puesto_funcional" type="text" class="form-control" placeholder="Ej. Asesor de Prensa" required />
          </div>

          <div class="form-group">
            <label class="form-label">Puesto Nominal (ONSEC / Presupuesto)</label>
            <input v-model="form.puesto_nominal" type="text" class="form-control" placeholder="Ej. Servicios Profesionales" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">
              {{ ['011','022','021'].includes(form.renglon_codigo) ? 'Salario Nominal Mensual (Q) *' : 'Honorarios Mensuales (Q) *' }}
            </label>
            <input v-model="form.salario_honorarios" type="number" step="0.01" class="form-control" placeholder="20000.00" required />
          </div>

          <div class="form-group">
            <label class="form-label">No. Acuerdo / Contrato</label>
            <input v-model="form.numero_acuerdo_contrato" type="text" class="form-control" placeholder="SCSPR-029-2026-001" />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Fecha de Inicio / Posesión *</label>
            <input v-model="form.fecha_inicio" type="date" class="form-control" required />
          </div>

          <div class="form-group">
            <label class="form-label">Fecha de Vencimiento de Contrato</label>
            <input v-model="form.fecha_fin" type="date" class="form-control" />
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Crear Expediente Digital' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useCollaboratorsStore } from "../stores/collaborators.store";

const emit = defineEmits(["close", "created"]);
const colabStore = useCollaboratorsStore();

const loading = ref(false);
const errorMsg = ref("");

const form = reactive({
  cui_dpi: "",
  nit: "",
  primer_nombre: "",
  segundo_nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  fecha_nacimiento: "",
  genero: "MASCULINO",
  telefono_personal: "",
  correo_institucional: "",
  renglon_codigo: "011",
  unidad_admin: "Despacho Superior (Secretaría)",
  puesto_funcional: "",
  puesto_nominal: "",
  salario_honorarios: "",
  numero_acuerdo_contrato: "",
  fecha_inicio: new Date().toISOString().split("T")[0],
  fecha_fin: "",
});

const handleSubmit = async () => {
  errorMsg.value = "";
  if (form.cui_dpi.length !== 13) {
    errorMsg.value = "El CUI/DPI debe contener exactamente 13 dígitos";
    return;
  }

  loading.value = true;
  try {
    const res = await colabStore.crearColaborador(form);
    emit("created", res.data);
    emit("close");
  } catch (err) {
    errorMsg.value = err.message || "Error al crear el colaborador";
  } finally {
    loading.value = false;
  }
};
</script>
