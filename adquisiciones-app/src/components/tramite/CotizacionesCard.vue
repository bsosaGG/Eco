<template>
  <div>
    <div class="flex items-center justify-between gap-3 mb-3">
      <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cotizaciones</h4>
      <button v-if="canManageCotizaciones" type="button" @click="showNuevaCotizacion = true" class="btn-primario">
        <Plus class="w-4 h-4" /> Registrar cotización
      </button>
    </div>

    <EstadoVacio v-if="cotizaciones.length === 0" :icono="Receipt" titulo="Todavía no hay cotizaciones"
      :detalle="canManageCotizaciones ? 'Registre la oferta de cada proveedor y posteriormente adjudique la más conveniente.' : 'Aquí aparecerán las ofertas de los proveedores.'" />

    <template v-else>
      <!-- Vista de tabla (md en adelante) -->
      <table class="hidden md:table w-full text-sm">
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
          <tr v-for="cot in cotizaciones" :key="cot.id_cotizacion" class="hover:bg-gray-50 transition-colors">
            <td class="py-2 px-2">
              {{ cot.proveedor_nombre }}
              <span v-if="cot.es_adjudicada" class="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Adjudicada</span>
            </td>
            <td class="py-2 px-2 text-right font-medium">{{ formatMonto(cot.monto_ofertado) }}</td>
            <td class="py-2 px-2 text-right">{{ cot.plazo_entrega_dias ?? '—' }}</td>
            <td class="py-2 px-2 text-right">{{ cot.garantia_meses ?? '—' }}</td>
            <td class="py-2 px-2">{{ cot.cumple_especificaciones === null ? '—' : (cot.cumple_especificaciones ? 'Sí' : 'No') }}</td>
            <td class="py-2 px-2 text-right">
              <button v-if="canManageCotizaciones && !cot.es_adjudicada" @click="handleAdjudicar(cot)"
                :disabled="loading" class="text-accent text-xs font-medium hover:underline disabled:opacity-50">
                Adjudicar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Vista de tarjetas (mobile) -->
      <div class="md:hidden space-y-3">
        <div v-for="cot in cotizaciones" :key="cot.id_cotizacion"
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
          <button v-if="canManageCotizaciones && !cot.es_adjudicada" @click="handleAdjudicar(cot)"
            :disabled="loading" class="mt-2 w-full text-accent text-xs font-medium hover:underline disabled:opacity-50">
            Adjudicar
          </button>
        </div>
      </div>
    </template>

    <!-- Registrar una cotización -->
    <ModalBase v-model="showNuevaCotizacion" titulo="Registrar cotización" :subtitulo="`Expediente ${expediente.codigo_expediente}`">
      <div class="space-y-4">
        <div>
          <label class="etiqueta">Proveedor *</label>
          <div class="flex gap-2">
            <select v-model="nuevaCotizacion.id_proveedor" class="campo flex-1">
              <option value="" disabled>Seleccione un proveedor</option>
              <option v-for="p in proveedores" :key="p.id_proveedor" :value="p.id_proveedor">{{ p.razon_social }}</option>
            </select>
            <button type="button" @click="showNuevoProveedor = true" class="btn-secundario whitespace-nowrap">
              <Plus class="w-4 h-4" /> Nuevo
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="etiqueta">Monto ofertado (Q) *</label>
            <input v-model.number="nuevaCotizacion.monto_ofertado" type="number" min="0" step="0.01" class="campo" />
          </div>
          <div>
            <label class="etiqueta">Plazo de entrega (días)</label>
            <input v-model.number="nuevaCotizacion.plazo_entrega_dias" type="number" min="0" class="campo" />
          </div>
          <div>
            <label class="etiqueta">Garantía (meses)</label>
            <input v-model.number="nuevaCotizacion.garantia_meses" type="number" min="0" class="campo" />
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-600 sm:pt-6">
            <input v-model="nuevaCotizacion.cumple_especificaciones" type="checkbox" class="accent-accent" />
            Cumple las especificaciones
          </label>
        </div>
      </div>
      <template #footer>
        <button type="button" @click="showNuevaCotizacion = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleRegistrarCotizacion" :disabled="loading || !nuevaCotizacion.id_proveedor || !nuevaCotizacion.monto_ofertado" class="btn-primario">
          {{ loading ? 'Guardando...' : 'Guardar cotización' }}
        </button>
      </template>
    </ModalBase>

    <!-- Crear un proveedor sin salir de la cotización -->
    <ModalBase v-model="showNuevoProveedor" titulo="Nuevo proveedor" size="sm">
      <div class="space-y-3">
        <div>
          <label class="etiqueta">Razón social *</label>
          <input v-model="nuevoProveedor.razon_social" type="text" class="campo" />
        </div>
        <div>
          <label class="etiqueta">NIT *</label>
          <input v-model="nuevoProveedor.nit" type="text" class="campo" @keyup.enter="handleCrearProveedor" />
        </div>
      </div>
      <template #footer>
        <button type="button" @click="showNuevoProveedor = false" class="btn-secundario">Cancelar</button>
        <button type="button" @click="handleCrearProveedor" :disabled="loading || !nuevoProveedor.razon_social || !nuevoProveedor.nit" class="btn-primario">
          Agregar proveedor
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus, Receipt } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import authService from '../../services/auth.service';
import ModalBase from '../common/ModalBase.vue';
import EstadoVacio from '../common/EstadoVacio.vue';
import { formatMonto } from '../../utils/format';
import { errorMessage } from '../../utils/errors';
import { PERMISOS } from '../../utils/permisos';
import { confirmar, notificar } from '../../utils/alertas';

