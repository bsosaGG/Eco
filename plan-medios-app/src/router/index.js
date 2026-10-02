import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import authService from '../services/auth.service';

const routes = [
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: { name: 'Expedientes' } },
            {
                path: 'expedientes',
                name: 'Expedientes',
                component: () => import('../views/ExpedientesView.vue'),
                meta: { title: 'Expedientes', permission: 'plan-medios:read' },
            },
            {
                path: 'expedientes/nuevo',
                name: 'ExpedienteCreate',
                component: () => import('../views/ExpedienteCreateView.vue'),
                meta: { title: 'Nuevo Expediente', permission: 'plan-medios:create' },
            },
            {
                path: 'expedientes/:id',
                name: 'ExpedienteDetail',
                component: () => import('../views/ExpedienteDetailView.vue'),
                meta: { title: 'Plan de Medios', permission: 'plan-medios:read' },
            },
            {
                path: 'expedientes/:id/auditoria',
                name: 'ExpedienteAudit',
                component: () => import('../views/ExpedienteAuditView.vue'),
                meta: { title: 'Auditoría de Selecciones', permission: 'plan-medios:read' },
            },
        ],
    },
    // Cualquier otra ruta vuelve al listado.
    { path: '/:pathMatch(.*)*', redirect: { name: 'Expedientes' } },
];

const router = createRouter({
    history: createWebHistory('/plan-medios/'),
    routes,
});

router.beforeEach((to, from, next) => {
    // El inicio de sesión es el del core (admin-panel): sin sesión válida se envía allí.
    if (to.matched.some((record) => record.meta.requiresAuth) && !authService.isAuthenticated()) {
        window.location.href = '/login';
        return next(false);
    }

    // Además de estar autenticado, cada pantalla exige su permiso (plan-medios:read/create/...).
    if (to.meta.permission && !authService.hasPermission(to.meta.permission)) {
        console.warn(`Acceso denegado. Se requiere el permiso: ${to.meta.permission}`);
        if (to.name !== 'Expedientes' && authService.hasPermission('plan-medios:read')) return next({ name: 'Expedientes' });
        window.location.href = '/';
        return next(false);
    }

    next();
});

export default router;
