import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import authService from '../services/auth.service';
import { puedeVerTodo } from '../utils/visibilidad';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/auth/LoginView.vue'),
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
                component: () => import('../views/expedientes/DashboardView.vue'),
                meta: { title: 'Bandeja de Expedientes' },
            },
            {
                path: 'expedientes/nuevo',
                name: 'ExpedienteCreate',
                component: () => import('../views/expedientes/ExpedienteCreateView.vue'),
                meta: { title: 'Nueva Solicitud de Compra', permission: 'adquisiciones:create' },
            },
            {
                path: 'expedientes/:id',
                name: 'ExpedienteDetail',
                component: () => import('../views/expedientes/ExpedienteDetailView.vue'),
                meta: { title: 'Detalle del Expediente', permission: 'adquisiciones:read' },
            },
            {
                path: 'proveedores',
                name: 'Proveedores',
                component: () => import('../views/catalogos/ProveedoresView.vue'),
                meta: { title: 'Proveedores', permission: 'adquisiciones:config' },
            },
            {
                path: 'unidades',
                name: 'Unidades',
                component: () => import('../views/catalogos/UnidadesView.vue'),
                meta: { title: 'Unidades Solicitantes', permission: 'adquisiciones:config' },
            },
            {
                path: 'reportes/cotizaciones',
                name: 'ReporteCotizaciones',
                component: () => import('../views/reportes/ReporteCotizacionesView.vue'),
                meta: { title: 'Todas las Cotizaciones', permission: 'adquisiciones:read', requiresVerTodo: true },
            },
            {
                path: 'reportes/cdp-oc',
                name: 'ReporteCdpOc',
                component: () => import('../views/reportes/ReporteCdpOcView.vue'),
                meta: { title: 'CDP y Órdenes de Compra', permission: 'adquisiciones:read', requiresVerTodo: true },
            },
            {
                path: 'reportes/financiera',
                name: 'ReporteFinanciera',
                component: () => import('../views/reportes/ReporteFinancieraView.vue'),
                meta: { title: 'Fase Financiera', permission: 'adquisiciones:read', requiresVerTodo: true },
            },
            {
                path: 'reportes/resumen',
                name: 'ReporteResumen',
                component: () => import('../views/reportes/ReporteResumenView.vue'),
                meta: { title: 'Resumen General', permission: 'adquisiciones:read', requiresVerTodo: true },
            },
            {
                path: 'reportes/registro/:tipo/:id',
                name: 'ReporteRegistroDetalle',
                component: () => import('../views/reportes/ReporteRegistroDetalleView.vue'),
                meta: { title: 'Detalle del Registro', permission: 'adquisiciones:read', requiresVerTodo: true },
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

    // Los reportes de todo el módulo son solo para el personal de gestión (el API también lo exige).
    if (to.meta.requiresVerTodo && !puedeVerTodo()) {
        return next({ name: 'Dashboard' });
    }

    next();
});

export default router;
