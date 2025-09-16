import { defineStore } from 'pinia'
import apiClient from '@/services/api.service'

export interface Server {
  id_servidor: number
  nombre: string
  direccion_ip: string
  puerto_ssh: number
  usuario_ssh: string
  intervalo_verificacion_segundos: number
  ssh_key_passphrase?: string
  activo?: boolean
}
export interface Site {
  id_sitio_web: number
  nombre: string
  url: string
  intervalo_verificacion_segundos: number
  texto_a_verificar?: string
  id_servidor?: number | null
  activo?: boolean
}
export interface MonitoringConfig {
  alert_emails?: string
}

interface MonitoringState {
  servers: Server[]
  sites: Site[]
  config: MonitoringConfig
  isLoading: boolean
  error: string | null
}

export const useMonitoringStore = defineStore('monitoring', {
  state: (): MonitoringState => ({
    servers: [],
    sites: [],
    config: {},
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchDashboardData() {
      this.isLoading = true
      this.error = null
      try {
        const [serversResponse, sitesResponse] = await Promise.all([
          apiClient.get('/monitoring/servers'),
          apiClient.get('/monitoring/sites'),
        ])
        this.servers = serversResponse.data
        this.sites = sitesResponse.data
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al cargar los datos del dashboard.'
      } finally {
        this.isLoading = false
      }
    },
    async fetchConfig() {
      this.isLoading = true
      this.error = null
      try {
        const response = await apiClient.get('/monitoring/config')
        this.config = response.data
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al cargar la configuración.'
      } finally {
        this.isLoading = false
      }
    },
    async updateConfig(key: string, value: string) {
      this.isLoading = true
      this.error = null
      try {
        await apiClient.put('/monitoring/config', { key, value })
        if (key in this.config) {
          ;(this.config as any)[key] = value
        }
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al actualizar la configuración.'
        throw err
      } finally {
        this.isLoading = false
      }
    },
    async addServer(serverData: Omit<Server, 'id_servidor'>) {
      this.isLoading = true
      this.error = null
      try {
        const response = await apiClient.post('/monitoring/servers', serverData)
        this.servers.push(response.data.server)
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al añadir el servidor.'
        throw err
      } finally {
        this.isLoading = false
      }
    },
    async updateServer(serverId: number, serverData: Server) {
      this.isLoading = true
      this.error = null
      try {
        const response = await apiClient.put(`/monitoring/servers/${serverId}`, serverData)
        const index = this.servers.findIndex((s) => s.id_servidor === serverId)
        if (index !== -1) {
          this.servers[index] = response.data.server
        }
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al actualizar el servidor.'
        throw err
      } finally {
        this.isLoading = false
      }
    },
    async deleteServer(serverId: number) {
      this.isLoading = true
      this.error = null
      try {
        await apiClient.delete(`/monitoring/servers/${serverId}`)
        this.servers = this.servers.filter((s) => s.id_servidor !== serverId)
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al eliminar el servidor.'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async addSite(siteData: Omit<Site, 'id_sitio_web'>) {
      this.isLoading = true
      this.error = null
      try {
        const response = await apiClient.post('/monitoring/sites', siteData)
        this.sites.push(response.data.site)
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al añadir el sitio.'
        throw err
      } finally {
        this.isLoading = false
      }
    },
    async updateSite(siteId: number, siteData: Site) {
      this.isLoading = true
      this.error = null
      try {
        const response = await apiClient.put(`/monitoring/sites/${siteId}`, siteData)
        const index = this.sites.findIndex((s) => s.id_sitio_web === siteId)
        if (index !== -1) {
          this.sites[index] = response.data.site
        }
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al actualizar el sitio.'
        throw err
      } finally {
        this.isLoading = false
      }
    },
    async deleteSite(siteId: number) {
      this.isLoading = true
      this.error = null
      try {
        await apiClient.delete(`/monitoring/sites/${siteId}`)
        this.sites = this.sites.filter((s) => s.id_sitio_web !== siteId)
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al eliminar el sitio.'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    // --- NUEVAS ACCIONES PARA OBTENER DATOS HISTÓRICOS ---
    async fetchServerHistory(serverId: number, range: string) {
      // No gestionamos isLoading globalmente, ya que es para una vista específica.
      this.error = null
      try {
        const response = await apiClient.get(`/monitoring/servers/${serverId}/history`, {
          params: { range } // Así se añade ?range=24h a la URL
        })
        return response.data // Devolvemos los datos para que el componente los use
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al cargar el historial del servidor.'
        throw err // Lanzamos el error para que el componente sepa que algo falló
      }
    },

    async fetchSiteHistory(siteId: number, range: string) {
      this.error = null
      try {
        const response = await apiClient.get(`/monitoring/sites/${siteId}/history`, {
          params: { range }
        })
        return response.data
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al cargar el historial del sitio.'
        throw err
      }
    },
  },
})
