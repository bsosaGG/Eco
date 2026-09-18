<template>
  <div v-if="loading" class="text-center text-gray-400 py-12">Cargando expediente...</div>
  <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

  <div v-else-if="expediente" class="space-y-6">
    <!-- Encabezado -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-wrap justify-between items-start gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h3 class="text-xl font-bold text-gray-800">{{ expediente.codigo_expediente }}</h3>
          <span class="px-2 py-1 rounded-full text-xs font-medium" :class="badgeClass(expediente.estado_color)">
            {{ expediente.estado }}
          </span>
        </div>
        <p class="text-gray-600">{{ expediente.objeto_compra }}</p>
        <p class="text-sm text-gray-400 mt-1">
          {{ expediente.unidad_solicitante }} &middot; Solicitado por {{ expediente.usuario_solicitante_nombre }}
        </p>
      </div>
      <div class="text-right text-sm text-gray-500">
        <p>Monto estimado</p>
        <p class="text-xl font-semibold text-gray-800">{{ formatMonto(expediente.monto_estimado) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Detalle -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Justificación</h4>
          <p class="text-gray-700 whitespace-pre-line">{{ expediente.justificacion }}</p>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Renglones Solicitados</h4>

          <!-- Vista de tabla (md en adelante) -->
          <table class="hidden md:table w-full text-sm">
            <thead class="text-gray-400 text-xs uppercase">
              <tr>
                <th class="text-left py-2 px-2">Descripción</th>
                <th class="text-right py-2 px-2">Cantidad</th>
                <th class="text-left py-2 px-2">Unidad</th>
                <th class="text-right py-2 px-2">Costo Unit.</th>
                <th class="text-right py-2 px-2">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in expediente.items || []" :key="item.id_item">
                <td class="py-2 px-2">{{ item.descripcion }}</td>
                <td class="py-2 px-2 text-right">{{ item.cantidad }}</td>
                <td class="py-2 px-2">{{ item.unidad_medida }}</td>
                <td class="py-2 px-2 text-right">{{ formatMonto(item.costo_unitario_estimado) }}</td>
                <td class="py-2 px-2 text-right font-medium">{{ formatMonto(item.subtotal_estimado) }}</td>
              </tr>
              <tr v-if="!expediente.items || expediente.items.length === 0">
                <td colspan="5" class="py-4 text-center text-gray-400">Sin renglones registrados.</td>
              </tr>
            </tbody>
          </table>

          <!-- Vista de tarjetas (mobile) -->
          <div class="md:hidden space-y-3">
            <div v-for="item in expediente.items || []" :key="item.id_item"
              class="border border-gray-200 rounded-lg p-3 text-sm">
              <p class="font-medium text-gray-800 mb-2">{{ item.descripcion }}</p>
              <div class="grid grid-cols-2 gap-y-1 text-gray-500">
                <span>Cantidad</span>
                <span class="text-right text-gray-800">{{ item.cantidad }} {{ item.unidad_medida }}</span>
                <span>Costo Unit.</span>
                <span class="text-right text-gray-800">{{ formatMonto(item.costo_unitario_estimado) }}</span>
                <span>Subtotal</span>
                <span class="text-right font-medium text-gray-800">{{ formatMonto(item.subtotal_estimado) }}</span>
              </div>
            </div>
            <p v-if="!expediente.items || expediente.items.length === 0" class="py-4 text-center text-gray-400">
              Sin renglones registrados.
            </p>
          </div>
        </div>

        <!-- Cotizaciones (CU-02) -->
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
                    :disabled="actionLoading" class="text-accent text-xs font-medium hover:underline disabled:opacity-50">
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
                :disabled="actionLoading" class="mt-2 w-full text-accent text-xs font-medium hover:underline disabled:opacity-50">
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
                <button type="button" @click="handleCrearProveedor" :disabled="actionLoading"
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

              <button @click="handleRegistrarCotizacion" :disabled="actionLoading || !nuevaCotizacion.id_proveedor || !nuevaCotizacion.monto_ofertado"
                class="w-full bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
                Guardar cotización
              </button>
            </div>
          </div>
        </div>

        <!-- Bitácora -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Bitácora de Trazabilidad</h4>
          <ol class="space-y-4">
            <li v-for="log in bitacora" :key="log.id_bitacora" class="flex gap-3">
              <div class="w-2 h-2 mt-2 rounded-full bg-accent flex-shrink-0"></div>
              <div>
                <p class="text-sm text-gray-800 font-medium">{{ log.accion }}</p>
                <p v-if="log.observacion" class="text-sm text-gray-500">{{ log.observacion }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ log.usuario_nombre }} &middot; {{ formatFechaHora(log.fecha_hora) }}</p>
              </div>
            </li>
            <li v-if="bitacora.length === 0" class="text-sm text-gray-400 italic">Sin movimientos registrados todavía.</li>
          </ol>
        </div>
      </div>

      <!-- Acciones -->
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Acciones</h4>

          <div v-if="actionError" class="bg-red-50 text-red-600 p-2 rounded text-xs mb-3">{{ actionError }}</div>
          <div v-if="actionSuccess" class="bg-green-50 text-green-600 p-2 rounded text-xs mb-3">{{ actionSuccess }}</div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Asignar a un funcionario</label>
              <div class="flex gap-2">
                <input v-model="asignacionInput" type="text" placeholder="Nombre del analista"
                  class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                <button @click="handleAsignar" :disabled="actionLoading"
                  class="bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-light disabled:opacity-50">
                  Asignar
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Cambiar estado</label>
              <div class="flex gap-2">
                <select v-model="estadoSeleccionado" class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm">
                  <option value="" disabled>Selecciona un estado</option>
                  <option v-for="e in estados" :key="e.value" :value="e.value">{{ e.text }}</option>
                </select>
                <button @click="handleCambiarEstado" :disabled="actionLoading || !estadoSeleccionado"
                  class="bg-accent text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 disabled:opacity-50">
                  Aplicar
                </button>
              </div>
            </div>

            <button @click="showDevolver = !showDevolver"
              class="text-sm text-red-500 hover:underline pt-2">
              Devolver con observaciones
            </button>
            <div v-if="showDevolver" class="space-y-2 pt-2 border-t border-gray-100">
              <input v-model="devolucion.etapa_origen" type="text" placeholder="Etapa (ej. Cotización)"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <input v-model="devolucion.motivo" type="text" placeholder="Motivo"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              <textarea v-model="devolucion.descripcion" rows="2" placeholder="Descripción / checklist a corregir"
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"></textarea>
              <button @click="handleDevolver" :disabled="actionLoading"
                class="w-full bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 disabled:opacity-50">
                Confirmar devolución
              </button>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700">
          Las pantallas de CDP, orden de compra, recepción y fase financiera todavía no están
          implementadas — la API responde 501 en esos endpoints. Este panel de acciones cubre por
          ahora la solicitud inicial, cotizaciones y los flujos transversales (bitácora y devolución).
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import adquisicionesService from '../services/adquisiciones.service';
import authService from '../services/auth.service';

const route = useRoute();
const expediente = ref(null);
const bitacora = ref([]);
const estados = ref([]);
const loading = ref(true);
const error = ref('');

const asignacionInput = ref('');
const estadoSeleccionado = ref('');
const showDevolver = ref(false);
const devolucion = ref({ etapa_origen: '', motivo: '', descripcion: '' });
const actionLoading = ref(false);
const actionError = ref('');
const actionSuccess = ref('');

const canManageCotizaciones = authService.hasPermission('adquisiciones:manage-cotizaciones');
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

const colorMap = {
  secondary: 'bg-gray-100 text-gray-600',
  primary: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-sky-100 text-sky-700',
  success: 'bg-green-100 text-green-700',
  danger: 'bg-red-100 text-red-700',
  dark: 'bg-slate-200 text-slate-700',
};
const badgeClass = (color) => colorMap[color] || colorMap.secondary;
const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);
const formatFechaHora = (f) => (f ? new Date(f).toLocaleString('es-GT') : '—');

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const id = route.params.id;
    expediente.value = await adquisicionesService.getExpedienteById(id);
    bitacora.value = await adquisicionesService.getBitacora(id);
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar el expediente.';
  } finally {
    loading.value = false;
  }
};

