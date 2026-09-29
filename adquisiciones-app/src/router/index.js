import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import authService from '../services/auth.service';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
        meta: { title: 'Iniciar Sesión' },
    },
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
                meta: { title: 'Nueva Solicitud de Compra', permission: 'adquisiciones:create' },
            },
            {
                path: 'expedientes/:id',
                name: 'ExpedienteDetail',
                component: () => import('../views/ExpedienteDetail.vue'),
                meta: { title: 'Detalle del Expediente', permission: 'adquisiciones:read' },
            },
            {
                path: 'proveedores',
                name: 'Proveedores',
                component: () => import('../views/ProveedoresView.vue'),
                meta: { title: 'Proveedores', permission: 'adquisiciones:config' },
            },
            {
                path: 'unidades',
                name: 'Unidades',
                component: () => import('../views/UnidadesView.vue'),
                meta: { title: 'Unidades Solicitantes', permission: 'adquisiciones:config' },
            },
            {
                path: 'reportes/cotizaciones',
                name: 'ReporteCotizaciones',
                component: () => import('../views/ReporteCotizacionesView.vue'),
                meta: { title: 'Todas las Cotizaciones', permission: 'adquisiciones:read' },
            },
            {
                path: 'reportes/cdp-oc',
                name: 'ReporteCdpOc',
                component: () => import('../views/ReporteCdpOcView.vue'),
                meta: { title: 'CDP y Órdenes de Compra', permission: 'adquisiciones:read' },
            },
            {
                path: 'reportes/financiera',
                name: 'ReporteFinanciera',
                component: () => import('../views/ReporteFinancieraView.vue'),
                meta: { title: 'Fase Financiera', permission: 'adquisiciones:read' },
            },
            {
                path: 'reportes/resumen',
                name: 'ReporteResumen',
                component: () => import('../views/ReporteResumenView.vue'),
                meta: { title: 'Resumen General', permission: 'adquisiciones:read' },
            },
            {
                path: 'reportes/registro/:tipo/:id',
                name: 'ReporteRegistroDetalle',
                component: () => import('../views/ReporteRegistroDetalleView.vue'),
                meta: { title: 'Detalle del Registro', permission: 'adquisiciones:read' },
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
        return next({ name: 'Login', query: { redirect: to.fullPath } });
    }

    if (to.name === 'Login' && isAuth) {
        return next({ name: 'Dashboard' });
    }

    // Además de estar autenticado, la ruta puede exigir un permiso puntual
    // (adquisiciones:read/create/config, etc.). Si no lo tiene, no la deja ver.
    if (to.meta.permission && !authService.hasPermission(to.meta.permission)) {
        console.warn(`Acceso denegado. Se requiere el permiso: ${to.meta.permission}`);
        return next({ name: 'Dashboard' });
    }

    next();
});

export default router;
