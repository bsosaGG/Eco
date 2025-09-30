// admin-panel\src\stores\permissions.store.ts

import { defineStore } from 'pinia'
import apiClient from '@/services/api.service'

// Configura la URL base de tu API
const API_URL = '/permissions'

export const usePermissionsStore = defineStore('permissions', {
  state: () => ({
    permissions: [] as any[],
    isLoading: false,
  }),

  actions: {
    async fetchPermissions() {
      this.isLoading = true
      try {
        const { data } = await apiClient.get(API_URL)
        this.permissions = data
      } catch (error) {
        console.error('Error al obtener los permisos:', error)
        // Aquí podrías manejar el error, por ejemplo, con notificaciones
      } finally {
        this.isLoading = false
      }
    },

    async createPermission(permissionData: any) {
      try {
        const { data } = await apiClient.post(API_URL, permissionData)
        this.permissions.push(data)
      } catch (error) {
        console.error('Error al crear el permiso:', error)
      }
    },

    async updatePermission(id: number, permissionData: any) {
      try {
        const { data } = await apiClient.put(`${API_URL}/${id}`, permissionData)
        const index = this.permissions.findIndex((p) => p.id_permiso === id)
        if (index !== -1) {
          this.permissions[index] = data
        }
      } catch (error) {
        console.error('Error al actualizar el permiso:', error)
      }
    },

    async deletePermission(id: number) {
      try {
        await apiClient.delete(`${API_URL}/${id}`)
        this.permissions = this.permissions.filter((p) => p.id_permiso !== id)
      } catch (error) {
        console.error('Error al eliminar el permiso:', error)
      }
    },
  },
})
