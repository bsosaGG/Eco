<template>
    <div class="modal-backdrop show"></div>
    <div class="modal show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ formTitle }}</h5>
                    <button type="button" class="btn-close" @click="close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="save">
                        <div class="mb-3">
                            <label for="clave" class="form-label">Clave del Permiso</label>
                            <input type="text" class="form-control" id="clave" v-model="form.clave_permiso" required>
                            <div class="form-text">Un identificador único para el permiso (ej: "USER_VIEW").</div>
                        </div>
                        <div class="mb-3">
                            <label for="descripcion" class="form-label">Descripción</label>
                            <textarea class="form-control" id="descripcion" rows="3" v-model="form.descripcion"
                                required></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="close">Cancelar</button>
                    <button type="button" class="btn btn-primary" @click="save">Guardar Cambios</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
    permissionToEdit: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(['close', 'save']);

const form = ref({
    clave_permiso: '',
    descripcion: '',
});

const formTitle = computed(() => props.permissionToEdit ? 'Editar Permiso' : 'Nuevo Permiso');

onMounted(() => {
    if (props.permissionToEdit) {
        form.value = { ...props.permissionToEdit } as any;
    }
});

const close = () => emit('close');
const save = () => {
    if (form.value.clave_permiso && form.value.descripcion) {
        emit('save', form.value);
    }
};
</script>