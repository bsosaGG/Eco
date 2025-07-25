<template>
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ isEditMode ? 'Editar Perfil' : 'Nuevo Perfil' }}</h5>
                    <button type="button" class="btn-close" @click="$emit('close')"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="name" class="form-label">Nombre del Perfil</label>
                        <input type="text" class="form-control" id="name" v-model="form.nombre_perfil">
                    </div>
                    <div class="mb-3">
                        <label for="desc" class="form-label">Descripción</label>
                        <textarea class="form-control" id="desc" rows="2" v-model="form.descripcion"></textarea>
                    </div>
                    <hr>
                    <h6>Permisos</h6>
                    <div class="permission-grid">
                        <div v-for="permission in store.permissions" :key="permission.id_permiso" class="form-check">
                            <input class="form-check-input" type="checkbox" :value="permission.id_permiso"
                                :id="`perm-${permission.id_permiso}`" v-model="form.permissionIds">
                            <label class="form-check-label" :for="`perm-${permission.id_permiso}`">
                                {{ permission.clave_permiso }}
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancelar</button>
                    <button type="button" class="btn btn-primary" @click="$emit('save', form)">Guardar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProfilesStore } from '@/stores/profiles.store';

const props = defineProps({
    profileToEdit: { type: Object, default: null }
});

defineEmits(['close', 'save']);

const store = useProfilesStore();
const isEditMode = computed(() => !!props.profileToEdit);

const form = ref({
    nombre_perfil: '',
    descripcion: '',
    permissionIds: [] as number[],
});

onMounted(() => {
    if (isEditMode.value) {
        form.value.nombre_perfil = props.profileToEdit.nombre_perfil;
        form.value.descripcion = props.profileToEdit.descripcion;
        form.value.permissionIds = props.profileToEdit.permisos.map((p: any) => p.id_permiso);
    }
});
</script>

<style scoped>
.permission-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
}
</style>