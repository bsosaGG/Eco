import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const routes = [
    {
        path: '/impresiones/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/impresiones',
        component: () => import('../layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('../views/Dashboard.vue'),
                meta: { permission: 'impresiones:read' }
            },
            {
                path: 'generar',
                name: 'GenerarImpresion',
                component: () => import('../views/GenerarImpresion.vue'),
                meta: { permission: 'impresiones:create' }
            },
            {
                path: 'plantillas',
                name: 'ConfigurarPlantillas',
                component: () => import('../views/ConfigurarPlantillas.vue'),
                meta: { permission: 'impresiones:config' }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/impresiones'
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;

    // Verificar si la ruta requiere estar desautenticado (ej. login)
    if (to.meta.requiresGuest && isAuthenticated) {
        return next('/impresiones');
    }

    // Verificar si la ruta requiere autenticación
    if (to.meta.requiresAuth && !isAuthenticated) {
        return next({ name: 'Login', query: { redirect: to.fullPath } });
    }

    // Verificar permisos específicos de la ruta
    if (to.meta.permission) {
        if (!authStore.hasPermission(to.meta.permission)) {
            // TODO: Redirigir a una página de "Acceso Denegado" o al dashboard
            return next('/impresiones');
        }
    }

    next();
});

export default router;
