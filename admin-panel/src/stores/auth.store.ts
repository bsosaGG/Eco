import { defineStore } from 'pinia'
import apiClient from '@/services/api.service'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    // La siguiente línea es la que lee los datos viejos, por eso es importante limpiar localStorage una vez.
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,

    // Ahora comprueba 'rol' Y también 'role' para ser inmune a datos viejos o inconsistencias.
    isAdmin: (state) => state.user?.rol === 'admin' || state.user?.role === 'admin',
  },

  actions: {
    async login(email: string, password: string) {
      try {
        const response = await apiClient.post('/auth/login', { email, password })
        const { token, user } = response.data

        this.token = token
        this.user = user

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        router.push('/')
      } catch (error) {
        console.error('Error en el login:', error)
        throw error
      }
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    },
  },
})
