// src/stores/auth.store.ts

import { defineStore } from 'pinia'
import apiClient from '@/services/api.service'
import router from '@/router'

// Definimos un tipo para el objeto de usuario para mayor claridad
interface User {
  id: number
  email: string
  role: string
  name: string
  foto_perfil_url?: string
  permissions: string[] // <-- AÑADIMOS EL ARRAY DE PERMISOS
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',

    // --- GETTER PARA VERIFICAR PERMISOS ---
    hasPermission: (state) => {
      return (requiredPermission: string): boolean => {
        if (!state.user || !state.user.permissions) {
          return false
        }
        // Un admin siempre tiene todos los permisos
        if (state.user.role === 'admin') {
          return true
        }
        return state.user.permissions.includes(requiredPermission)
      }
    },
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
