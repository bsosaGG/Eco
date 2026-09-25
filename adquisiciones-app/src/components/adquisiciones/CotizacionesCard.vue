<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Cotizaciones</h4>

    <!-- Vista de tabla (md en adelante) -->
    <table class="hidden md:table w-full text-sm mb-4">
      <thead class="text-gray-400 text-xs uppercase">
        <tr>
          <th class="text-left py-2 px-2">Proveedor</th>
          <th class="text-right py-2 px-2">Monto</th>
          <th class="text-right py-2 px-2">Plazo (días)</th>
          <th class="text-right py-2 px-2">Garantía (meses)</th>
          <th class="text-left py-2 px-2">Cumple</th>
          <th class="text-right py-2 px-2"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="cot in expediente.cotizaciones || []" :key="cot.id_cotizacion">
          <td class="py-2 px-2">
            {{ cot.proveedor_nombre }}
            <span v-if="cot.es_adjudicada" class="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Adjudicada</span>
          </td>
          <td class="py-2 px-2 text-right font-medium">{{ formatMonto(cot.monto_ofertado) }}</td>
          <td class="py-2 px-2 text-right">{{ cot.plazo_entrega_dias ?? '—' }}</td>
          <td class="py-2 px-2 text-right">{{ cot.garantia_meses ?? '—' }}</td>
          <td class="py-2 px-2">{{ cot.cumple_especificaciones === null ? '—' : (cot.cumple_especificaciones ? 'Sí' : 'No') }}</td>
          <td class="py-2 px-2 text-right">
            <button v-if="canManageCotizaciones && !cot.es_adjudicada" @click="handleAdjudicar(cot.id_cotizacion)"
              :disabled="loading" class="text-accent text-xs font-medium hover:underline disabled:opacity-50">
              Adjudicar
            </button>
          </td>
        </tr>
        <tr v-if="!expediente.cotizaciones || expediente.cotizaciones.length === 0">
          <td colspan="6" class="py-4 text-center text-gray-400">Sin cotizaciones registradas.</td>
        </tr>
      </tbody>
    </table>

    <!-- Vista de tarjetas (mobile) -->
    <div class="md:hidden space-y-3 mb-4">
      <div v-for="cot in expediente.cotizaciones || []" :key="cot.id_cotizacion"
        class="border border-gray-200 rounded-lg p-3 text-sm">
        <div class="flex items-center justify-between mb-2">
          <p class="font-medium text-gray-800">{{ cot.proveedor_nombre }}</p>
          <span v-if="cot.es_adjudicada" class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Adjudicada</span>
        </div>
        <div class="grid grid-cols-2 gap-y-1 text-gray-500">
          <span>Monto</span>
          <span class="text-right font-medium text-gray-800">{{ formatMonto(cot.monto_ofertado) }}</span>
          <span>Plazo</span>
          <span class="text-right text-gray-800">{{ cot.plazo_entrega_dias ?? '—' }} días</span>
          <span>Garantía</span>
          <span class="text-right text-gray-800">{{ cot.garantia_meses ?? '—' }} meses</span>
          <span>Cumple especificaciones</span>
          <span class="text-right text-gray-800">{{ cot.cumple_especificaciones === null ? '—' : (cot.cumple_especificaciones ? 'Sí' : 'No') }}</span>
        </div>
        <button v-if="canManageCotizaciones && !cot.es_adjudicada" @click="handleAdjudicar(cot.id_cotizacion)"
          :disabled="loading" class="mt-2 w-full text-accent text-xs font-medium hover:underline disabled:opacity-50">
          Adjudicar
        </button>
      </div>
      <p v-if="!expediente.cotizaciones || expediente.cotizaciones.length === 0" class="py-4 text-center text-gray-400">
        Sin cotizaciones registradas.
      </p>
    </div>

    <!-- Registrar nueva cotización -->
    <div v-if="canManageCotizaciones" class="border-t border-gray-100 pt-4">
      <button @click="showNuevaCotizacion = !showNuevaCotizacion" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
        <Plus class="w-4 h-4" /> Registrar cotización
      </button>

      <div v-if="showNuevaCotizacion" class="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div v-if="cotizacionError" class="bg-red-50 text-red-600 p-2 rounded text-xs">{{ cotizacionError }}</div>

        <div class="flex gap-2">
          <select v-model="nuevaCotizacion.id_proveedor" class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm">
            <option value="" disabled>Selecciona un proveedor</option>
            <option v-for="p in proveedores" :key="p.id_proveedor" :value="p.id_proveedor">{{ p.razon_social }}</option>
          </select>
          <button type="button" @click="showNuevoProveedor = !showNuevoProveedor"
            class="text-xs text-accent font-medium hover:underline whitespace-nowrap">
            + Nuevo
          </button>
        </div>

        <div v-if="showNuevoProveedor" class="flex gap-2">
          <input v-model="nuevoProveedor.razon_social" type="text" placeholder="Razón social"
            class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
          <input v-model="nuevoProveedor.nit" type="text" placeholder="NIT"
            class="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm" />
          <button type="button" @click="handleCrearProveedor" :disabled="loading"
            class="bg-gray-700 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap">
            Agregar
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <input v-model.number="nuevaCotizacion.monto_ofertado" type="number" min="0" step="0.01" placeholder="Monto ofertado (Q)"
            class="px-2 py-1.5 border border-gray-300 rounded text-sm" />
          <input v-model.number="nuevaCotizacion.plazo_entrega_dias" type="number" min="0" placeholder="Plazo (días)"
            class="px-2 py-1.5 border border-gray-300 rounded text-sm" />
          <input v-model.number="nuevaCotizacion.garantia_meses" type="number" min="0" placeholder="Garantía (meses)"
            class="px-2 py-1.5 border border-gray-300 rounded text-sm" />
          <label class="flex items-center gap-2 text-sm text-gray-600 px-2">
            <input v-model="nuevaCotizacion.cumple_especificaciones" type="checkbox" />
            Cumple especificaciones
          </label>
        </div>

        <button @click="handleRegistrarCotizacion" :disabled="loading || !nuevaCotizacion.id_proveedor || !nuevaCotizacion.monto_ofertado"
          class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
          Guardar cotización
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';

