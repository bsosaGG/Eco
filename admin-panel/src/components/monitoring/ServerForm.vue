<template>
    <form @submit.prevent="handleSubmit">
        <div class="mb-3">
            <label for="serverName" class="form-label">Nombre del Servidor</label>
            <input type="text" class="form-control" id="serverName" v-model="formData.nombre" required>
        </div>
        <div class="mb-3">
            <label for="serverIp" class="form-label">Dirección IP</label>
            <input type="text" class="form-control" id="serverIp" v-model="formData.direccion_ip" required>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="serverUser" class="form-label">Usuario SSH</label>
                <input type="text" class="form-control" id="serverUser" v-model="formData.usuario_ssh" required>
            </div>
            <div class="col-md-6 mb-3">
                <label for="serverPort" class="form-label">Puerto SSH</label>
                <input type="number" class="form-control" id="serverPort" v-model.number="formData.puerto_ssh" required>
            </div>
        </div>
        <div class="mb-3">
            <label for="serverInterval" class="form-label">Intervalo de Verificación (segundos)</label>
            <input type="number" class="form-control" id="serverInterval"
                v-model.number="formData.intervalo_verificacion_segundos" required min="30">
        </div>
        <div class="mb-3">
            <label for="serverPassphrase" class="form-label">Contraseña de la Clave SSH (Opcional)</label>
            <input type="password" class="form-control" id="serverPassphrase" v-model="formData.ssh_key_passphrase"
                placeholder="Dejar en blanco si no se usa">
            <div class="form-text">Rellena este campo solo si tu clave SSH está protegida por una contraseña.</div>
        </div>
        <div class="mb-3">
            <label for="serverDescription" class="form-label">Descripción (Opcional)</label>
            <textarea class="form-control" id="serverDescription" v-model="formData.descripcion" rows="3"></textarea>
        </div>
        <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" role="switch" id="serverActive" v-model="formData.activo">
            <label class="form-check-label" for="serverActive">Monitoreo Activo</label>
        </div>
        <div class="text-end">
            <button type="button" class="btn btn-secondary me-2" @click="$emit('cancel')">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"
                    aria-hidden="true"></span>
                {{ initialData ? 'Actualizar Servidor' : 'Guardar Servidor' }}
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';
import type { Server } from '@/stores/monitoring.store';

const props = defineProps({
    initialData: { type: Object as PropType<Server | null>, default: null },
    isSubmitting: { type: Boolean, default: false }
});

const emit = defineEmits(['submit', 'cancel']);

const createDefaultFormData = () => ({
    nombre: '',
    direccion_ip: '',
    usuario_ssh: 'root',
    puerto_ssh: 22,
    intervalo_verificacion_segundos: 300,
    ssh_key_passphrase: '',
    descripcion: '',
    activo: true,
});

const formData = ref(createDefaultFormData());

watch(() => props.initialData, (newData) => {
    if (newData) {
        formData.value = { ...createDefaultFormData(), ...newData };
    } else {
        formData.value = createDefaultFormData();
    }
}, { immediate: true });

const handleSubmit = () => {
    emit('submit', formData.value);
};
</script>