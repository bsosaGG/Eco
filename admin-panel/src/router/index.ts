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
      ],
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
