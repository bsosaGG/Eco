<template>
  <div v-if="loading" class="flex items-center justify-center h-64">
    <div class="text-gray-500">Cargando información del caso...</div>
  </div>
  
  <div v-else-if="juicio" class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-start">
        <div>
            <div class="flex items-center space-x-3 mb-2">
                <h1 class="text-2xl font-bold text-gray-800">{{ juicio.numero_proceso }}</h1>
                <span :class="['px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(juicio.estado_procesal)]">
                    {{ juicio.estado_procesal }}
                </span>
            </div>
            <p class="text-gray-500 flex items-center gap-2">
                <Building2 class="w-4 h-4" /> {{ juicio.organo_jurisdiccional }}
            </p>
            <div class="mt-4 grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                <div>
                    <span class="text-gray-500 block">Demandante</span>
                    <span class="font-medium text-gray-800">{{ juicio.demandante_nombre || juicio.demandante_id }}</span>
                    <span v-if="juicio.demandante_identificacion" class="text-gray-400 text-xs block">{{ juicio.demandante_tipo_id }}: {{ juicio.demandante_identificacion }}</span>
                </div>
                <div>
                     <span class="text-gray-500 block">Oficial</span>
                    <span class="font-medium text-gray-800">{{ juicio.oficial }}</span>
                </div>
                 <div>
                     <span class="text-gray-500 block">Juez</span>
                    <span class="font-medium text-gray-800">{{ juicio.juez }}</span>
                </div>
                <div>
                     <span class="text-gray-500 block">Actitud Procesal</span>
                    <span class="font-medium text-gray-800">{{ juicio.actitud_procesal }}</span>
                </div>
            </div>
        </div>
        
        <div class="flex flex-col space-y-2">
            <button @click="exportDoc" class="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2">
                <FileDown class="w-4 h-4" /> Ficha Técnica
            </button>
             <button class="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Edit class="w-4 h-4" /> Editar Caso
            </button>
        </div>
    </div>

    <!-- Financials & Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <span class="text-gray-500 text-sm">Monto Liquidación</span>
            <p class="text-2xl font-bold text-gray-800 mt-1">Q{{ formatMoney(juicio.monto_liquidacion) }}</p>
        </div>
         <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <span class="text-gray-500 text-sm">Monto RRHH</span>
            <p class="text-2xl font-bold text-gray-800 mt-1">Q{{ formatMoney(juicio.monto_rrhh) }}</p>
        </div>
         <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <span class="text-gray-500 text-sm">Contingencia Estimada</span>
            <p class="text-2xl font-bold text-gray-800 mt-1">Q{{ formatMoney(juicio.monto_estimado) }}</p>
        </div>
    </div>

    <!-- Timeline / History -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="font-semibold text-gray-800">Historial Procesal</h3>
            <button class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Agregar Evento</button>
        </div>
        <div class="p-6">
            <div class="relative border-l-2 border-gray-200 ml-3 space-y-8">
                <div v-for="(evento, idx) in historial" :key="evento.id" class="relative pl-8">
                    <span 
                        class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white"
                        :class="idx === 0 ? 'bg-blue-500' : 'bg-gray-300'"
                    ></span>
                    <div>
                        <span class="text-xs text-gray-500 font-medium">{{ formatDate(evento.fecha_interposicion) }}</span>
                        <h4 class="text-sm font-bold text-gray-800">{{ evento.tipo_evento }}</h4>
                        <p class="text-sm text-gray-600 mt-1">{{ evento.descripcion }}</p>
                        <div v-if="evento.ruta_archivo_adjunto" class="mt-2 text-xs text-blue-500 hover:underline cursor-pointer flex items-center gap-1">
                            <Paperclip class="w-3 h-3" /> Ver Adjunto
                        </div>
                    </div>
                </div>
                <div v-if="historial.length === 0" class="pl-8 text-sm text-gray-500 italic">
                    No hay eventos registrados.
                </div>
            </div>
        </div>
    </div>
  </div>
  
  <div v-else class="text-center py-10">
      <p class="text-gray-500">No se encontró el caso.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Building2, FileDown, Edit, Paperclip } from 'lucide-vue-next';
import juridicaService from '../services/juridica.service';

const route = useRoute();
const loading = ref(true);
const juicio = ref(null);
const historial = ref([]);

const loadCase = async () => {
    loading.value = true;
    try {
        const id = route.params.id;
        const response = await juridicaService.getJuicioAndHistory(id);
        juicio.value = response.data;
        historial.value = response.data.historial || [];
    } catch (error) {
        console.error("Error loading case:", error);
    } finally {
        loading.value = false;
    }
};

const exportDoc = async () => {
    try {
        const response = await juridicaService.exportDocx(juicio.value.id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Ficha_${juicio.value.numero_proceso}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error exporting doc:", error);
        alert("Error al exportar documento");
    }
};

const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 });
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getStatusColor = (status) => {
    switch (status) {
        case 'En Trámite': return 'bg-yellow-100 text-yellow-800';
        case 'Sentencia': return 'bg-red-100 text-red-800';
        case 'Favorable': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

onMounted(() => {
    loadCase();
});
</script>
