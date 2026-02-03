<template>
    <div class="relative">
        <div class="relative">
            <input type="text" v-model="searchQuery" @input="handleInput" @focus="showResults = true" @blur="delayHide"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Buscar demandante (Nombre o ID)..." />
            <Search class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <!-- Dropdown Results -->
        <ul v-if="showResults && (results.length > 0 || searchQuery.length >= 2)"
            class="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
            <li v-for="actor in results" :key="actor.id" @mousedown="selectActor(actor)"
                class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">
                <div class="font-medium text-gray-800">{{ actor.nombre }}</div>
                <div class="text-xs text-gray-500 flex gap-2">
                    <span v-if="actor.identificacion">{{ actor.identificacion_tipo }}: {{ actor.identificacion }}</span>
                    <span class="bg-gray-100 px-1 rounded text-gray-600">{{ actor.tipo }}</span>
                </div>
            </li>
            <!-- Create New Option -->
            <li @mousedown="openCreateModal"
                class="px-4 py-3 bg-blue-50 hover:bg-blue-100 cursor-pointer text-blue-700 font-medium flex items-center gap-2">
                <PlusCircle class="w-4 h-4" />
                Crear nuevo: "{{ searchQuery }}"
            </li>
        </ul>

        <!-- Selection Display (Overrides input if selected) -->
        <div v-if="selectedActor"
            class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
            <div>
                <div class="font-medium text-blue-900">{{ selectedActor.nombre }}</div>
                <div class="text-xs text-blue-700">ID: {{ selectedActor.id }} | {{ selectedActor.identificacion || 'Sin ID' }}</div>
            </div>
            <button @click="clearSelection" class="text-blue-500 hover:text-blue-700">
                <X class="w-4 h-4" />
            </button>
        </div>

        <!-- Modal Creation -->
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Registrar Nuevo Actor</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input v-model="newActor.nombre" type="text"
                            class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo ID</label>
                            <select v-model="newActor.identificacion_tipo"
                                class="w-full border border-gray-300 rounded-lg p-2">
                                <option value="DPI">DPI</option>
                                <option value="NIT">NIT</option>
                                <option value="Pasaporte">Pasaporte</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Identificación</label>
                            <input v-model="newActor.identificacion" type="text"
                                class="w-full border border-gray-300 rounded-lg p-2" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo Actor</label>
                        <select v-model="newActor.tipo" class="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
                            disabled>
                            <option value="Demandante / Parte Actora">Demandante / Parte Actora</option>
                        </select>
                    </div>
                </div>
                <div class="mt-6 flex justify-end gap-3">
                    <button @click="closeModal" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                    <button @click="createActor" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        :disabled="creating">
                        {{ creating ? 'Guardando...' : 'Guardar y Seleccionar' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Search, PlusCircle, X } from 'lucide-vue-next';
import juridicaService from '../../services/juridica.service';

const props = defineProps({
    modelValue: Number, // ID of selected actor
    type: { type: String, default: 'Demandante / Parte Actora' }
});

const emit = defineEmits(['update:modelValue']);

const searchQuery = ref('');
const results = ref([]);
const showResults = ref(false);
const selectedActor = ref(null);
const showModal = ref(false);
const creating = ref(false);

const newActor = ref({
    nombre: '',
    identificacion: '',
    identificacion_tipo: 'DPI',
    tipo: props.type
});

let debounceTimeout;

const handleInput = () => {
    if (searchQuery.value.length < 2) {
        results.value = [];
        return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        try {
            const res = await juridicaService.searchActores(searchQuery.value, props.type);
            results.value = res.data;
        } catch (err) {
            console.error(err);
        }
    }, 300);
};

const selectActor = (actor) => {
    selectedActor.value = actor;
    emit('update:modelValue', actor.id);
    showResults.value = false;
    searchQuery.value = ''; // Clear search
};

const clearSelection = () => {
    selectedActor.value = null;
    emit('update:modelValue', null);
};

const delayHide = () => {
    setTimeout(() => {
        showResults.value = false;
    }, 200);
};

// Modal Logic
const openCreateModal = () => {
    newActor.value.nombre = searchQuery.value; // Pre-fill name
    showModal.value = true;
    showResults.value = false;
};

const closeModal = () => {
    showModal.value = false;
};

const createActor = async () => {
    creating.value = true;
    try {
        const res = await juridicaService.createActor(newActor.value);
        selectActor(res.data); // Auto-select new actor
        closeModal();
    } catch (err) {
        console.error(err);
        alert('Error al crear actor');
    } finally {
        creating.value = false;
    }
};

// Edit Mode: Load initial actor if ID is present
const loadActor = async (id) => {
    if (!id) return;
    try {
        // If we already have selectedActor and it matches, skip
        if (selectedActor.value && selectedActor.value.id === id) return;

        const res = await juridicaService.getActorById(id);
        selectedActor.value = res.data;
    } catch (err) {
        console.error("Error loading actor for edit:", err);
    }
};

watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        loadActor(newVal);
    } else {
        selectedActor.value = null;
    }
}, { immediate: true });

</script>
