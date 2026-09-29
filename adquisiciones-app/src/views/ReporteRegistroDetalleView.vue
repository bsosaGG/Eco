<template>
  <div>
    <router-link :to="volverRuta" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-accent mb-6">
      <ArrowLeft class="w-4 h-4" /> Volver al listado
    </router-link>

    <div v-if="loading" class="text-center text-gray-400 py-12">Cargando...</div>
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{{ error }}</div>
    <div v-else-if="!registro" class="bg-amber-50 text-amber-700 p-4 rounded-lg text-sm border border-amber-100">
      No se encontró el registro solicitado.
    </div>

    <div v-else class="max-w-3xl">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{{ tipoLabel }}</p>
        <div class="flex items-center justify-between gap-3">
          <h1 class="text-xl font-semibold text-gray-800">{{ titulo }}</h1>
          <span v-if="registro.estado" class="px-3 py-1 rounded-full text-xs font-medium shrink-0" :class="estadoBadge">
            {{ registro.estado }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Datos del registro</p>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div v-for="campo in campos" :key="campo.label">
            <dt class="text-xs text-gray-400 mb-1">{{ campo.label }}</dt>
            <dd class="text-sm font-medium text-gray-800">{{ campo.value }}</dd>
          </div>
        </dl>
      </div>

      <div class="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Expediente de origen</p>
        <p class="text-sm font-medium text-gray-700">{{ registro.codigo_expediente }}</p>
        <p class="text-sm text-gray-500">{{ registro.objeto_compra }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import adquisicionesService from '../services/adquisiciones.service';

const route = useRoute();
const loading = ref(true);
const error = ref('');
const registro = ref(null);

const tipo = computed(() => route.params.tipo);

const tipoLabel = computed(() => ({
  cotizacion: 'Cotización',
  cdp: 'Certificado de Disponibilidad Presupuestaria',
  'orden-compra': 'Orden de Compra',
  compromiso: 'Compromiso Presupuestario',
  devengado: 'Devengado',
  'solicitud-pago': 'Solicitud de Pago',
}[tipo.value] || 'Registro'));

const volverRuta = computed(() => {
  if (tipo.value === 'cotizacion') return { name: 'ReporteCotizaciones' };
  if (tipo.value === 'cdp' || tipo.value === 'orden-compra') return { name: 'ReporteCdpOc' };
  return { name: 'ReporteFinanciera' };
});

const formatMonto = (m) => (m == null ? '—' : `Q ${Number(m).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`);
const formatFecha = (f) => (f ? new Date(f).toLocaleDateString('es-GT') : '—');

const titulo = computed(() => {
  if (!registro.value) return '';
  const r = registro.value;
  if (tipo.value === 'cotizacion') return r.proveedor_nombre;
  if (tipo.value === 'cdp') return r.numero_cdp || `CDP #${r.id_cdp}`;
  if (tipo.value === 'orden-compra') return r.numero_oc || `Orden #${r.id_orden_compra}`;
  if (tipo.value === 'compromiso') return r.numero_comp || `Compromiso #${r.id_compromiso}`;
  if (tipo.value === 'devengado') return r.numero_dev || `Devengado #${r.id_devengado}`;
  if (tipo.value === 'solicitud-pago') return r.entidad_bancaria || 'Solicitud de pago';
  return '';
});

const estadoBadge = computed(() => {
  const estado = registro.value?.estado;
  if (!estado) return '';
  const positivos = ['Aprobado', 'Emitida', 'Tramitado'];
  const intermedios = ['Aprobado Técnicamente', 'Aprobada Jefatura'];
  if (positivos.includes(estado)) return 'bg-green-100 text-green-700';
  if (intermedios.includes(estado)) return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
});

const campos = computed(() => {
  if (!registro.value) return [];
  const r = registro.value;
  if (tipo.value === 'cotizacion') {
    return [
      { label: 'Proveedor', value: r.proveedor_nombre },
      { label: 'NIT', value: r.proveedor_nit },
      { label: 'Monto ofertado', value: formatMonto(r.monto_ofertado) },
      { label: 'Plazo de entrega', value: r.plazo_entrega_dias != null ? `${r.plazo_entrega_dias} días` : '—' },
      { label: 'Garantía', value: r.garantia_meses != null ? `${r.garantia_meses} meses` : '—' },
      { label: 'Cumple especificaciones', value: r.cumple_especificaciones == null ? '—' : (r.cumple_especificaciones ? 'Sí' : 'No') },
      { label: 'Adjudicada', value: r.es_adjudicada ? 'Sí' : 'No' },
      { label: 'Registrada', value: formatFecha(r.fecha_registro) },
    ];
  }
  if (tipo.value === 'cdp') {
    return [
      { label: 'Número de CDP', value: r.numero_cdp || '—' },
      { label: 'Monto reservado', value: formatMonto(r.monto_reservado) },
      { label: 'Estado', value: r.estado },
      { label: 'Elaborado', value: formatFecha(r.fecha_elaboracion) },
      { label: 'Aprobación presupuesto', value: formatFecha(r.fecha_aprobacion_presupuesto) },
      { label: 'Visto bueno UDAF', value: formatFecha(r.fecha_vobo_udaf) },
    ];
  }
  if (tipo.value === 'orden-compra') {
    return [
      { label: 'Número de Orden', value: r.numero_oc || '—' },
      { label: 'Proveedor', value: r.proveedor_nombre },
      { label: 'Monto total', value: formatMonto(r.monto_total) },
      { label: 'Estado', value: r.estado },
      { label: 'Plazo de entrega', value: r.plazo_entrega || '—' },
      { label: 'Lugar de entrega', value: r.lugar_entrega || '—' },
      { label: 'Notificada al proveedor', value: formatFecha(r.fecha_notificacion_proveedor) },
    ];
  }
  if (tipo.value === 'compromiso') {
    return [
      { label: 'Número de compromiso', value: r.numero_comp || '—' },
      { label: 'Monto comprometido', value: formatMonto(r.monto_comprometido) },
      { label: 'Estado', value: r.estado },
      { label: 'Registrado', value: formatFecha(r.fecha_registro) },
    ];
  }
  if (tipo.value === 'devengado') {
    return [
      { label: 'Número de devengado', value: r.numero_dev || '—' },
      { label: 'Compromiso relacionado', value: r.numero_comp || '—' },
      { label: 'Monto devengado', value: formatMonto(r.monto_devengado) },
      { label: 'Retención ISR', value: formatMonto(r.retencion_isr) },
      { label: 'Estado', value: r.estado },
      { label: 'Registrado', value: formatFecha(r.fecha_registro) },
    ];
  }
  if (tipo.value === 'solicitud-pago') {
    return [
      { label: 'Entidad bancaria', value: r.entidad_bancaria || '—' },
      { label: 'Tipo de cuenta', value: r.tipo_cuenta || '—' },
      { label: 'Número de cuenta', value: r.numero_cuenta || '—' },
      { label: 'No. transferencia / cheque', value: r.numero_transferencia_cheque || '—' },
      { label: 'Monto', value: formatMonto(r.monto_devengado) },
      { label: 'Estado', value: r.estado },
      { label: 'Solicitada', value: formatFecha(r.fecha_solicitud) },
      { label: 'Tramitada', value: formatFecha(r.fecha_tramite) },
      { label: 'Archivada', value: formatFecha(r.fecha_archivo) },
    ];
  }
  return [];
});

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const id = route.params.id;
    if (tipo.value === 'cotizacion') {
      const lista = await adquisicionesService.getReporteCotizaciones();
      registro.value = lista.find((x) => String(x.id_cotizacion) === String(id)) || null;
    } else if (tipo.value === 'cdp') {
      const lista = await adquisicionesService.getReporteCdp();
      registro.value = lista.find((x) => String(x.id_cdp) === String(id)) || null;
    } else if (tipo.value === 'orden-compra') {
      const lista = await adquisicionesService.getReporteOrdenesCompra();
      registro.value = lista.find((x) => String(x.id_orden_compra) === String(id)) || null;
    } else {
      const data = await adquisicionesService.getReporteFinanciera();
      if (tipo.value === 'compromiso') {
        registro.value = data.compromisos.find((x) => String(x.id_compromiso) === String(id)) || null;
      } else if (tipo.value === 'devengado') {
        registro.value = data.devengados.find((x) => String(x.id_devengado) === String(id)) || null;
      } else if (tipo.value === 'solicitud-pago') {
        registro.value = data.solicitudes_pago.find((x) => String(x.id_solicitud_pago) === String(id)) || null;
      }
    }
  } catch (err) {
    console.error(err);
    error.value = 'No se pudo cargar la información del registro.';
  } finally {
    loading.value = false;
  }
});
</script>
