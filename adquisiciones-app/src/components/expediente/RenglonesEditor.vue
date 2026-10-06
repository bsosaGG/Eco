<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <label class="block text-sm font-medium text-gray-700">Renglones Solicitados</label>
      <button type="button" @click="addItem" class="text-sm text-accent font-medium hover:underline flex items-center gap-1">
        <Plus class="w-4 h-4" /> Agregar renglón
      </button>
    </div>

    <!-- El precio NO se captura en esta pantalla: en esta etapa (CU-01, la
         solicitud inicial) todavía no hay proveedor ni cotización, así que no hay
         un precio real que capturar. El precio llega después, con las cotizaciones
         (CU-02) — aquí solo se estandariza qué se pide, cuánto y en qué unidad. -->
    <div class="space-y-3">
      <div v-for="(item, idx) in modelValue" :key="idx"
        class="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
        <div class="flex items-start gap-2">
          <div class="relative flex-1">
            <textarea v-model="item.descripcion" placeholder="Descripción"
              autocomplete="off" required rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              @input="buscarSugerencias(idx, $event.target.value)"
              @focus="item._mostrarSugerencias = item._sugerencias && item._sugerencias.length > 0"
              @blur="ocultarSugerencias(idx)"></textarea>
            <ul v-if="item._mostrarSugerencias && item._sugerencias && item._sugerencias.length"
              class="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
              <li v-for="(sug, sIdx) in item._sugerencias" :key="sIdx"
                class="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                @mousedown.prevent="elegirSugerencia(idx, sug)">
                <div class="flex items-start justify-between gap-2">
                  <p class="font-medium text-gray-800">{{ sug.insumo }}</p>
                  <span v-if="sug.codigo_insumo" class="text-[11px] text-gray-500 whitespace-nowrap shrink-0">Cód. insumo <strong class="font-bold text-gray-900">{{ sug.codigo_insumo }}</strong></span>
                </div>
                <p v-if="sug.caracteristicas" class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ sug.caracteristicas }}</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ sug.presentacion }} · {{ sug.cantidad_y_unidad }}
                  <span v-if="sug.codigo_presentacion"> · Cód. presentación {{ sug.codigo_presentacion }}</span>
                  <span v-if="sug.renglon"> · Renglón {{ sug.renglon }}</span>
                </p>
              </li>
            </ul>
            <p v-if="item._buscando" class="absolute mt-1 text-xs text-gray-400 px-1">Buscando en catálogo MAGA/SIGES…</p>
            <p v-if="item._errorBusqueda" class="absolute mt-1 text-xs text-amber-600 px-1">No se pudo conectar con el catálogo MAGA/SIGES — puedes llenar los campos manualmente.</p>
          </div>
          <button type="button" @click="removeItem(idx)" class="text-red-400 hover:text-red-600 p-2">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input v-model.number="item.cantidad" type="number" min="0" step="0.01" placeholder="Cantidad" required
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input v-model="item.unidad_medida" type="text" placeholder="Unidad" required
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input v-model="item.codigo_insumo" type="text" placeholder="Código de Insumo"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <SearchableSelect v-model="item.id_renglon" :options="opcionesRenglones"
            placeholder="Renglón presupuestario" />
        </div>
      </div>
      <p v-if="modelValue.length === 0" class="text-sm text-gray-400 italic">Sin renglones agregados todavía.</p>
      <p v-else class="text-xs text-gray-400 italic">
        Las sugerencias vienen del catálogo público de insumos MAGA/SIGES (nomenclatura, presentación y código de insumo) — solo para estandarizar la descripción. El precio se define después, con las cotizaciones.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Plus, Trash2 } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import SearchableSelect from '../common/SearchableSelect.vue';
import { nuevoRenglon } from '../../utils/renglones';

