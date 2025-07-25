<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h1>Gestión de Usuarios</h1>
            <button class="btn btn-primary" @click="openModal()">
                <i class="bi bi-plus-lg me-2"></i>Nuevo Usuario
            </button>
        </div>

        <div v-if="usersStore.isLoading" class="text-center mt-5">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        </div>

        <div v-else-if="usersStore.error" class="alert alert-danger text-center">
            <h4><i class="bi bi-exclamation-triangle-fill me-2"></i>Error</h4>
            <p>{{ usersStore.error }}</p>
            <p class="mb-0">Es posible que no tengas permisos para ver esta sección.</p>
        </div>

        <div v-else class="card shadow-sm">
            <div class="card-body">
                <div v-if="usersStore.users.length === 0" class="text-center p-4">
                    <p class="text-muted">No se encontraron usuarios.</p>
                    <button class="btn btn-primary" @click="openModal()">Crear el Primer Usuario</button>
                </div>

                <table v-else class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th class="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in usersStore.users" :key="user.id_usuario">
                            <td>{{ user.nombre_completo }}</td>
                            <td>{{ user.email }}</td>
                            <td>
                                <span class="badge" :class="user.rol === 'admin' ? 'bg-success' : 'bg-secondary'">{{
                                    user.rol }}</span>
                            </td>
                            <td>
                                <span class="badge" :class="user.activo ? 'bg-primary' : 'bg-warning text-dark'">{{
                                    user.activo ? 'Activo' : 'Inactivo' }}</span>
                            </td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-secondary me-2" @click="openModal(user)">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" @click="handleDelete(user)">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <UserFormModal v-if="isModalOpen" :user-to-edit="selectedUser" @close="closeModal" @save="handleSave" />
    </div>
</template>

<script setup lang="ts">
// El script de este archivo no necesita cambios
import { ref, onMounted } from 'vue';
import { useUsersStore } from '@/stores/users.store';
import { useProfilesStore } from '@/stores/profiles.store';
import type { IUser } from '@/types/user.interface';
import UserFormModal from '@/components/UserFormModal.vue';

const usersStore = useUsersStore();
const profilesStore = useProfilesStore();

const isModalOpen = ref(false);
const selectedUser = ref<IUser | null>(null);

onMounted(() => {
    usersStore.fetchAllUsers();
    profilesStore.fetchData();
});

const openModal = async (user: IUser | null = null) => {
    if (user) {
        const fullUserData = await usersStore.fetchUserById(user.id_usuario);
        selectedUser.value = fullUserData;
    } else {
        selectedUser.value = null;
    }
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    selectedUser.value = null;
};

const handleSave = async (userData: any) => {
    try {
        if (selectedUser.value) {
            await usersStore.updateUser(selectedUser.value.id_usuario, userData);
            await usersStore.updateUserAccess(selectedUser.value.id_usuario, {
                profileIds: userData.profileIds,
                directPermissionIds: userData.directPermissionIds,
            });
        } else {
            await usersStore.createUser(userData);
        }
        closeModal();
    } catch (error) {
        alert('Ocurrió un error al guardar el usuario.');
    }
};

const handleDelete = async (user: IUser) => {
    if (confirm(`¿Estás seguro de que quieres desactivar al usuario ${user.nombre_completo}?`)) {
        try {
            await usersStore.deleteUser(user.id_usuario);
        } catch (error) {
            alert('Ocurrió un error al desactivar el usuario.');
        }
    }
};
</script>