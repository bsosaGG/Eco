<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h1>Gestión de Perfiles y Permisos</h1>
            <button class="btn btn-primary" @click="openModal(null)">
                <i class="bi bi-plus-lg me-2"></i>Nuevo Perfil
            </button>
        </div>

        <div v-if="store.isLoading" class="text-center mt-5">
            <div class="spinner-border"></div>
        </div>

        <div v-else class="row gy-4">
            <div v-for="profile in store.profiles" :key="profile.id_perfil" class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">{{ profile.nombre_perfil }}</h5>
                        <p class="card-text text-muted">{{ profile.descripcion }}</p>
                        <div class="mt-auto">
                            <h6>Permisos:</h6>
                            <div v-if="profile.permisos.length > 0">
                                <span v-for="permiso in profile.permisos" :key="permiso.id_permiso"
                                    class="badge bg-secondary me-1 mb-1">
                                    {{ permiso.clave_permiso }}
                                </span>
                            </div>
                            <p v-else class="text-muted small">Sin permisos asignados.</p>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0 text-end">
                        <button class="btn btn-sm btn-outline-secondary me-2"
                            @click="openModal(profile)">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" @click="handleDelete(profile)">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>

        <ProfileFormModal v-if="isModalOpen" :profile-to-edit="selectedProfile as any" @close="closeModal"
            @save="handleSave" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProfilesStore } from '@/stores/profiles.store';
import ProfileFormModal from '@/components/ProfileFormModal.vue';

const store = useProfilesStore();
const isModalOpen = ref(false);
const selectedProfile = ref(null);

onMounted(() => store.fetchData());

const openModal = (profile: any) => {
    selectedProfile.value = profile;
    isModalOpen.value = true;
};
const closeModal = () => isModalOpen.value = false;

const handleSave = async (data: any) => {
    if (selectedProfile.value) {
        await store.updateProfile((selectedProfile.value as any).id_perfil, data);
    } else {
        await store.createProfile(data);
    }
    closeModal();
};

const handleDelete = async (profile: any) => {
    if (confirm(`¿Seguro que quieres eliminar el perfil "${profile.nombre_perfil}"?`)) {
        await store.deleteProfile(profile.id_perfil);
    }
};
</script>