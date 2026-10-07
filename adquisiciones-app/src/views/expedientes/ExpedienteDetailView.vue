<template>
  <Cargando v-if="loading && !expediente" mensaje="Cargando expediente..." />
  <div v-else-if="error && !expediente" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>

  <!-- Una sola tarjeta: arriba el proceso (siempre visible) y debajo, en pestañas, el trámite y el detalle -->
  <section v-else-if="expediente" class="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
    <ExpedienteHeader :expediente="expediente">
      <template #acciones>
        <AccionesExpediente :expediente="expediente" @updated="alActualizar" />
      </template>
    </ExpedienteHeader>

    <ProximoPaso :expediente="expediente" :ocupado="turnando" @turnar="handleTurnar" />

    <div class="px-4 md:px-6 pb-3">
      <ExpedienteStepper :steps="pasos" :estado="expediente.estado" :current="pasoActualKey" @select="elegirPaso" />
    </div>

    <PestanasBar v-model="pestana" :pestanas="pestanas" />

    <div class="p-4 md:p-6 min-h-[16rem] relative">
      <div v-if="loading" class="absolute inset-x-0 top-0 h-0.5 bg-accent/60 animate-pulse"></div>
      <div :key="pestana === 'tramite' ? `tramite-${pasoActual?.key}` : pestana" class="aparecer">
        <template v-if="pestana === 'tramite'">
          <component v-if="pasoActual" :is="componentesPorPaso[pasoActual.key]" :expediente="expediente" @updated="alActualizar" />
          <!-- Aún no hay un paso del trámite con acciones (p. ej. recién emitida): se indica qué sigue -->
          <EstadoVacio v-else :icono="esperaRecepcion ? Inbox : Hourglass" :titulo="vacio.titulo" :detalle="vacio.detalle">
            <button v-if="esperaRecepcion && puedeTurnar" type="button" @click="handleTurnar" :disabled="turnando" class="btn-primario mt-2">
              <Send class="w-4 h-4" /> Recibir y turnar
            </button>
          </EstadoVacio>
        </template>
        <ExpedienteResumen v-else-if="pestana === 'resumen'" :expediente="expediente" />
        <ExpedienteDocumentos v-else-if="pestana === 'documentos'" :expediente="expediente" />
        <LineaDeTiempoEstados v-else :historial="expediente.historial_estados" :ahora="expediente.servidor_ahora"
          :bitacora="bitacora" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Inbox, Hourglass, Send } from 'lucide-vue-next';
import adquisicionesService from '../../services/adquisiciones.service';
import ExpedienteHeader from '../../components/expediente/ExpedienteHeader.vue';
import ProximoPaso from '../../components/expediente/ProximoPaso.vue';
import ExpedienteResumen from '../../components/expediente/ExpedienteResumen.vue';
import ExpedienteDocumentos from '../../components/expediente/ExpedienteDocumentos.vue';
import LineaDeTiempoEstados from '../../components/expediente/LineaDeTiempoEstados.vue';
import ExpedienteStepper from '../../components/expediente/ExpedienteStepper.vue';
import AccionesExpediente from '../../components/expediente/AccionesExpediente.vue';
import PestanasBar from '../../components/common/PestanasBar.vue';
import Cargando from '../../components/common/Cargando.vue';
import EstadoVacio from '../../components/common/EstadoVacio.vue';
import CotizacionesCard from '../../components/tramite/CotizacionesCard.vue';
import CdpCard from '../../components/tramite/CdpCard.vue';
import OrdenCompraCard from '../../components/tramite/OrdenCompraCard.vue';
import RecepcionDocumentosCard from '../../components/tramite/RecepcionDocumentosCard.vue';
import FaseFinancieraCard from '../../components/tramite/FaseFinancieraCard.vue';
import { useCarruselPasos } from '../../composables/useCarruselPasos';
import { construirPasos } from '../../utils/pasos';
import { errorMessage } from '../../utils/errors';
import { confirmar, informar, notificar } from '../../utils/alertas';
import { PERMISOS } from '../../utils/permisos';
import authService from '../../services/auth.service';

const route = useRoute();
const router = useRouter();
const expediente = ref(null);
const bitacora = ref([]);
const loading = ref(true);
const error = ref('');
const turnando = ref(false);
// La bitácora detallada es de auditoría: quien no puede verla igual ve el historial de estados.
const puedeVerBitacora = authService.hasPermission(PERMISOS.AUDIT);

// --- Pestañas: el estado vive aquí para que sobreviva a que se recargue el expediente ---
const pestana = ref('tramite');
const pestanas = computed(() => [
  { clave: 'tramite', etiqueta: 'Trámite' },
  { clave: 'resumen', etiqueta: 'Resumen' },
  { clave: 'documentos', etiqueta: 'Documentos', conteo: 1 + (expediente.value?.documentos_soporte?.length || 0) },
  { clave: 'historial', etiqueta: 'Historial' },
]);

