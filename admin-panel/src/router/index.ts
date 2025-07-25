import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import MainLayout from '@/layouts/MainLayout.vue' // <-- Importa el Layout

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      // Ruta padre que usa el MainLayout
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true }, // Proteger todo el grupo
      children: [
        {
          path: '', // La ruta raíz '/'
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UsersView.vue'),
        },
        {
          path: 'profiles',
          name: 'profiles',
          component: () => import('../views/ProfilesView.vue'), // Crea este archivo
        },
      ],
    },
  ],
})

// Tu guardián de navegación global no necesita cambios
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
