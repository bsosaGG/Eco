<template>
    <div class="max-w-5xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800">{{ isEditing ? `Editar Caso: ${form.correlativo || ''}` :
                'Nuevo Juicio' }}</h1>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <!-- Tabs Header -->
            <div class="flex border-b border-gray-200 bg-gray-50">
                <button @click="activeTab = 'general'"
                    :class="['px-6 py-4 text-sm font-medium focus:outline-none transition-colors duration-200', activeTab === 'general' ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white']">
                    1. Datos Generales
                </button>
                <button @click="activeTab = 'narrativa'"
                    :class="['px-6 py-4 text-sm font-medium focus:outline-none transition-colors duration-200', activeTab === 'narrativa' ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white']">
                    2. Narrativa del Caso
                </button>
                <button @click="activeTab = 'estado'"
                    :class="['px-6 py-4 text-sm font-medium focus:outline-none transition-colors duration-200', activeTab === 'estado' ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white']">
                    3. Estado Actual & Finanzas
                </button>
            </div>

            <form @submit.prevent="handleSubmit" class="p-8">

                <!-- Tab 1: General -->
                <div v-show="activeTab === 'general'" class="space-y-6">
                    <!-- Estado Procesal -->
                    <div v-if="isEditing">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Estado Actual</label>
                        <select v-model="form.estado_procesal"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                            <option>En Trámite</option>
                            <option>Sentencia</option>
                            <option>Favorable</option>
                            <option>Archivado</option>
                        </select>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Número de Proceso</label>
                            <input v-model="form.numero_proceso" type="text" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: 01015-2024-00123" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Juicio</label>
                            <InputAutocomplete v-model="form.tipo_juicio" field="tipo_juicio"
                                placeholder="Ej: Juicio Ordinario Laboral" />
                        </div>
                        <div class="col-span-1 md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Órgano
                                Jurisdiccional</label>
                            <InputAutocomplete v-model="form.organo_jurisdiccional" field="organo_jurisdiccional"
                                placeholder="Buscar juzgado..." />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Juez</label>
                            <InputAutocomplete v-model="form.juez" field="juez" placeholder="Nombre del Juez" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Oficial</label>
                            <InputAutocomplete v-model="form.oficial" field="oficial"
                                placeholder="Nombre/No. Oficial" />
                        </div>

                    </div>

                    <hr class="border-gray-100" />

                    <!-- Actor (CU-02) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Parte Demandante</label>
                        <ActorSearch v-model="form.demandante_id" type="Demandante / Parte Actora" />
                        <p v-if="!form.demandante_id && submitted && !form.demandante_id_nullable"
                            class="text-xs text-red-500 mt-1">Debe seleccionar un
                            demandante.</p>
                    </div>

                    <!-- Ultimo Renglon (CU-NEW) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Último Renglón
                            Presupuestario</label>
                        <InputAutocomplete v-model="form.ultimo_renglon_presupuestario"
                            field="ultimo_renglon_presupuestario" placeholder="Ej: 011, 022, 029..." />
                    </div>

                    <div class="flex justify-end">
                        <button type="button" @click="activeTab = 'narrativa'"
                            class="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">Siguiente:
                            Narrativa</button>
                    </div>
                </div>

                <!-- Tab 2: Narrativa -->
                <div v-show="activeTab === 'narrativa'" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Origen del Proceso Judicial</label>
                        <textarea v-model="form.origen_proceso" rows="3"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Describa el origen..."></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Objeto de la Pretensión</label>
                        <textarea v-model="form.objeto_pretension" rows="3"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="¿Qué solicita el demandante?"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Antecedentes del Caso</label>
                        <textarea v-model="form.antecedentes_caso" rows="4"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Resumen cronológico..."></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones Generales</label>
                        <textarea v-model="form.observaciones" rows="2"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                    <div class="flex justify-between">
                        <button type="button" @click="activeTab = 'general'"
                            class="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Atrás</button>
                        <button type="button" @click="activeTab = 'estado'"
                            class="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">Siguiente:
                            Estado Actual & Finanzas</button>
                    </div>
                </div>

                <!-- Tab 3: Estado y Finanzas -->
                <div v-show="activeTab === 'estado'" class="space-y-6">
                    <!-- Actitud Procesal -->
                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label class="block text-sm font-medium text-gray-700 mb-3">Actitud Procesal</label>
                        <div class="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <label
                                class="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-gray-300 shadow-sm">
                                <input v-model="form.intento_conciliacion" type="checkbox"
                                    class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4">
                                <span class="text-sm text-gray-700">¿Buscó conciliación?</span>
                            </label>
                            <input v-model="form.actitud_procesal" type="text"
                                class="flex-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: Contestación Negativa" />
                        </div>
                    </div>

                    <!-- Estado Actual (Movido) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Estado Actual del Caso
                            (Descripción)</label>
                        <InputAutocomplete v-model="form.estado_actual_descripcion" field="estado_actual_descripcion"
                            placeholder="Describa el estado o seleccione..." />
                    </div>

                    <!-- Apelacion y Amparo -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Apelacion -->
                        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label class="flex items-center gap-2 cursor-pointer mb-2">
                                <input v-model="form.interpuso_apelacion" type="checkbox"
                                    class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4">
                                <span class="font-medium text-blue-900 text-sm">¿Se interpuso apelación?</span>
                            </label>

                            <div v-if="form.interpuso_apelacion" class="mt-2">
                                <label class="block text-xs font-medium text-gray-700 mb-1">Sala de la Corte de
                                    Apelaciones de Trabajo y Previsión Social</label>
                                <input v-model="form.sala_apelacion_nombre" type="text"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nombre de la Sala" />
                            </div>
                        </div>

                        <!-- Amparo -->
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <label class="flex items-center gap-2 cursor-pointer mb-2">
                                <input v-model="form.tiene_amparo" type="checkbox"
                                    class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4">
                                <span class="text-sm font-medium text-gray-700">Acción constitucional de amparo</span>
                            </label>

                            <div v-if="form.tiene_amparo" class="space-y-3 mt-3">
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Órgano
                                        Competente</label>
                                    <input v-model="form.amparo_organo_competente" type="text"
                                        class="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                        placeholder="Ej: Corte de Constitucionalidad" />
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Número de Amparo</label>
                                    <input v-model="form.numero_amparo" type="text"
                                        class="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                        placeholder="No. Expediente" />
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Estado del
                                        Amparo</label>
                                    <select v-model="form.estado_amparo_descripcion"
                                        class="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                        <option value="" disabled>Seleccione un estado</option>
                                        <option>Admitido</option>
                                        <option>Otorgado provisionalmente</option>
                                        <option>Definitiva</option>
                                        <option>Rechazado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr class="border-gray-100 my-6" />

                    <!-- Montos (Finanzas) -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Monto Auto de
                                Liquidación</label>
                            <div class="relative">
                                <span class="absolute left-3 top-2 text-gray-500">Q</span>
                                <input v-model="form.monto_liquidacion" type="number" step="0.01"
                                    class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Monto RRHH</label>
                            <div class="relative">
                                <span class="absolute left-3 top-2 text-gray-500">Q</span>
                                <input v-model="form.monto_rrhh" type="number" step="0.01"
                                    class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Contingencia</label>
                            <div class="relative">
                                <span class="absolute left-3 top-2 text-gray-500">Q</span>
                                <input v-model="form.monto_estimado" type="number" step="0.01"
                                    class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg font-mono font-bold text-gray-800 focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Impacto Financiero de
                            Sentencia</label>
                        <textarea v-model="form.efecto_sentencia_descripcion" rows="2"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Describa el impacto financiero..."></textarea>
                    </div>

                    <div class="flex justify-between pt-4">
                        <button type="button" @click="activeTab = 'narrativa'"
                            class="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Atrás</button>
                        <button type="submit" :disabled="loading"
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                            {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar Expediente' : 'Crear Expediente') }}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import InputAutocomplete from '../components/juridica/InputAutocomplete.vue';
import ActorSearch from '../components/juridica/ActorSearch.vue';
import juridicaService from '../services/juridica.service';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const submitted = ref(false);
const activeTab = ref('general');
const isEditing = computed(() => !!route.params.id);

const form = ref({
    numero_proceso: '',
    tipo_juicio: null,
    organo_jurisdiccional: null,
    juez: null,
    oficial: null,
    demandante_id: null,
    ultimo_renglon_presupuestario: null,
    estado_procesal: 'En Trámite',

    // Narrativa
    origen_proceso: '',
    objeto_pretension: '',
    antecedentes_caso: '',
    observaciones: '',

    // Estado & Finanzas
    estado_procesal: 'En Trámite',
    actitud_procesal: '',
    intento_conciliacion: false,

    // Apelacion
    interpuso_apelacion: false,
    sala_apelacion_nombre: '',

    // Amparo
    tiene_amparo: false,
    amparo_organo_competente: '',
    numero_amparo: '',
    estado_amparo_descripcion: '',

    // Finanzas
    monto_liquidacion: 0,
    monto_rrhh: 0,
    monto_estimado: 0,
    efecto_sentencia_descripcion: '', // Impacto financiero

    // Otros
    observaciones: '',
    estado_actual_descripcion: ''
});

const handleSubmit = async () => {
    submitted.value = true;
    // Allow null demandante_id if migration allows it, logic here assumes we want to enforce it unless needed.
    // User requested "juicios.demandante_id pueda ser nulo".
    // If we want to allow skipping, we remove the check or make it conditional.
    // For now, I'll relax the frontend validation or rely on server response.
    // But since Case Create usually requires it, I will keep specific validation unless editing might have it null?
    // Let's assume for now we keep enforcing on CREATE but maybe relax on EDIT? Or user said "pueda ser nulo" generally.
    // I will relax the check.
    /*
    if (!form.value.demandante_id) {
        activeTab.value = 'general'; // Force switch to tab with error
        return;
    }
    */

    loading.value = true;
    try {
        if (isEditing.value) {
            await juridicaService.updateJuicio(route.params.id, form.value);
            router.push({ name: 'CaseDetail', params: { id: route.params.id } });
        } else {
            const res = await juridicaService.createJuicio(form.value);
            router.push({ name: 'CaseDetail', params: { id: res.data.id } });
        }
    } catch (err) {
        console.error(err);
        alert('Error al guardar el caso.');
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    if (isEditing.value) {
        loading.value = true;
        try {
            const res = await juridicaService.getJuicioAndHistory(route.params.id);
            const data = res.data;
            // Map data to form
            form.value = {
                ...form.value, // keep defaults
                ...data,
                // Ensure nulls are handled if needed
                demandante_id: data.demandante_id || null
            };
        } catch (err) {
            console.error(err);
            alert("No se pudo cargar el caso para edición");
            router.push('/dashboard');
        } finally {
            loading.value = false;
        }
    }
});
</script>
