import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import MainLayout from '../layouts/MainLayout.vue';
import authService from '../services/auth.service';

const routes = [
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: 'Tablero de Control' }
            },
            {
                path: 'cases/:id',
                name: 'CaseDetail',
                component: () => import('../views/CaseDetail.vue'),
                meta: { title: 'Detalle del Caso' }
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
    history: createWebHistory('/juridica/'),
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
