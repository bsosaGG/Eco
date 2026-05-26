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

    // --- GETTERS PARA PERFILES (ACCESO A MÓDULOS) ---
    hasAnyAgendaPermission: (state): boolean => {
      if (state.user?.role === 'admin') return true
      return ['agendas:read', 'agendas:create', 'agendas:view-all'].some((p) =>
        state.user?.permissions?.includes(p),
      )
    },
    hasAnyJuridicaPermission: (state): boolean => {
      if (state.user?.role === 'admin') return true
      return [
        'juridica:read',
        'juridica:create',
        'juridica:update-case',
        'juridica:manage-financials',
        'juridica:audit',
        'juridica:generate-doc',
        'juridica:config',
      ].some((p) => state.user?.permissions?.includes(p))
    },
    hasAnyImpresionesPermission: (state): boolean => {
      if (state.user?.role === 'admin') return true
      return ['impresiones:read', 'impresiones:create', 'impresiones:config'].some((p) =>
        state.user?.permissions?.includes(p),
      )
    },
    hasAnyCorrespondenciaPermission: (state): boolean => {
      if (state.user?.role === 'admin') return true
      return ['correspondencia:read', 'correspondencia:create', 'correspondencia:config'].some(
        (p) => state.user?.permissions?.includes(p),
      )
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

        // Redirección basada en permisos (Requerimiento específico)
        const hasAgendaPermission = this.hasAnyAgendaPermission
        const hasJuridicaPermission = this.hasAnyJuridicaPermission
        const hasImpresionesPermission = this.hasAnyImpresionesPermission
        const hasCorrespondenciaPermission = this.hasAnyCorrespondenciaPermission

        const profilesCount = [
          hasAgendaPermission,
          hasJuridicaPermission,
          hasImpresionesPermission,
          hasCorrespondenciaPermission,
        ].filter(Boolean).length

        if (profilesCount > 1) {
          router.push('/')
        } else if (hasAgendaPermission) {
          router.push('/agendas/entry')
        } else if (hasJuridicaPermission) {
          window.location.href = '/juridica/dashboard'
        } else if (hasImpresionesPermission) {
          window.location.href = '/impresiones/generar'
        } else if (hasCorrespondenciaPermission) {
          window.location.href = '/correspondencia/generar'
        } else {
          router.push('/')
        }
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

    async register(userData: any) {
      try {
        await apiClient.post('/auth/signup', userData)
      } catch (error) {
        throw error
      }
    },

    async forgotPassword(email: string) {
      try {
        await apiClient.post('/auth/forgot-password', { email })
      } catch (error) {
        throw error
      }
    },

    async resetPassword(token: string, password: string, confirmPassword: string) {
      try {
        await apiClient.post(`/auth/reset-password/${token}`, {
          password,
          confirm_password: confirmPassword,
        })
      } catch (error) {
        throw error
      }
    },
  },
})
