<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h1>Gestión de Permisos</h1>
            <button class="btn btn-primary" @click="openModal(null)">
                <i class="bi bi-plus-lg me-2"></i>Nuevo Permiso
            </button>
        </div>

        <div v-if="store.isLoading" class="text-center mt-5">
            <div class="spinner-border"></div>
        </div>

        <div v-else class="card">
            <div class="card-body">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th scope="col">Clave</th>
                            <th scope="col">Descripción</th>
                            <th scope="col" class="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="permission in store.permissions" :key="permission.id_permiso">
                            <td><span class="badge bg-primary-subtle text-primary-emphasis rounded-pill">{{
                                permission.clave_permiso }}</span></td>
                            <td>{{ permission.descripcion }}</td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-secondary me-2"
                                    @click="openModal(permission)">Editar</button>
                                <button class="btn btn-sm btn-outline-danger"
                                    @click="handleDelete(permission)">Eliminar</button>
                            </td>
                        </tr>
                        <tr v-if="store.permissions.length === 0">
                            <td colspan="3" class="text-center text-muted">No hay permisos definidos.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <PermissionFormModal v-if="isModalOpen" :permission-to-edit="selectedPermission as any" @close="closeModal"
            @save="handleSave" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePermissionsStore } from '@/stores/permissions.store';
import PermissionFormModal from '@/components/PermissionFormModal.vue';

const store = usePermissionsStore();
const isModalOpen = ref(false);
const selectedPermission = ref(null);

onMounted(() => store.fetchPermissions());

const openModal = (permission: any) => {
    selectedPermission.value = permission;
    isModalOpen.value = true;
};
const closeModal = () => isModalOpen.value = false;

const handleSave = async (data: any) => {
    if (selectedPermission.value) {
        await store.updatePermission((selectedPermission.value as any).id_permiso, data);
    } else {
        await store.createPermission(data);
    }
    closeModal();
};

const handleDelete = async (permission: any) => {
    if (confirm(`¿Seguro que quieres eliminar el permiso "${permission.clave_permiso}"?`)) {
        await store.deletePermission(permission.id_permiso);
    }
};
</script>