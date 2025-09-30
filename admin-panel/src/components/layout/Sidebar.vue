<template>
    <aside class="sidebar d-flex flex-column flex-shrink-0 p-3 bg-dark text-white">
        <a href="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
            <span class="fs-4">Admin Panel</span>
        </a>
        <hr>
        <ul class="nav nav-pills flex-column mb-auto">
            <li class="nav-item">
                <RouterLink to="/" class="nav-link" :class="{ 'active': $route.path === '/' }" @click="linkClicked">
                    <i class="bi bi-house-door me-2"></i> Dashboard
                </RouterLink>
            </li>
            <li v-if="authStore.isAdmin">
                <RouterLink to="/users" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-people me-2"></i> Usuarios
                </RouterLink>
            </li>
            <li v-if="authStore.isAdmin">
                <RouterLink to="/profiles" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-shield-lock me-2"></i> Perfiles
                </RouterLink>
            </li>
            <li v-if="authStore.isAdmin">
                <RouterLink to="/permissions" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-key-fill me-2"></i> Permisos
                </RouterLink>
            </li>
            <li v-if="authStore.hasPermission('pac-item:read')">
                <RouterLink to="/pac" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-card-list me-2"></i> PAC
                </RouterLink>
            </li>
            <li v-if="authStore.hasPermission('pac-reports:read')">
                <RouterLink to="/pac/reports" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-bar-chart-line-fill me-2"></i> Reportes PAC
                </RouterLink>
            </li>
            <li v-if="authStore.hasPermission('cloudflare-requests:read')">
                <RouterLink to="/cloudflare-requests" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-cloud-fill me-2"></i> Peticiones Cloudflare
                </RouterLink>
            </li>
            <li v-if="authStore.hasPermission('monitoring:read')">
                <RouterLink to="/monitoring" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-hdd-network me-2"></i> Monitoreo
                </RouterLink>
            </li>
            <li v-if="authStore.hasPermission('external-reports:read')">
                <RouterLink to="/external-reports" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-file-earmark-arrow-down-fill me-2"></i> Reportes Externos
                </RouterLink>
            </li>
        </ul>
    </aside>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();

// Definimos el evento que este componente puede emitir
const emit = defineEmits(['navigate']);

// Función que se llama al hacer clic en cualquier enlace
const linkClicked = () => {
    emit('navigate'); // Emitimos el evento 'navigate'
};
</script>

<style scoped>
.sidebar {
    grid-area: sidebar;
    height: 100vh;
    width: 280px;
    /* Ancho fijo */
    transition: transform 0.3s ease-in-out;
    /* Animación para el deslizamiento */
    z-index: 1030;
    /* Para que se muestre por encima del contenido en móvil */
    overflow-y: auto;
    /* Permite scroll si el menú es muy largo */
}

.nav-link {
    color: white;
}

.nav-link.active {
    background-color: #495057;
}

.nav-link:hover {
    background-color: #343a40;
}
</style>