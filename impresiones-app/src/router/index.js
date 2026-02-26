import { createRouter, createWebHistory } from 'vue-router';
import authService from '../services/auth.service';

const routes = [
    {
        path: '/',
        component: () => import('../layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/generar'
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('../views/Dashboard.vue'),
                meta: { title: 'Dashboard' }
            },
            {
                path: 'generar',
                name: 'GenerarImpresion',
                component: () => import('../views/GenerarImpresion.vue'),
                meta: { title: 'Emisión y Recepción' }
            },
            {
                path: 'plantillas',
                name: 'ConfigurarPlantillas',
                component: () => import('../views/ConfigurarPlantillas.vue'),
                meta: { title: 'Gestión de Plantillas' }
            }
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue')
    }
];

const router = createRouter({
    history: createWebHistory('/impresiones/'),
    routes,
});

router.beforeEach((to, from, next) => {
    const isAuth = authService.isAuthenticated();
    if (to.meta.requiresAuth && !isAuth) {
        next({ name: 'Login' });
    } else {
        next();
    }
});

export default router;