// Lista de renglones de la Solicitud de Compra (v-model). Cada renglón se llena a mano o con
// ayuda del catálogo público de insumos MAGA/SIGES (solo estandariza descripción y unidad).
const props = defineProps({
  modelValue: { type: Array, required: true },
  // Catálogo interno de renglones presupuestarios (opciones del selector y para preseleccionar uno
  // cuando el renglón que devuelve MAGA coincide).
  renglones: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue']);

const opcionesRenglones = computed(() =>
  props.renglones.map((r) => ({ value: r.value, label: `${r.numero_renglon} — ${r.text}` }))
);

const addItem = () => emit('update:modelValue', [...props.modelValue, nuevoRenglon()]);
const removeItem = (idx) => emit('update:modelValue', props.modelValue.filter((_, i) => i !== idx));

// Autocompletado contra el catálogo público de insumos MAGA/SIGES (sin precio,
// solo para estandarizar descripción/unidad). Con debounce para no golpear el
// endpoint en cada tecla, y tolerante a fallas: si el servicio no responde, el
// formulario sigue funcionando igual con captura 100% manual.
let debounceTimer = null;
const buscarSugerencias = (idx, texto) => {
  const item = props.modelValue[idx];
  if (!item) return;
  item.descripcion = texto;
  clearTimeout(debounceTimer);
  if (!texto || texto.trim().length < 3) {
    item._sugerencias = [];
    item._mostrarSugerencias = false;
    return;
  }
  debounceTimer = setTimeout(async () => {
    item._buscando = true;
    item._errorBusqueda = false;
    try {
      const resultados = await adquisicionesService.buscarInsumosMaga(texto.trim());
      item._sugerencias = resultados || [];
      item._mostrarSugerencias = item._sugerencias.length > 0;
    } catch (err) {
      // El catálogo MAGA/SIGES es opcional: si el servicio no responde, se avisa y
      // se sigue capturando todo a mano (descripción, cantidad, unidad, código de
      // insumo y renglón son campos normales, nunca dependen de este servicio).
      console.error('No se pudo consultar el catálogo MAGA/SIGES', err);
      item._sugerencias = [];
      item._mostrarSugerencias = false;
      item._errorBusqueda = true;
    } finally {
      item._buscando = false;
    }
  }, 400);
};
const elegirSugerencia = (idx, sugerencia) => {
  const item = props.modelValue[idx];
  if (!item) return;
  // Descripción: "<nombre del insumo>: <características>" que trae MAGA (si las
  // trae), tal como se pide para que la Descripción del formulario quede completa
  // sin que el usuario tenga que redactarla desde cero. El PDF pone en negrita todo
  // lo que va antes de los dos puntos (el nombre del insumo).
  item.descripcion = sugerencia.caracteristicas
    ? `${sugerencia.insumo}: ${sugerencia.caracteristicas}`
    : sugerencia.insumo;
  if (sugerencia.cantidad) item.cantidad = sugerencia.cantidad;
  if (sugerencia.unidad_medida) item.unidad_medida = sugerencia.unidad_medida;
  if (sugerencia.codigo_insumo) item.codigo_insumo = sugerencia.codigo_insumo;
  // El "renglón" que devuelve MAGA es su propia numeración (no necesariamente la
  // misma que nuestro catálogo interno de renglones_presupuestarios) — solo se usa
  // para pre-seleccionar si el número coincide con uno de nuestro catálogo; si no
  // coincide, el usuario elige el renglón manualmente en el dropdown.
  if (sugerencia.renglon) {
    const coincidencia = props.renglones.find((r) => String(r.numero_renglon) === String(sugerencia.renglon));
    if (coincidencia) item.id_renglon = coincidencia.value;
  }
  item._sugerencias = [];
  item._mostrarSugerencias = false;
};
const ocultarSugerencias = (idx) => {
  // Pequeño delay para que el @mousedown.prevent del click en la sugerencia
  // (que se dispara antes del blur) alcance a registrarse.
  setTimeout(() => {
    const item = props.modelValue[idx];
    if (item) item._mostrarSugerencias = false;
  }, 150);
};
</script>
