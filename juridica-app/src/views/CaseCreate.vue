<template>
    <div class="max-w-2xl mx-auto space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Nuevo Expediente</h2>

            <form @submit.prevent="handleSubmit" class="space-y-6">
                <!-- Número de Proceso -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Número de Proceso <span
                            class="text-red-500">*</span></label>
                    <input v-model="form.numero_proceso" type="text" required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Ej: 01015-2024-00123" />
                </div>

                <!-- Demandante -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Parte Demandante <span
                            class="text-red-500">*</span></label>
                    <ActorSearch v-model="form.demandante_id" type="Demandante / Parte Actora" />
                    <p v-if="!form.demandante_id && submitted" class="text-xs text-red-500 mt-1">Debe seleccionar un
                        demandante.</p>
                </div>

                <!-- Botones -->
                <div class="flex justify-end pt-4 gap-3">
                    <button type="button" @click="router.back()"
                        class="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium">
                        Cancelar
                    </button>
                    <button type="submit" :disabled="loading"
                        class="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 shadow-sm transition-all hover:shadow">
                        {{ loading ? 'Creando...' : 'Crear y Editar' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ActorSearch from '../components/juridica/ActorSearch.vue';
import juridicaService from '../services/juridica.service';
import { CASE_STATUSES } from '../constants/juridica.constants';

const router = useRouter();
const loading = ref(false);
const submitted = ref(false);

const form = ref({
    numero_proceso: '',
    demandante_id: null,
    estado_procesal: Object.keys(CASE_STATUSES)[0] // Default
});

const handleSubmit = async () => {
    submitted.value = true;

    if (!form.value.numero_proceso || !form.value.demandante_id) {
        return;
    }

    loading.value = true;
    try {
        const res = await juridicaService.createJuicio(form.value);
        // Redirect to CaseDetail in edit mode
        router.push({
            name: 'CaseDetail',
            params: { id: res.data.id },
            query: { edit: 'true' }
        });
    } catch (err) {
        console.error(err);
        alert('Error al crear el caso.');
    } finally {
        loading.value = false;
    }
};
</script>
