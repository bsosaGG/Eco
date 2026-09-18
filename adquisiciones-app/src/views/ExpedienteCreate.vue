<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
      <h3 class="text-lg font-semibold text-gray-800 mb-1">Solicitud de Compra</h3>
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

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Monto Estimado (Q)</label>
          <input v-model.number="form.monto_estimado" type="number" min="0" step="0.01"
            class="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent" />
        </div>

        <!-- Items (SCR-02) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">Renglones Solicitados</label>
            <button type="button" @click="addItem" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
              <Plus class="w-4 h-4" /> Agregar renglón
            </button>
          </div>
          <div class="space-y-3">
            <div v-for="(item, idx) in form.items" :key="idx"
              class="grid grid-cols-1 md:grid-cols-[1fr_100px_120px_140px_36px] gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
              <input v-model="item.descripcion" type="text" placeholder="Descripción" required
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input v-model.number="item.cantidad" type="number" min="0" step="0.01" placeholder="Cantidad" required
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input v-model="item.unidad_medida" type="text" placeholder="Unidad" required
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input v-model.number="item.costo_unitario_estimado" type="number" min="0" step="0.01" placeholder="Costo unitario" required
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button type="button" @click="removeItem(idx)" class="text-red-400 hover:text-red-600 p-2">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <p v-if="form.items.length === 0" class="text-sm text-gray-400 italic">Sin renglones agregados todavía.</p>
          </div>
        </div>

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
import { Plus, Trash2 } from 'lucide-vue-next';
import adquisicionesService from '../services/adquisiciones.service';

const router = useRouter();
const unidades = ref([]);
const submitting = ref(false);
const error = ref('');

const form = ref({
  id_unidad_solicitante: '',
  funcionario_responsable: '',
  objeto_compra: '',
  justificacion: '',
  monto_estimado: null,
  items: [],
});

const addItem = () => {
  form.value.items.push({ descripcion: '', cantidad: 1, unidad_medida: '', costo_unitario_estimado: 0 });
};
const removeItem = (idx) => form.value.items.splice(idx, 1);

const handleSubmit = async () => {
  error.value = '';
  submitting.value = true;
  try {
    const expediente = await adquisicionesService.crearExpediente(form.value);
    router.push({ name: 'ExpedienteDetail', params: { id: expediente.id_expediente } });
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || 'No se pudo crear el expediente.';
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
  addItem();
});
</script>
