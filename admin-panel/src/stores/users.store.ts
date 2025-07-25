import { defineStore } from 'pinia'
import apiClient from '@/services/api.service'
import type { IUser } from '@/types/user.interface' // Crearemos esta interfaz

export const useUsersStore = defineStore('users', {
  state: () => ({
    users: [] as IUser[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    /**
     * Obtiene todos los usuarios de la API y los guarda en el estado.
     */
    async fetchAllUsers() {
      this.isLoading = true
      this.error = null
      try {
        const response = await apiClient.get<IUser[]>('/user/')
        this.users = response.data
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al obtener los usuarios.'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Obtiene los datos completos de un solo usuario, incluyendo sus accesos.
     */
    async fetchUserById(userId: number): Promise<IUser | null> {
      this.isLoading = true
      this.error = null
      try {
        const response = await apiClient.get<IUser>(`/user/${userId}`)
        return response.data
      } catch (err: any) {
        this.error = `Error al obtener el usuario ${userId}.`
        return null
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Crea un nuevo usuario y lo añade a la lista local para una UI reactiva.
     */
    async createUser(userData: Omit<IUser, 'id_usuario'>) {
      try {
        const response = await apiClient.post<IUser>('/user/', userData)
        // Añade el nuevo usuario al principio de la lista para verlo inmediatamente
        this.users.unshift(response.data)
      } catch (err: any) {
        console.error('Error al crear usuario:', err)
        throw err // Lanza el error para que el componente lo maneje
      }
    },

    /**
     * Actualiza un usuario y modifica la lista local.
     */
    async updateUser(userId: number, userData: Partial<IUser>) {
      try {
        const response = await apiClient.put<IUser>(`/user/${userId}`, userData)
        const index = this.users.findIndex((u) => u.id_usuario === userId)
        if (index !== -1) {
          // Actualiza el usuario en la lista local con la respuesta de la API
          this.users[index] = response.data
        }
      } catch (err: any) {
        console.error('Error al actualizar usuario:', err)
        throw err
      }
    },

    /**
     * Desactiva un usuario y actualiza su estado en la lista local.
     */
    async deleteUser(userId: number) {
      try {
        await apiClient.delete(`/user/${userId}`)
        const user = this.users.find((u) => u.id_usuario === userId)
        if (user) {
          // En lugar de eliminarlo, reflejamos el borrado lógico
          user.activo = false
        }
      } catch (err: any) {
        console.error('Error al eliminar usuario:', err)
        throw err
      }
    },

    async updateUserAccess(
      userId: number,
      accessData: { profileIds: number[]; directPermissionIds: number[] },
    ) {
      try {
        await apiClient.put(`/user/${userId}/access`, accessData)
        // Opcional: recargar los datos del usuario para mantener la consistencia
        await this.fetchAllUsers()
      } catch (err: any) {
        console.error('Error al actualizar accesos:', err)
        throw err
      }
    },

    async resetPassword(userId: number, newPassword: string) {
      try {
        await apiClient.post(`/user/${userId}/reset-password`, { newPassword })
      } catch (err: any) {
        console.error('Error al restablecer contraseña:', err)
        throw err
      }
    },
  },
})
