<template>
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}</h5>
                    <button type="button" class="btn-close" @click="$emit('close')"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Datos del Usuario</h6>
                            <div class="mb-3">
                                <label for="name" class="form-label">Nombre Completo</label>
                                <input type="text" class="form-control" id="name" v-model="form.nombre_completo"
                                    required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Correo Electrónico</label>
                                <input type="email" class="form-control" id="email" v-model="form.email" required>
                            </div>
                            <div class="mb-3">
                                <label for="role" class="form-label">Rol</label>
                                <select class="form-select" id="role" v-model="form.rol">
                                    <option value="usuario">Usuario</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div class="form-check form-switch mb-3" v-if="isEditMode">
                                <input class="form-check-input" type="checkbox" role="switch" id="activeSwitch"
                                    v-model="form.activo">
                                <label class="form-check-label" for="activeSwitch">Usuario Activo</label>
                            </div>
                        </div>

                        <div class="col-md-6" v-if="isEditMode">
                            <h6>Asignación de Acceso</h6>
                            <div class="mb-3">
                                <strong>Perfiles</strong>
                                <div class="permission-grid">
                                    <div v-for="profile in profilesStore.profiles" :key="profile.id_perfil"
                                        class="form-check">
                                        <input class="form-check-input" type="checkbox" :value="profile.id_perfil"
                                            v-model="form.profileIds">
                                        <label class="form-check-label">{{ profile.nombre_perfil }}</label>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <strong>Permisos Directos</strong>
                                <div class="permission-grid">
                                    <div v-for="permission in profilesStore.permissions" :key="permission.id_permiso"
                                        class="form-check">
                                        <input class="form-check-input" type="checkbox" :value="permission.id_permiso"
                                            v-model="form.directPermissionIds">
                                        <label class="form-check-label">{{ permission.clave_permiso }}</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr>
                    <div v-if="!isEditMode">
                        <label for="password" class="form-label">Contraseña</label>
                        <input type="password" class="form-control" id="password" v-model="form.password"
                            :required="!isEditMode">
                    </div>
                    <div v-if="isEditMode">
                        <button class="btn btn-link ps-0" type="button" @click="showResetPassword = !showResetPassword">
                            Restablecer Contraseña
                        </button>
                        <div v-if="showResetPassword" class="input-group mt-2">
                            <input type="password" class="form-control" placeholder="Escriba la nueva contraseña"
                                v-model="newPassword">
                            <button class="btn btn-outline-warning" type="button" @click="handleResetPassword">Guardar
                                Nueva Contraseña</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancelar</button>
                    <button type="button" class="btn btn-primary" @click="$emit('save', form)">
                        {{ isEditMode ? 'Guardar Cambios' : 'Crear Usuario' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue';
import type { IUser } from '@/types/user.interface';
import { useProfilesStore } from '@/stores/profiles.store';
import { useUsersStore } from '@/stores/users.store';

const props = defineProps({
    userToEdit: {
        type: Object as PropType<IUser | null>,
        default: null
    }
});

const emit = defineEmits(['close', 'save']);
const profilesStore = useProfilesStore();
const usersStore = useUsersStore();

const form = ref({
    nombre_completo: '',
    email: '',
    password: '',
    rol: 'usuario',
    activo: true,
    profileIds: [] as number[],
    directPermissionIds: [] as number[],
});

const newPassword = ref('');
const showResetPassword = ref(false);

const isEditMode = computed(() => !!props.userToEdit);

watch(() => props.userToEdit, (currentUser) => {
    showResetPassword.value = false;
    newPassword.value = '';

    if (currentUser) {
        form.value = {
            nombre_completo: currentUser.nombre_completo || '',
            email: currentUser.email || '',
            rol: currentUser.rol || 'usuario',
            activo: currentUser.activo,
            password: '',
            profileIds: currentUser.profileIds || [],
            directPermissionIds: currentUser.directPermissionIds || [],
        };
    } else {
        form.value = {
            nombre_completo: '',
            email: '',
            password: '',
            rol: 'usuario',
            activo: true,
            profileIds: [],
            directPermissionIds: [],
        };
    }
}, {
    immediate: true,
    deep: true,
});

const handleResetPassword = async () => {
    if (!newPassword.value) {
        alert("Por favor, ingrese una nueva contraseña.");
        return;
    }
    if (!props.userToEdit) return;

    try {
        await usersStore.resetPassword(props.userToEdit.id_usuario, newPassword.value);
        alert("Contraseña restablecida con éxito.");
        newPassword.value = '';
        showResetPassword.value = false;
    } catch (error) {
        alert("Error al restablecer la contraseña.");
    }
}
</script>

<style scoped>
.permission-grid {
    max-height: 150px;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    padding: 0.75rem;
    border-radius: 0.375rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
}
</style>