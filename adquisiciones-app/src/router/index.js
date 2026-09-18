import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import authService from '../services/auth.service';

// El login vive únicamente en el admin-panel (repo main, http://localhost:8080/login).
// Este módulo no tiene pantalla de login propia: si no hay sesión válida,
// se manda al usuario ahí con un full page redirect (no navegación interna del router,
// porque /login no es una ruta de esta app, vive en otro contenedor/app detrás de nginx).

const routes = [
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: { name: 'Dashboard' },
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('../views/Dashboard.vue'),
                meta: { title: 'Bandeja de Expedientes' },
            },
            {
                path: 'expedientes/nuevo',
                name: 'ExpedienteCreate',
                component: () => import('../views/ExpedienteCreate.vue'),
                meta: { title: 'Nueva Solicitud de Compra' },
            },
            {
                path: 'expedientes/:id',
                name: 'ExpedienteDetail',
                component: () => import('../views/ExpedienteDetail.vue'),
                meta: { title: 'Detalle del Expediente' },
            },
            {
                path: 'proveedores',
                name: 'Proveedores',
                component: () => import('../views/ProveedoresView.vue'),
                meta: { title: 'Proveedores' },
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory('/adquisiciones/'),
    routes,
});

router.beforeEach((to, from, next) => {
    const isAuth = authService.isAuthenticated();
    if (to.meta.requiresAuth && !isAuth) {
        window.location.href = '/login';
        next(false);
    } else {
        next();
    }
});

export default router;
