<template>
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
      <div class="flex items-start justify-between gap-4 mb-1">
        <h3 class="text-lg font-semibold text-gray-800">Solicitud de Compra</h3>
        <span class="text-xs font-mono text-gray-400 whitespace-nowrap mt-0.5">{{ CODIGO_FORMULARIO }}</span>
      </div>
      <p class="text-sm text-gray-500 mb-6">Modalidad: Baja Cuantía. Los campos marcados con * son obligatorios.</p>

      <PasosWizard v-model="paso" :pasos="PASOS" class="mb-8" />

      <form @submit.prevent="alEnviarFormulario" novalidate>
        <div :key="paso" class="aparecer space-y-5 min-h-[260px]">
          <!-- 1. Quién solicita -->
          <template v-if="paso === 0">
            <div>
              <h4 class="titulo-paso">¿Quién solicita?</h4>
              <p class="ayuda-paso">La primera firma siempre es de quien envía la solicitud.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="etiqueta">Unidad solicitante *</label>
                <select v-model="form.id_unidad_solicitante" class="campo" :class="{ 'campo-error': intento && !form.id_unidad_solicitante }">
                  <option value="" disabled>Seleccione una unidad</option>
                  <option v-for="u in unidades" :key="u.value" :value="u.value">{{ u.text }}</option>
                </select>
              </div>
              <div>
                <label class="etiqueta">Funcionario responsable</label>
                <input v-model="form.funcionario_responsable" type="text" class="campo" placeholder="Nombre del funcionario" />
              </div>
              <div class="md:col-span-2">
                <label class="etiqueta">Segunda firma</label>
                <select v-model="form.firma2_usuario_id" class="campo">
                  <option value="">Seleccione un firmante</option>
                  <option v-for="u in usuariosModulo" :key="u.id_usuario" :value="u.id_usuario">
                    {{ u.nombre_completo }} ({{ u.email }})
                  </option>
                </select>
                <p class="text-xs text-gray-400 mt-1">Puede ser cualquier usuario del módulo: no siempre es el/la jefe de la unidad.</p>
              </div>
            </div>
          </template>

          <!-- 2. Qué se compra -->
          <template v-else-if="paso === 1">
            <div>
              <h4 class="titulo-paso">¿Qué se necesita y por qué?</h4>
              <p class="ayuda-paso">Describa el objeto de la compra y el motivo.</p>
            </div>
            <div>
              <label class="etiqueta">Tipo de compra *</label>
              <div class="flex flex-wrap gap-3">
                <label v-for="opcion in TIPOS_COMPRA" :key="opcion"
                  class="flex items-center gap-2 text-sm px-3 py-2 border rounded-lg cursor-pointer transition-colors"
                  :class="form.tipo_compra === opcion ? 'bg-accent/10 border-accent text-accent-dark' : (intento && !form.tipo_compra ? 'border-red-300 text-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50')">
                  <input type="radio" name="tipo_compra" :value="opcion" v-model="form.tipo_compra" class="accent-accent" />
                  {{ opcion }}
                </label>
              </div>
            </div>
            <div>
              <label class="etiqueta">Objeto de la compra *</label>
              <input v-model="form.objeto_compra" type="text" class="campo" :class="{ 'campo-error': intento && !form.objeto_compra.trim() }"
                placeholder="Ej. Mantenimiento preventivo de equipo de cómputo" />
            </div>
            <div>
              <label class="etiqueta">Justificación *</label>
              <textarea v-model="form.justificacion" rows="4" class="campo" :class="{ 'campo-error': intento && !form.justificacion.trim() }"
                placeholder="Motivo de la necesidad de la compra"></textarea>
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <span class="text-sm font-medium text-gray-700">¿Lleva anexo (características técnicas / especificaciones especiales)?</span>
                <div class="flex gap-2">
                  <button type="button" @click="form.tiene_anexo = true" class="px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
                    :class="form.tiene_anexo ? 'bg-primary text-white border-primary' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">Sí</button>
                  <button type="button" @click="form.tiene_anexo = false" class="px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
                    :class="!form.tiene_anexo ? 'bg-primary text-white border-primary' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">No</button>
                </div>
              </div>
              <div v-if="form.tiene_anexo" class="aparecer space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label class="etiqueta">Características técnicas</label>
                  <textarea v-model="form.anexo_caracteristicas_tecnicas" rows="4" class="campo" placeholder="1. ...&#10;2. ...&#10;3. ..."></textarea>
                  <p class="text-xs text-gray-400 mt-1">Una característica por línea (se numeran igual que en el formulario impreso).</p>
                </div>
                <div>
                  <label class="etiqueta">Especificaciones especiales</label>
                  <textarea v-model="form.anexo_especificaciones_especiales" rows="4" class="campo" placeholder="Una especificación por línea"></textarea>
                </div>
              </div>
            </div>
          </template>

          <!-- 3. Renglones -->
          <template v-else-if="paso === 2">
            <div>
              <h4 class="titulo-paso">¿Qué renglones se solicitan?</h4>
              <p class="ayuda-paso">Agregue cada bien o servicio con su cantidad y unidad. El precio se incorpora posteriormente con la cotización.</p>
            </div>
            <RenglonesEditor v-model="form.items" :renglones="renglones" />
          </template>

          <!-- 4. Revisión -->
          <template v-else>
            <div>
              <h4 class="titulo-paso">Revisión de la solicitud</h4>
              <p class="ayuda-paso">De ser necesario, regrese al paso correspondiente para corregir. Al enviarla, la solicitud se traslada a Adquisiciones.</p>
            </div>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt class="etiqueta">Unidad solicitante</dt>
                <dd class="text-gray-800">{{ nombreUnidad || '—' }}</dd>
              </div>
              <div>
                <dt class="etiqueta">Tipo de compra</dt>
                <dd class="text-gray-800">{{ form.tipo_compra || '—' }}</dd>
              </div>
              <div>
                <dt class="etiqueta">Funcionario responsable</dt>
                <dd class="text-gray-800">{{ form.funcionario_responsable || '—' }}</dd>
              </div>
              <div>
                <dt class="etiqueta">Segunda firma</dt>
                <dd class="text-gray-800">{{ nombreSegundaFirma || '—' }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="etiqueta">Objeto de la compra</dt>
                <dd class="text-gray-800">{{ form.objeto_compra }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="etiqueta">Justificación</dt>
                <dd class="text-gray-800 whitespace-pre-line">{{ form.justificacion }}</dd>
              </div>
              <div v-if="form.tiene_anexo" class="sm:col-span-2">
                <dt class="etiqueta">Anexo</dt>
                <dd class="text-gray-500">Incluye características técnicas y/o especificaciones especiales.</dd>
              </div>
            </dl>

            <div>
              <h5 class="etiqueta">Renglones ({{ form.items.length }})</h5>
              <ul class="divide-y divide-gray-100 border border-gray-100 rounded-lg text-sm">
                <li v-for="(item, i) in form.items" :key="i" class="flex items-start justify-between gap-3 px-3 py-2">
                  <span class="text-gray-800">{{ item.descripcion }}</span>
                  <span class="text-gray-500 whitespace-nowrap">{{ item.cantidad }} {{ item.unidad_medida }}</span>
                </li>
              </ul>
            </div>
          </template>
        </div>

        <p v-if="intento && mensajePaso" class="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ mensajePaso }}</p>

        <div class="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-gray-100">
          <button type="button" @click="paso === 0 ? $router.back() : anterior()" class="btn-secundario">
            <ArrowLeft class="w-4 h-4" /> {{ paso === 0 ? 'Cancelar' : 'Anterior' }}
          </button>
          <button v-if="!esUltimo" type="button" @click="siguiente" class="btn-primario">
            Siguiente <ArrowRight class="w-4 h-4" />
          </button>
          <button v-else type="submit" :disabled="submitting" class="btn-acento">
            <Send class="w-4 h-4" /> {{ submitting ? 'Enviando...' : 'Enviar solicitud' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight, Send } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import RenglonesEditor from '../../components/expediente/RenglonesEditor.vue';
import PasosWizard from '../../components/common/PasosWizard.vue';
import { errorMessage } from '../../utils/errors';
import { nuevoRenglon } from '../../utils/renglones';
import { confirmar, conCarga, notificar } from '../../utils/alertas';

const router = useRouter();
const unidades = ref([]);
const renglones = ref([]);
const submitting = ref(false);

// FOR-DG-UA-00-01: código de formulario oficial, se manda en cada solicitud (el backend
// también lo guarda por su cuenta, con el mismo valor por defecto).
const CODIGO_FORMULARIO = 'FOR-DG-UA-00-01';
const TIPOS_COMPRA = ['Suministros', 'Equipo', 'Materiales', 'Servicios'];
const PASOS = [
  { clave: 'solicitante', etiqueta: 'Solicitante' },
  { clave: 'compra', etiqueta: 'La compra' },
  { clave: 'renglones', etiqueta: 'Renglones' },
  { clave: 'revision', etiqueta: 'Revisión' },
];
const ULTIMO = PASOS.length - 1;

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

// --- Pasos y validación: cada paso se valida antes de avanzar ---
const paso = ref(0);
const intento = ref(false); // true tras intentar avanzar con el paso incompleto: muestra qué falta
const esUltimo = computed(() => paso.value === ULTIMO);

const renglonCompleto = (i) => i.descripcion?.trim() && Number(i.cantidad) > 0 && i.unidad_medida?.trim();

/** Qué falta del paso `n` (cadena vacía si está completo). */
const faltaEnPaso = (n) => {
  const f = form.value;
  if (n === 0) return f.id_unidad_solicitante ? '' : 'Seleccione la unidad solicitante.';
  if (n === 1) {
    if (!f.tipo_compra) return 'Seleccione el tipo de compra.';
    if (!f.objeto_compra.trim()) return 'Indique el objeto de la compra.';
    if (!f.justificacion.trim()) return 'Indique la justificación.';
    return '';
  }
  if (n === 2) {
    if (!f.items.length) return 'Agregue al menos un renglón.';
    if (!f.items.every(renglonCompleto)) return 'Cada renglón necesita descripción, cantidad mayor a 0 y unidad.';
    return '';
  }
  return '';
};
const mensajePaso = computed(() => faltaEnPaso(paso.value));

const siguiente = () => {
  intento.value = true;
  if (mensajePaso.value) return;
  intento.value = false;
  paso.value += 1;
};
const anterior = () => {
  intento.value = false;
  paso.value -= 1;
};
// Enter dentro de un campo avanza de paso; solo el último paso envía.
const alEnviarFormulario = () => (esUltimo.value ? handleSubmit() : siguiente());

const nombreUnidad = computed(() => unidades.value.find((u) => u.value === form.value.id_unidad_solicitante)?.text || '');
const nombreSegundaFirma = computed(() => {
  const u = usuariosModulo.value.find((x) => x.id_usuario === form.value.firma2_usuario_id);
  return u ? `${u.nombre_completo} (${u.email})` : '';
});

const handleSubmit = async () => {
  // Por si se llega al final con algo incompleto (p. ej. se borró un renglón): vuelve al paso que falta.
  for (let n = 0; n < ULTIMO; n += 1) {
    const falta = faltaEnPaso(n);
    if (falta) {
      paso.value = n;
      intento.value = true;
      notificar.aviso(falta);
      return;
    }
  }

  const seguro = await confirmar({
    titulo: '¿Enviar la solicitud?',
    texto: 'Se trasladará a Adquisiciones y se notificará al solicitante cada cambio de etapa.',
    confirmar: 'Sí, enviar',
  });
  if (!seguro) return;

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
    const expediente = await conCarga('Enviando la solicitud...', () => adquisicionesService.crearExpediente(payload));
    notificar.exito(`Solicitud ${expediente.codigo_expediente} enviada`);
    router.push({ name: 'ExpedienteDetail', params: { id: expediente.id_expediente } });
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudo crear el expediente.'));
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
    usuariosModulo.value = await adquisicionesService.getUsuariosParaFirma();
  } catch (err) {
    console.error('No se pudieron cargar los usuarios del módulo', err);
  }
  form.value.items.push(nuevoRenglon());
});
</script>

<style scoped>
.titulo-paso {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}
.ayuda-paso {
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.125rem;
}
</style>