const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const loading = ref(false);
const canManageCotizaciones = true; // TODO: restaurar cuando se trabajen roles y permisos -> authService.hasPermission('adquisiciones:manage-cotizaciones')
const proveedores = ref([]);
const showNuevaCotizacion = ref(false);
const showNuevoProveedor = ref(false);
const cotizacionError = ref('');
const nuevaCotizacion = ref({
  id_proveedor: '',
  monto_ofertado: null,
  plazo_entrega_dias: null,
  garantia_meses: null,
  cumple_especificaciones: false,
});
const nuevoProveedor = ref({ razon_social: '', nit: '' });

const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);

const loadProveedores = async () => {
  try {
    proveedores.value = await adquisicionesService.getProveedores();
  } catch (err) {
    console.error('No se pudieron cargar los proveedores', err);
  }
};

const handleAdjudicar = async (idCotizacion) => {
  loading.value = true;
  try {
    await adquisicionesService.adjudicarCotizacion(props.expediente.id_expediente, idCotizacion);
    emit('updated');
  } catch (err) {
    console.error(err);
    cotizacionError.value = err.response?.data?.message || 'No se pudo adjudicar la cotización.';
  } finally {
    loading.value = false;
  }
};

const handleCrearProveedor = async () => {
  if (!nuevoProveedor.value.razon_social || !nuevoProveedor.value.nit) return;
  loading.value = true;
  cotizacionError.value = '';
  try {
    const proveedor = await adquisicionesService.createProveedor(nuevoProveedor.value);
    await loadProveedores();
    nuevaCotizacion.value.id_proveedor = proveedor.id_proveedor;
    nuevoProveedor.value = { razon_social: '', nit: '' };
    showNuevoProveedor.value = false;
  } catch (err) {
    console.error(err);
    cotizacionError.value = err.response?.data?.message || 'No se pudo crear el proveedor.';
  } finally {
    loading.value = false;
  }
};

const handleRegistrarCotizacion = async () => {
  loading.value = true;
  cotizacionError.value = '';
  try {
    await adquisicionesService.registrarCotizacion(props.expediente.id_expediente, nuevaCotizacion.value);
    nuevaCotizacion.value = {
      id_proveedor: '',
      monto_ofertado: null,
      plazo_entrega_dias: null,
      garantia_meses: null,
      cumple_especificaciones: false,
    };
    showNuevaCotizacion.value = false;
    emit('updated');
  } catch (err) {
    console.error(err);
    cotizacionError.value = err.response?.data?.message || 'No se pudo registrar la cotización.';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (canManageCotizaciones) {
    await loadProveedores();
  }
});
</script>
