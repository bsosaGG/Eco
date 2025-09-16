<template>
    <form @submit.prevent="handleSubmit">
        <div class="mb-3">
            <label for="siteName" class="form-label">Nombre del Sitio</label>
            <input type="text" class="form-control" id="siteName" v-model="formData.nombre" required>
        </div>
        <div class="mb-3">
            <label for="siteUrl" class="form-label">URL Completa</label>
            <input type="url" class="form-control" id="siteUrl" v-model="formData.url" required
                placeholder="https://ejemplo.com">
        </div>
        <div class="mb-3">
            <label for="siteServer" class="form-label">Servidor Asociado (Opcional)</label>
            <select class="form-select" id="siteServer" v-model="formData.id_servidor">
                <option :value="null">Ninguno</option>
                <option v-for="server in servers" :key="server.id_servidor" :value="server.id_servidor">
                    {{ server.nombre }}
                </option>
            </select>
        </div>
        <div class="mb-3">
            <label for="siteText" class="form-label">Texto a Verificar (Opcional)</label>
            <input type="text" class="form-control" id="siteText" v-model="formData.texto_a_verificar"
                placeholder="Dejar en blanco si no aplica">
            <div class="form-text">Si se especifica, el monitoreo fallará si este texto no se encuentra en la página.
            </div>
        </div>
        <div class="mb-3">
            <label for="siteInterval" class="form-label">Intervalo de Verificación (segundos)</label>
            <input type="number" class="form-control" id="siteInterval"
                v-model.number="formData.intervalo_verificacion_segundos" required min="30">
        </div>
        <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" role="switch" id="siteActive" v-model="formData.activo">
            <label class="form-check-label" for="siteActive">Monitoreo Activo</label>
        </div>
        <div class="text-end">
            <button type="button" class="btn btn-secondary me-2" @click="$emit('cancel')">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"
                    aria-hidden="true"></span>
                {{ initialData ? 'Actualizar Sitio' : 'Guardar Sitio' }}
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';
import type { Site, Server } from '@/stores/monitoring.store';

const props = defineProps({
    initialData: { type: Object as PropType<Site | null>, default: null },
    servers: { type: Array as PropType<Server[]>, required: true },
    isSubmitting: { type: Boolean, default: false }
});

const emit = defineEmits(['submit', 'cancel']);

const createDefaultFormData = () => ({
    nombre: '',
    url: '',
    id_servidor: null,
    texto_a_verificar: '',
    intervalo_verificacion_segundos: 300,
    activo: true,
});

const formData = ref(createDefaultFormData());

watch(() => props.initialData, (newData) => {
    if (newData) {
        formData.value = { ...createDefaultFormData(), ...newData } as any;
    } else {
        formData.value = createDefaultFormData();
    }
}, { immediate: true });

const handleSubmit = () => {
    emit('submit', formData.value);
};
</script>
