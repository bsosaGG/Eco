<template>
    <aside class="sidebar d-flex flex-column flex-shrink-0 p-3 bg-dark text-white">
        <a href="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
            <span class="fs-4">Administración</span>
        </a>
        <hr>
        <ul class="nav nav-pills flex-column mb-auto">
            <li v-if="authStore.isAdmin" class="nav-item">
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
            <li v-if="authStore.hasPermission('documentos-plantilla:read')">
                <RouterLink to="/documentos" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-file-earmark-text me-2"></i> Plantillas
                </RouterLink>
            </li>
            <li
                v-if="authStore.hasPermission('agendas:read') || authStore.hasPermission('agendas:create') || authStore.hasPermission('agendas:view-all')">
                <a class="nav-link" data-bs-toggle="collapse" href="#agendasSubmenu" role="button" aria-expanded="false"
                    aria-controls="agendasSubmenu">
                    <i class="bi bi-calendar-week me-2"></i> Agendas
                    <i class="bi bi-chevron-down ms-auto" style="font-size: 0.8rem;"></i>
                </a>
                <div class="collapse show" id="agendasSubmenu">
                    <ul class="nav flex-column ms-3">
                        <li class="nav-item">
                            <RouterLink to="/agendas" class="nav-link py-1 text-white-50" active-class="text-white"
                                @click="linkClicked">
                                <small>Ingreso Semanal</small>
                            </RouterLink>
                        </li>
                        <li class="nav-item" v-if="authStore.hasPermission('agendas:view-all')">
                            <RouterLink to="/agendas/matrix" class="nav-link py-1 text-white-50"
                                active-class="text-white" @click="linkClicked">
                                <small>Matriz</small>
                            </RouterLink>
                        </li>
                        <li class="nav-item" v-if="authStore.hasPermission('agendas:create')">
                            <RouterLink to="/agendas/monthly" class="nav-link py-1 text-white-50"
                                active-class="text-white" @click="linkClicked">
                                <small>Cierre Mensual</small>
                            </RouterLink>
                        </li>

                        <!-- Configuración Submenu -->
                        <li class="nav-item" v-if="authStore.hasPermission('agendas:view-all')">
                            <a class="nav-link py-1 text-white-50" data-bs-toggle="collapse" href="#configSubmenu"
                                role="button" aria-expanded="false" aria-controls="configSubmenu">
                                <small>Configuración <i class="bi bi-chevron-down ms-1"
                                        style="font-size: 0.7rem;"></i></small>
                            </a>
                            <div class="collapse" id="configSubmenu">
                                <ul class="nav flex-column ms-3">
                                    <li class="nav-item">
                                        <RouterLink to="/agendas/admin/institutions" class="nav-link py-1 text-white-50"
                                            active-class="text-white" @click="linkClicked">
                                            <small>Instituciones</small>
                                        </RouterLink>
                                    </li>
                                    <li class="nav-item">
                                        <RouterLink to="/agendas/admin/assignments" class="nav-link py-1 text-white-50"
                                            active-class="text-white" @click="linkClicked">
                                            <small>Asignaciones</small>
                                        </RouterLink>
                                    </li>
                                    <li class="nav-item">
                                        <RouterLink to="/agendas/admin/item-types" class="nav-link py-1 text-white-50"
                                            active-class="text-white" @click="linkClicked">
                                            <small>Tipos de Temas</small>
                                        </RouterLink>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div>
            </li>
            <li
                v-if="authStore.hasPermission('media-listening:read') || authStore.hasPermission('media-listening:manage-settings')">
                <a class="nav-link" data-bs-toggle="collapse" href="#mediaSubmenu" role="button" aria-expanded="false"
                    aria-controls="mediaSubmenu">
                    <i class="bi bi-broadcast me-2"></i> Escucha a Medios
                    <i class="bi bi-chevron-down ms-auto" style="font-size: 0.8rem;"></i>
                </a>
                <div class="collapse" id="mediaSubmenu">
                    <ul class="nav flex-column ms-3">
                        <li class="nav-item" v-if="authStore.hasPermission('media-listening:read')">
                            <RouterLink to="/media-listening/inbox" class="nav-link py-1 text-white-50"
                                active-class="text-white" @click="linkClicked">
                                <small>Buzón de Entrada</small>
                            </RouterLink>
                        </li>

                        <!-- Configuración Submenu -->
                        <li class="nav-item" v-if="authStore.hasPermission('media-listening:manage-settings')">
                            <a class="nav-link py-1 text-white-50" data-bs-toggle="collapse" href="#mediaConfigSubmenu"
                                role="button" aria-expanded="false" aria-controls="mediaConfigSubmenu">
                                <small>Configuración <i class="bi bi-chevron-down ms-1"
                                        style="font-size: 0.7rem;"></i></small>
                            </a>
                            <div class="collapse" id="mediaConfigSubmenu">
                                <ul class="nav flex-column ms-3">
                                    <li class="nav-item">
                                        <RouterLink to="/media-listening/catalog" class="nav-link py-1 text-white-50"
                                            active-class="text-white" @click="linkClicked">
                                            <small>Catálogo de Medios</small>
                                        </RouterLink>
                                    </li>
                                    <li class="nav-item">
                                        <RouterLink to="/media-listening/settings" class="nav-link py-1 text-white-50"
                                            active-class="text-white" @click="linkClicked">
                                            <small>Parámetros</small>
                                        </RouterLink>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <li class="nav-item">
                            <a href="/medios/participacion" target="_blank" class="nav-link py-1 text-white-50"
                                @click="linkClicked">
                                <small>Formulario Público <i class="bi bi-box-arrow-up-right ms-1"
                                        style="font-size: 0.7rem;"></i></small>
                            </a>
                        </li>
                    </ul>
                </div>
            </li>
            <li v-if="authStore.hasPermission('external-reports:read')">
                <RouterLink to="/external-reports" class="nav-link" active-class="active" @click="linkClicked">
                    <i class="bi bi-terminal-fill me-2"></i> Herramientas Remotas
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