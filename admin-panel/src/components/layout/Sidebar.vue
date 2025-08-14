<template>
    <aside class="sidebar d-flex flex-column flex-shrink-0 p-3 bg-dark text-white">
        <a href="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
            <span class="fs-4">Admin Panel</span>
        </a>
        <hr>
        <ul class="nav nav-pills flex-column mb-auto">
            <li class="nav-item">
                <RouterLink to="/" class="nav-link" :class="{ 'active': $route.path === '/' }">
                    <i class="bi bi-house-door me-2"></i> Dashboard
                </RouterLink>
            </li>

            <li v-if="authStore.isAdmin">
                <RouterLink to="/users" class="nav-link" active-class="active">
                    <i class="bi bi-people me-2"></i> Usuarios
                </RouterLink>
            </li>
            <li v-if="authStore.isAdmin">
                <RouterLink to="/profiles" class="nav-link" active-class="active">
                    <i class="bi bi-shield-lock me-2"></i> Perfiles y Permisos
                </RouterLink>
            </li>
            <li v-if="authStore.hasPermission('pac-item:read')">
                <RouterLink to="/pac" class="nav-link" active-class="active">
                    <i class="bi bi-card-list me-2"></i> PAC
                </RouterLink>
            </li>
            <li v-if="authStore.hasPermission('pac-reports:read')">
                <RouterLink to="/pac/reports" class="nav-link" active-class="active">
                    <i class="bi bi-bar-chart-line-fill me-2"></i> Reportes PAC
                </RouterLink>
            </li>
        </ul>
    </aside>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
</script>

<style scoped>
.sidebar {
    grid-area: sidebar;
    height: 100vh;
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