const loadProveedores = async () => {
  try {
    proveedores.value = await adquisicionesService.getProveedores();
  } catch (err) {
    console.error('No se pudieron cargar los proveedores', err);
  }
};

const runAction = async (fn) => {
  actionLoading.value = true;
  actionError.value = '';
  actionSuccess.value = '';
  try {
    await fn();
    actionSuccess.value = 'Acción aplicada correctamente.';
    await load();
  } catch (err) {
    console.error(err);
    actionError.value = err.response?.data?.message || 'No se pudo completar la acción.';
  } finally {
    actionLoading.value = false;
  }
};

const handleAsignar = () =>
  runAction(() => adquisicionesService.asignarExpediente(expediente.value.id_expediente, asignacionInput.value));

const handleCambiarEstado = () =>
  runAction(() =>
    adquisicionesService.cambiarEstado(expediente.value.id_expediente, estadoSeleccionado.value, 'Cambio manual desde el panel.')
  );

const handleDevolver = () =>
  runAction(() => adquisicionesService.devolverExpediente(expediente.value.id_expediente, devolucion.value));

const handleCrearProveedor = async () => {
  if (!nuevoProveedor.value.razon_social || !nuevoProveedor.value.nit) return;
  actionLoading.value = true;
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
    actionLoading.value = false;
  }
};

const handleRegistrarCotizacion = async () => {
  actionLoading.value = true;
  cotizacionError.value = '';
  actionSuccess.value = '';
  try {
    await adquisicionesService.registrarCotizacion(expediente.value.id_expediente, nuevaCotizacion.value);
    nuevaCotizacion.value = {
      id_proveedor: '',
      monto_ofertado: null,
      plazo_entrega_dias: null,
      garantia_meses: null,
      cumple_especificaciones: false,
    };
    showNuevaCotizacion.value = false;
    actionSuccess.value = 'Cotización registrada correctamente.';
    await load();
  } catch (err) {
    console.error(err);
    cotizacionError.value = err.response?.data?.message || 'No se pudo registrar la cotización.';
  } finally {
    actionLoading.value = false;
  }
};

const handleAdjudicar = (idCotizacion) =>
  runAction(() => adquisicionesService.adjudicarCotizacion(expediente.value.id_expediente, idCotizacion));

onMounted(async () => {
  await load();
  try {
    estados.value = await adquisicionesService.getEstados();
  } catch (err) {
    console.error('No se pudieron cargar los estados', err);
  }
  if (canManageCotizaciones) {
    await loadProveedores();
  }
});
</script>
