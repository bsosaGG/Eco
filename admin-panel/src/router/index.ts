// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: () => import('../views/HomeView.vue') },
        { path: 'users', name: 'users', component: () => import('../views/UsersView.vue') },
        {
          path: 'profiles',
          name: 'profiles',
          component: () => import('../views/ProfilesView.vue'),
        },
        {
          path: '/permissions',
          name: 'permissions',
          component: () => import('../views/PermissionsView.vue'),
          // meta: { requiresAuth: true, requiresAdmin: true } // si tienes guardias de ruta
        },
        // --- AÑADIR NUEVAS RUTAS DEL PAC AQUÍ ---
        {
          path: 'pac',
          name: 'pac-dashboard',
          component: () => import('../views/pac/PacDashboard.vue'),
          meta: { permission: 'pac-item:read' }, // Permiso específico requerido
        },
        {
          path: 'pac/create',
          name: 'pac-create',
          component: () => import('@/views/pac/PacForm.vue'),
          meta: { permission: 'pac-item:create' },
        },
        {
          path: 'pac/edit/:id', // Ruta para editar
          name: 'pac-edit',
          component: () => import('@/views/pac/PacForm.vue'),
          meta: { permission: 'pac-item:update' },
        },
        {
          path: 'pac/detail/:id', // La ruta de detalle que crearemos después
          name: 'pac-detail',
          component: () => import('@/views/pac/PacDetail.vue'), // Crea este archivo
          meta: { permission: 'pac-item:read' },
        },
        {
          path: 'pac/reports',
          name: 'pac-reports',
          component: () => import('@/views/pac/PacReports.vue'),
          meta: { permission: 'pac-reports:read' },
        },
        {
          path: 'cloudflare-requests',
          name: 'cloudflare-requests',
          component: () => import('../views/CloudflareRequestsView.vue'),
          meta: { permission: 'cloudflare-requests:read' },
        },
        {
          path: 'monitoring',
          name: 'monitoring-dashboard',
          component: () => import('@/views/monitoring/MonitoringDashboard.vue'),
          meta: { permission: 'monitoring:read' },
        },
        {
          path: 'monitoring/config',
          name: 'monitoring-config',
          component: () => import('@/views/monitoring/MonitoringConfig.vue'),
          meta: { permission: 'monitoring:update' },
        },
        {
          path: 'monitoring/analysis',
          name: 'monitoring-analysis',
          component: () => import('@/views/monitoring/MonitoringAnalysisView.vue'),
          meta: { permission: 'monitoring:read' },
        },
        {
          path: 'external-reports',
          name: 'external-reports',
          component: () => import('@/views/ExternalReportsView.vue'),
          meta: { permission: 'external-reports:read' },
        },
        {
          path: '/documentos',
          name: 'documentos',
          component: () => import('../views/documentos/DocumentosView.vue'),
          meta: { permission: 'documentos-plantilla:read' },
        },
        // --- AGENDAS MINISTERIALES ---
        {
          path: 'agendas',
          component: () => import('../views/agendas/AgendasLayout.vue'),
          redirect: { name: 'agendas-entry' },
          children: [
            {
              path: 'entry',
              name: 'agendas-entry',
              component: () => import('../views/agendas/MinisterioFormView.vue'),
              meta: { permission: 'agendas:create' }
            },
            {
              path: 'matrix',
              name: 'agendas-matrix',
              component: () => import('../views/agendas/MatrixDashboardView.vue'),
              meta: { permission: 'agendas:view-all' }
            },
            {
              path: 'monthly',
              name: 'agendas-monthly',
              component: () => import('../views/agendas/MonthlyAdminView.vue'),
              meta: { permission: 'agendas:create' }
            },
            // --- Admin Configuration Routes ---
            {
              path: 'admin/institutions',
              name: 'agendas-institutions',
              component: () => import('../views/agendas/admin/InstitutionsAdminView.vue'),
              meta: { permission: 'agendas:view-all' }
            },
            {
              path: 'admin/assignments',
              name: 'agendas-assignments',
              component: () => import('../views/agendas/admin/AssignmentsAdminView.vue'),
              meta: { permission: 'agendas:view-all' }
            },
            {
              path: 'admin/item-types',
              name: 'agendas-item-types',
              component: () => import('../views/agendas/admin/ItemTypesAdminView.vue'),
              meta: { permission: 'agendas:view-all' }
            }
          ]
        },

        // --- ESCUCHA A MEDIOS ---
        {
          path: '/media-listening',
          name: 'media-listening',
          redirect: { name: 'media-inbox' },
          children: [
            {
              path: 'inbox',
              name: 'media-inbox',
              component: () => import('../views/media/MediaAdminView.vue'),
              meta: { permission: 'media-listening:read' }
            },
            {
              path: 'catalog',
              name: 'media-catalog',
              component: () => import('../views/media/MediaCatalogView.vue'),
              meta: { permission: 'media-listening:manage-settings' }
            },
            {
              path: 'settings',
              name: 'media-settings',
              component: () => import('../views/media/MediaSettingsView.vue'),
              meta: { permission: 'media-listening:manage-settings' }
            }
          ]
        },
      ],
    },
    {
      path: '/medios/participacion',
      name: 'media-participation',
      component: () => import('../views/media/MediaParticipationView.vue'),
    },
  ],
})

// --- GUARDIÁN DE NAVEGACIÓN MEJORADO ---
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Si la ruta requiere autenticación y el usuario no está logueado
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // Si la ruta requiere un permiso específico
  if (to.meta.permission && !authStore.hasPermission(to.meta.permission as string)) {
    // Redirigir a una página de "Acceso Denegado" o a la home
    // Por ahora, lo enviaremos a la home.
    console.warn(`Acceso denegado. Se requiere el permiso: ${to.meta.permission}`)
    return next({ name: 'home' })
  }

  next()
})

export default router