// --- Pasos del proceso: stepper + el paso elegido a todo el ancho ---
const componentesPorPaso = {
  cotizacion: CotizacionesCard,
  cdp: CdpCard,
  oc: OrdenCompraCard,
  recepcion: RecepcionDocumentosCard,
  financiera: FaseFinancieraCard,
};
const pasos = computed(() => construirPasos(expediente.value));
const { pasoActual, pasoActualKey, irAPaso, sincronizar } = useCarruselPasos(pasos);

/** Elegir una etapa en el stepper muestra su detalle en la pestaña Trámite. */
const elegirPaso = (clave) => {
  pestana.value = 'tramite';
  irAPaso(clave);
};

// Panel del trámite cuando todavía no hay un paso con acciones (la solicitud espera ser recibida, o está devuelta).
const esperaRecepcion = computed(() => expediente.value?.siguiente_paso?.accion === 'turnar');
const puedeTurnar = computed(() => esperaRecepcion.value && authService.hasPermission(expediente.value.siguiente_paso.permiso));
const vacio = computed(() => {
  const sp = expediente.value?.siguiente_paso;
  if (esperaRecepcion.value) {
    const responsable = expediente.value.responsable_actual_nombre;
    return {
      titulo: 'Solicitud pendiente de recepción',
      detalle: puedeTurnar.value
        ? 'Al recibirla, el sistema la asigna al analista con menos expedientes abiertos y pasa a la etapa de cotización.'
        : `Adquisiciones debe recibirla y turnarla a un analista${responsable ? ` (responsable: ${responsable})` : ''} para dar inicio a las cotizaciones.`,
    };
  }
  if (sp?.tipo === 'devuelto') return { titulo: 'Solicitud devuelta', detalle: 'Pendiente de que la unidad solicitante corrija las observaciones.' };
  return { titulo: 'Sin acciones pendientes', detalle: 'El expediente aún no llega a una etapa con acciones por realizar.' };
});

/**
 * El expediente ya no está al alcance de la persona: pasó a otro responsable (acaba de actuar sobre él) o no
 * le corresponde. Se le informa al centro de la pantalla y regresa a la bandeja con los demás expedientes.
 * `resultado` es la respuesta de la acción que acaba de hacer: dice a quién pasó.
 */
const salirDeLaBandeja = async (resultado) => {
  const acabaDeActuar = !!expediente.value;
  const codigo = expediente.value?.codigo_expediente || resultado?.codigo_expediente || '';
  const responsable = resultado?.responsable_actual_nombre;
  await informar({
    titulo: acabaDeActuar ? 'Expediente trasladado' : 'Expediente no disponible',
    texto: acabaDeActuar
      ? `El expediente ${codigo} fue trasladado ${responsable ? `a ${responsable}` : 'al siguiente responsable'} y ya no se encuentra en su bandeja.`
      : 'El expediente solicitado no se encuentra en su bandeja o no existe.',
    icono: acabaDeActuar ? 'success' : 'info',
  });
  router.push({ name: 'Dashboard' });
};

// Recarga sin vaciar la pantalla: el contenido anterior sigue visible mientras llega el nuevo. Devuelve si cargó.
const load = async (resultado) => {
  loading.value = true;
  error.value = '';
  try {
    const id = route.params.id;
    expediente.value = await adquisicionesService.getExpedienteById(id);
    bitacora.value = puedeVerBitacora ? await adquisicionesService.getBitacora(id).catch(() => []) : [];
    sincronizar();
    return true;
  } catch (err) {
    // 404: el expediente ya no le corresponde a esta persona (el API responde igual que si no existiera).
    if (err?.response?.status === 404) {
      await salirDeLaBandeja(resultado);
      return false;
    }
    console.error(err);
    error.value = 'No se pudo cargar el expediente.';
    if (expediente.value) notificar.error(error.value);
    return false;
  } finally {
    loading.value = false;
  }
};

/** Después de cada acción: se recarga y, si el expediente pasó a otra persona, se sale de él. */
const alActualizar = (resultado) => load(resultado);

// "Recibir y turnar": el sistema elige al analista y pasa el expediente a cotización.
const handleTurnar = async () => {
  const seguro = await confirmar({
    titulo: '¿Recibir y turnar la solicitud?',
    texto: 'El sistema la asignará al analista con menos expedientes abiertos y pasará a la etapa de cotización.',
    confirmar: 'Sí, turnar',
  });
  if (!seguro) return;
  turnando.value = true;
  try {
    const actualizado = await adquisicionesService.turnarExpediente(expediente.value.id_expediente);
    // Si el expediente sigue a su alcance (p. ej. administración), se confirma con un aviso; si no, ya se le informó.
    if (await load(actualizado)) {
      const quien = actualizado?.responsable_actual_nombre;
      notificar.exito(quien ? `Solicitud turnada a ${quien}` : 'Solicitud recibida y turnada');
    }
  } catch (err) {
    console.error(err);
    notificar.error(errorMessage(err, 'No se pudo turnar la solicitud.'));
  } finally {
    turnando.value = false;
  }
};

onMounted(() => load());
</script>
