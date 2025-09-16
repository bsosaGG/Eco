<template>
    <header class="header bg-white shadow-sm p-3 border-bottom">
        <div class="d-flex justify-content-between align-items-center">

            <button class="btn btn-light d-lg-none" type="button" @click="emit('toggle-sidebar')"
                aria-label="Toggle navigation">
                <i class="bi bi-list"></i>
            </button>

            <div class="ms-auto" v-if="authStore.isAuthenticated && authStore.user">
                <div class="dropdown">
                    <a href="#" class="d-flex align-items-center text-dark text-decoration-none dropdown-toggle"
                        id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-person-circle fs-4 me-2"></i>
                        <strong>{{ authStore.user.name }}</strong>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end text-small shadow" aria-labelledby="dropdownUser1">
                        <li><a class="dropdown-item" href="#">Mi Perfil</a></li>
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li><a class="dropdown-item" href="#" @click.prevent="authStore.logout()">Cerrar Sesión</a></li>
                    </ul>
                </div>
            </div>

        </div>
    </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store';
const authStore = useAuthStore();
const emit = defineEmits(['toggle-sidebar']);
</script>

<style scoped>
.header {
    grid-area: header;
}
</style>