const props = defineProps({
  expediente: { type: Object, required: true },
});
const emit = defineEmits(['updated']);

const loading = ref(false);
const canManageCotizaciones = authService.hasPermission(PERMISOS.MANAGE_COTIZACIONES);
const cotizaciones = computed(() => props.expediente.cotizaciones || []);
const proveedores = ref([]);
const showNuevaCotizacion = ref(false);
const showNuevoProveedor = ref(false);

const cotizacionVacia = () => ({
  id_proveedor: '',
  monto_ofertado: null,
  plazo_entrega_dias: null,
  garantia_meses: null,
  cumple_especificaciones: false,
});
const nuevaCotizacion = ref(cotizacionVacia());
const nuevoProveedor = ref({ razon_social: '', nit: '' });

const loadProveedores = async () => {
  try {
    proveedores.value = await adquisicionesService.getProveedores();
  } catch (err) {
    console.error('No se pudieron cargar los proveedores', err);
  }
};

const handleAdjudicar = async (cot) => {
  const seguro = await confirmar({
    titulo: '¿Adjudicar esta cotización?',
    texto: `${cot.proveedor_nombre} por ${formatMonto(cot.monto_ofertado)}. El expediente pasará a la elaboración del CDP.`,
    confirmar: 'Sí, adjudicar',
  });
  if (!seguro) return;

  loading.value = true;
  try {
    const resultado = await adquisicionesService.adjudicarCotizacion(props.expediente.id_expediente, cot.id_cotizacion);
    notificar.exito('Cotización adjudicada');
    emit('updated', resultado);
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudo adjudicar la cotización.'));
  } finally {
    loading.value = false;
  }
};

const handleCrearProveedor = async () => {
  if (!nuevoProveedor.value.razon_social || !nuevoProveedor.value.nit) return;
  loading.value = true;
  try {
    const proveedor = await adquisicionesService.createProveedor(nuevoProveedor.value);
    await loadProveedores();
    nuevaCotizacion.value.id_proveedor = proveedor.id_proveedor;
    nuevoProveedor.value = { razon_social: '', nit: '' };
    showNuevoProveedor.value = false;
    notificar.exito('Proveedor agregado');
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudo crear el proveedor.'));
  } finally {
    loading.value = false;
  }
};

const handleRegistrarCotizacion = async () => {
  loading.value = true;
  try {
    const resultado = await adquisicionesService.registrarCotizacion(props.expediente.id_expediente, nuevaCotizacion.value);
    nuevaCotizacion.value = cotizacionVacia();
    showNuevaCotizacion.value = false;
    notificar.exito('Cotización registrada');
    emit('updated', resultado);
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudo registrar la cotización.'));
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
