<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="card-header">
        <div>
          <h3>Adjuntar Documento al Expediente</h3>
          <p style="font-size: 0.8125rem; color: var(--text-muted);">
            Colaborador: <strong>{{ colaboradorNombre }}</strong>
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="card-body">
        <div class="form-group">
          <label class="form-label">Tipo de Documento *</label>
          <select v-model="form.tipo_codigo" @change="handleTipoChange" class="form-control" required>
            <option value="DOC_FINIQ_CGC">Finiquito CGC (Vigencia Legal Estricta de 6 meses)</option>
            <option value="DOC_DPI">Documento Personal de Identificación (DPI)</option>
            <option value="DOC_RTU">Constancia de RTU Actualizado (SAT)</option>
            <option value="DOC_IGSS">Carné / Afiliación IGSS</option>
            <option value="DOC_CV">Currículum Vitae con Atestados</option>
            <option value="DOC_TITULO">Títulos y Diplomas Acreditados</option>
            <option value="DOC_COLEG">Constancia de Colegiado Activo</option>
            <option value="DOC_DJP_CGC">Declaración Jurada Patrimonial (DJP)</option>
            <option value="DOC_ANTEC_PEN">Carencia de Antecedentes Penales</option>
            <option value="DOC_ANTEC_POL">Carencia de Antecedentes Policiales</option>
            <option value="DOC_CONTRATO">Acuerdo de Nombramiento / Contrato Firmado</option>
            <option value="DOC_ACTA_POS">Acta de Toma de Posesión / Inicio</option>
          </select>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">No. de Documento / Registro</label>
            <input v-model="form.numero_documento" type="text" class="form-control" placeholder="Ej. CGC-2026-00412" />
          </div>

          <div class="form-group">
            <label class="form-label">Fecha de Expedición / Emisión *</label>
            <input v-model="form.fecha_emision" @change="calcularVencimientoAutomatico" type="date" class="form-control" required />
          </div>
        </div>

        <div v-if="requiereVencimiento" class="form-group">
          <label class="form-label">
            Fecha de Vencimiento
            <span v-if="form.tipo_codigo === 'DOC_FINIQ_CGC'" style="color: var(--color-primary-700); font-weight: normal; font-size: 0.75rem;">
              (Calculada automáticamente a 6 meses según BR-02)
            </span>
          </label>
          <input v-model="form.fecha_vencimiento" type="date" class="form-control" />
        </div>

        <div class="form-group">
          <label class="form-label">Archivo Digital (PDF o Imagen de alta calidad) *</label>
          <input type="file" accept=".pdf,image/jpeg,image/png" @change="handleFileChange" class="form-control" />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Subiendo...' : 'Registrar en Expediente' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useCollaboratorsStore } from "../stores/collaborators.store";
import { useToast } from "../composables/useToast";

const props = defineProps({
  colaboradorId: { type: String, required: true },
  colaboradorNombre: { type: String, required: true },
});

const emit = defineEmits(["close", "uploaded"]);
const colabStore = useCollaboratorsStore();
const toast = useToast();

const loading = ref(false);
const selectedFile = ref(null);

const form = reactive({
  tipo_codigo: "DOC_FINIQ_CGC",
  numero_documento: "",
  fecha_emision: new Date().toISOString().split("T")[0],
  fecha_vencimiento: "",
});

const requiereVencimiento = computed(() => {
  return ["DOC_FINIQ_CGC", "DOC_COLEG", "DOC_DJP_CGC", "DOC_ANTEC_PEN", "DOC_ANTEC_POL", "DOC_CONTRATO"].includes(form.tipo_codigo);
});

const calcularVencimientoAutomatico = () => {
  if (form.tipo_codigo === "DOC_FINIQ_CGC" && form.fecha_emision) {
    const d = new Date(form.fecha_emision);
    d.setMonth(d.getMonth() + 6);
    form.fecha_vencimiento = d.toISOString().split("T")[0];
  }
};

calcularVencimientoAutomatico();

const handleTipoChange = () => {
  calcularVencimientoAutomatico();
};

const handleFileChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    selectedFile.value = e.target.files[0];
  }
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("tipo_codigo", form.tipo_codigo);
    formData.append("numero_documento", form.numero_documento);
    formData.append("fecha_emision", form.fecha_emision);
    if (form.fecha_vencimiento) {
      formData.append("fecha_vencimiento", form.fecha_vencimiento);
    }
    if (selectedFile.value) {
      formData.append("archivo", selectedFile.value);
    }

    await colabStore.subirDocumento(props.colaboradorId, formData);
    toast.success("Documento subido exitosamente");
    emit("uploaded");
    emit("close");
  } catch (err) {
    toast.error(err.message || "Error al subir documento");
  } finally {
    loading.value = false;
  }
};
</script>
