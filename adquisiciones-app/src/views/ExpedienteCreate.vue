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

        <!-- Items (SCR-02) -->
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
            <div v-for="(item, idx) in form.items" :key="idx"
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
            <p v-if="form.items.length === 0" class="text-sm text-gray-400 italic">Sin renglones agregados todavía.</p>
            <p v-else class="text-xs text-gray-400 italic">
              Las sugerencias vienen del catálogo público de insumos MAGA/SIGES (nomenclatura, presentación y código de insumo) — solo para estandarizar la descripción. El precio se define después, con las cotizaciones.
            </p>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Trash2 } from 'lucide-vue-next';
import adquisicionesService from '../services/adquisiciones.service';
import SearchableSelect from '../components/adquisiciones/SearchableSelect.vue';

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
const opcionesRenglones = computed(() =>
  renglones.value.map((r) => ({ value: r.value, label: `${r.numero_renglon} — ${r.text}` }))
);

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

const addItem = () => {
  form.value.items.push({
    descripcion: '',
    cantidad: 1,
    unidad_medida: '',
    codigo_insumo: '',
    id_renglon: '',
    // El precio no se captura en esta pantalla (ver nota en el template) — se
    // manda en 0 al backend, que lo actualiza más adelante con la cotización
    // adjudicada (CU-02).
    _sugerencias: [],
    _mostrarSugerencias: false,
    _buscando: false,
    _errorBusqueda: false,
  });
};
const removeItem = (idx) => form.value.items.splice(idx, 1);

// Autocompletado contra el catálogo público de insumos MAGA/SIGES (sin precio,
// solo para estandarizar descripción/unidad). Con debounce para no golpear el
// endpoint en cada tecla, y tolerante a fallas: si el servicio no responde, el
// formulario sigue funcionando igual con captura 100% manual.
let debounceTimer = null;
const buscarSugerencias = (idx, texto) => {
  const item = form.value.items[idx];
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
  const item = form.value.items[idx];
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
    const coincidencia = renglones.value.find(
      (r) => String(r.numero_renglon) === String(sugerencia.renglon)
    );
    if (coincidencia) item.id_renglon = coincidencia.value;
  }
  item._sugerencias = [];
  item._mostrarSugerencias = false;
};
const ocultarSugerencias = (idx) => {
  // Pequeño delay para que el @mousedown.prevent del click en la sugerencia
  // (que se dispara antes del blur) alcance a registrarse.
  setTimeout(() => {
    const item = form.value.items[idx];
    if (item) item._mostrarSugerencias = false;
  }, 150);
};

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
  addItem();
});
</script>
