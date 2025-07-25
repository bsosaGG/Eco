import { defineStore } from 'pinia'
import apiClient from '@/services/api.service'

// Definimos interfaces para mayor claridad
interface IPermission {
  id_permiso: number
  clave_permiso: string
}

interface IProfile {
  id_perfil: number
  nombre_perfil: string
  descripcion: string
  permisos: IPermission[]
}

export const useProfilesStore = defineStore('profiles', {
  state: () => ({
    profiles: [] as IProfile[],
    permissions: [] as IPermission[],
    isLoading: false,
  }),
  actions: {
    async fetchData() {
      this.isLoading = true
      try {
        // Hacemos ambas llamadas en paralelo para mayor eficiencia
        const [profilesRes, permissionsRes] = await Promise.all([
          apiClient.get<IProfile[]>('/profiles'),
          apiClient.get<IPermission[]>('/profiles/permissions'),
        ])
        this.profiles = profilesRes.data
        this.permissions = permissionsRes.data
      } catch (error) {
        console.error('Error al cargar datos de perfiles', error)
      } finally {
        this.isLoading = false
      }
    },
    async createProfile(data: {
      nombre_perfil: string
      descripcion: string
      permissionIds: number[]
    }) {
      await apiClient.post('/profiles', data)
      await this.fetchData() // Recargamos todo para mantener la consistencia
    },
    async updateProfile(
      id: number,
      data: { nombre_perfil: string; descripcion: string; permissionIds: number[] },
    ) {
      await apiClient.put(`/profiles/${id}`, data)
      await this.fetchData()
    },
    async deleteProfile(id: number) {
      await apiClient.delete(`/profiles/${id}`)
      // Eliminamos el perfil de la lista local para una UI más rápida
      this.profiles = this.profiles.filter((p) => p.id_perfil !== id)
    },
  },
})
