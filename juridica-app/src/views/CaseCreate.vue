<template>
    <div class="max-w-5xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800">Nuevo Juicio Ordinario Laboral</h1>
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
                    3. Estado y Finanzas
                </button>
            </div>

            <form @submit.prevent="handleSubmit" class="p-8">

                <!-- Tab 1: General -->
                <div v-show="activeTab === 'general'" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Número de Proceso</label>
                            <input v-model="form.numero_proceso" type="text" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: 01015-2024-00123" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Órgano Jurisdiccional</label>
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
                        <ActorSearch v-model="form.demandante_id" type="Demandante" />
                        <p v-if="!form.demandante_id && submitted" class="text-xs text-red-500 mt-1">Debe seleccionar un
                            demandante.</p>
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Origen del Proceso</label>
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
                            Estado y Finanzas</button>
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

                    <!-- Montos -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Monto Liquidación</label>
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
                            <label class="block text-sm font-medium text-gray-700 mb-1">Contingencia Est.</label>
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

                    <hr class="border-gray-100" />

                    <!-- Manual Fields (Apelación / Amparo) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sala de Apelación
                                (Manual)</label>
                            <input v-model="form.sala_apelacion_nombre" type="text"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Nombre de la Sala" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Estado de Amparo</label>
                            <div class="flex gap-2">
                                <label class="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                    <input v-model="form.tiene_amparo" type="checkbox"
                                        class="rounded text-blue-600 focus:ring-blue-500">
                                    <span class="text-sm">¿Tiene?</span>
                                </label>
                                <input v-model="form.estado_amparo_descripcion" type="text"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Descripción del estado..." />
                            </div>
                        </div>
                    </div>


                    <div class="flex justify-between pt-4">
                        <button type="button" @click="activeTab = 'narrativa'"
                            class="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Atrás</button>
                        <button type="submit" :disabled="loading"
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                            {{ loading ? 'Guardando...' : 'Crear Expediente' }}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import InputAutocomplete from '../components/juridica/InputAutocomplete.vue';
import ActorSearch from '../components/juridica/ActorSearch.vue';
import juridicaService from '../services/juridica.service';

const router = useRouter();
const loading = ref(false);
const submitted = ref(false);
const activeTab = ref('general');

const form = ref({
    // General
    numero_proceso: '',
    organo_jurisdiccional: '',
    juez: '',
    oficial: '',
    demandante_id: null,

    // Narrativa
    origen_proceso: '',
    objeto_pretension: '',
    antecedentes_caso: '',
    observaciones: '',

    // Estado & Finanzas
    estado_procesal: 'En Trámite',
    actitud_procesal: '',
    intento_conciliacion: false,
    monto_liquidacion: 0,
    monto_rrhh: 0,
    monto_estimado: 0,
    efecto_sentencia_descripcion: '', // Impacto financiero

    // Apelación / Amparo (Manuales)
    sala_apelacion_nombre: '',
    tiene_amparo: false,
    estado_amparo_descripcion: ''
});

const handleSubmit = async () => {
    submitted.value = true;
    if (!form.value.demandante_id) {
        activeTab.value = 'general'; // Force switch to tab with error
        return;
    }

    loading.value = true;
    try {
        await juridicaService.createJuicio(form.value);
        router.push('/dashboard');
    } catch (err) {
        console.error(err);
        alert('Error al crear el caso.');
    } finally {
        loading.value = false;
    }
};
</script>
