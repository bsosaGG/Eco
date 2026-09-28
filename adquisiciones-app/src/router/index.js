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
            {
                path: 'reportes/cotizaciones',
                name: 'ReporteCotizaciones',
                component: () => import('../views/ReporteCotizacionesView.vue'),
                meta: { title: 'Todas las Cotizaciones' },
            },
            {
                path: 'reportes/cdp-oc',
                name: 'ReporteCdpOc',
                component: () => import('../views/ReporteCdpOcView.vue'),
                meta: { title: 'CDP y Órdenes de Compra' },
            },
            {
                path: 'reportes/financiera',
                name: 'ReporteFinanciera',
                component: () => import('../views/ReporteFinancieraView.vue'),
                meta: { title: 'Fase Financiera' },
            },
            {
                path: 'reportes/resumen',
                name: 'ReporteResumen',
                component: () => import('../views/ReporteResumenView.vue'),
                meta: { title: 'Resumen General' },
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
        next({ name: 'Login', query: { redirect: to.fullPath } });
    } else if (to.name === 'Login' && isAuth) {
        next({ name: 'Dashboard' });
    } else {
        next();
    }
});

export default router;
