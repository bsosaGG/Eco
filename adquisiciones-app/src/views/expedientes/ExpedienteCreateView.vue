<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
      <div class="flex items-start justify-between gap-4 mb-1">
        <h3 class="text-lg font-semibold text-gray-800">Solicitud de Compra</h3>
        <span class="text-xs font-mono text-gray-400 whitespace-nowrap mt-0.5">{{ CODIGO_FORMULARIO }}</span>
      </div>
      <p class="text-sm text-gray-500 mb-6">Modalidad: Baja Cuantía. Todos los campos marcados con * son obligatorios.</p>

      <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">{{ error }}</div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unidad Solicitante *</label>
            <select v-model="form.id_unidad_solicitante" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent">
              <option value="" disabled>Selecciona una unidad</option>
              <option v-for="u in unidades" :key="u.value" :value="u.value">{{ u.text }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Funcionario Responsable</label>
            <input v-model="form.funcionario_responsable" type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Nombre del funcionario" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Segunda firma</label>
            <select v-model="form.firma2_usuario_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent">
              <option value="">Selecciona un firmante</option>
              <option v-for="u in usuariosModulo" :key="u.id_usuario" :value="u.id_usuario">
                {{ u.nombre_completo }} ({{ u.email }})
              </option>
            </select>
            <p class="text-xs text-gray-400 mt-1">Puede ser cualquier usuario del módulo — no siempre es el/la jefe de la unidad. La primera firma siempre es quien envía la solicitud.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Compra *</label>
            <div class="flex flex-wrap gap-3">
              <label v-for="opcion in TIPOS_COMPRA" :key="opcion"
                class="flex items-center gap-2 text-sm px-3 py-2 border border-gray-300 rounded-lg cursor-pointer"
                :class="form.tipo_compra === opcion ? 'bg-accent/10 border-accent text-accent-dark' : 'text-gray-600'">
                <input type="radio" name="tipo_compra" :value="opcion" v-model="form.tipo_compra" required class="accent-accent" />
                {{ opcion }}
              </label>
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-3 mb-2">
            <label class="block text-sm font-medium text-gray-700">¿Lleva Anexo (características técnicas / especificaciones especiales)?</label>
            <div class="flex gap-2">
              <button type="button" @click="form.tiene_anexo = true"
                class="px-3 py-1 rounded-lg text-xs font-medium border"
                :class="form.tiene_anexo ? 'bg-primary text-white border-primary' : 'text-gray-600 border-gray-300'">Sí</button>
              <button type="button" @click="form.tiene_anexo = false"
                class="px-3 py-1 rounded-lg text-xs font-medium border"
                :class="!form.tiene_anexo ? 'bg-primary text-white border-primary' : 'text-gray-600 border-gray-300'">No</button>
            </div>
          </div>

          <div v-if="form.tiene_anexo" class="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Características Técnicas</label>
              <textarea v-model="form.anexo_caracteristicas_tecnicas" rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="1. ...&#10;2. ...&#10;3. ..."></textarea>
              <p class="text-xs text-gray-400 mt-1">Una característica por línea (se numeran igual que en el formulario impreso).</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Especificaciones Especiales</label>
              <textarea v-model="form.anexo_especificaciones_especiales" rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="Una especificación por línea"></textarea>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Objeto de la Compra *</label>
          <input v-model="form.objeto_compra" type="text" required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent"
            placeholder="Ej. Mantenimiento preventivo de equipo de cómputo" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Justificación *</label>
          <textarea v-model="form.justificacion" required rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent"
            placeholder="Motivo de la necesidad de la compra"></textarea>
        </div>

        <!-- El monto estimado NO se captura aquí: en CU-01 todavía no hay cotización ni
             proveedor, así que cualquier monto puesto a mano en este momento sería un
             número inventado. Se calculará más adelante a partir de la cotización
             adjudicada (mismo pendiente que el precio unitario por renglón, ver nota
             abajo) -- por ahora expedientes.monto_estimado se guarda en null. -->

        <!-- Renglones solicitados (SCR-02) -->
        <RenglonesEditor v-model="form.items" :renglones="renglones" />

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" @click="$router.back()"
            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button type="submit" :disabled="submitting"
            class="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50">
            {{ submitting ? 'Enviando...' : 'Enviar Solicitud' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import adquisicionesService from '../../services/adquisiciones.service';
import RenglonesEditor from '../../components/expediente/RenglonesEditor.vue';
import { errorMessage } from '../../utils/errors';
import { nuevoRenglon } from '../../utils/renglones';

const router = useRouter();
const unidades = ref([]);
const renglones = ref([]);
const submitting = ref(false);
const error = ref('');

// FOR-DG-UA-00-01: código de formulario oficial, se manda en cada solicitud (el backend
// también lo guarda por su cuenta, con el mismo valor por defecto).
const CODIGO_FORMULARIO = 'FOR-DG-UA-00-01';
const TIPOS_COMPRA = ['Suministros', 'Equipo', 'Materiales', 'Servicios'];

// Lista de usuarios del módulo para "Segunda firma" -- se dejó de filtrar por unidad
// (usuarios_unidad_solicitante) porque en la práctica quien firma no siempre es el/la
// jefe de la unidad que solicita; puede ser cualquier usuario del módulo.
const usuariosModulo = ref([]);

const form = ref({
  id_unidad_solicitante: '',
  funcionario_responsable: '',
  firma2_usuario_id: '',
  tipo_compra: '',
  tiene_anexo: false,
  anexo_caracteristicas_tecnicas: '',
  anexo_especificaciones_especiales: '',
  objeto_compra: '',
  justificacion: '',
  items: [],
});

const handleSubmit = async () => {
  error.value = '';
  submitting.value = true;
  try {
    // Limpiamos los campos internos del autocompletado (_sugerencias, etc.) antes
    // de enviar — el backend ya los ignora, pero no hay razón para mandarlos.
    const payload = {
      ...form.value,
      codigo_formulario: CODIGO_FORMULARIO,
      firma2_usuario_id: form.value.firma2_usuario_id || null,
      // El precio de cada renglón todavía no existe en esta etapa (llega con la
      // cotización adjudicada, CU-02) — se manda 0 como valor inicial.
      items: form.value.items.map(({ descripcion, cantidad, unidad_medida, codigo_insumo, id_renglon }) => ({
        descripcion,
        cantidad,
        unidad_medida,
        codigo_insumo: codigo_insumo || null,
        id_renglon: id_renglon || null,
        costo_unitario_estimado: 0,
      })),
    };
    const expediente = await adquisicionesService.crearExpediente(payload);
    router.push({ name: 'ExpedienteDetail', params: { id: expediente.id_expediente } });
  } catch (err) {
    console.error(err);
    error.value = errorMessage(err, 'No se pudo crear el expediente.');
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    unidades.value = await adquisicionesService.getUnidades();
  } catch (err) {
    console.error('No se pudieron cargar las unidades solicitantes', err);
  }
  try {
    renglones.value = await adquisicionesService.getRenglones();
  } catch (err) {
    console.error('No se pudieron cargar los renglones presupuestarios', err);
  }
  try {
    usuariosModulo.value = await adquisicionesService.getUsuariosModulo();
  } catch (err) {
    console.error('No se pudieron cargar los usuarios del módulo', err);
  }
  form.value.items.push(nuevoRenglon());
});
</script>
