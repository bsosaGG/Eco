// src/stores/pac.store.ts
import { defineStore } from 'pinia'
import router from '@/router'
import { pacService } from '@/services/pac.service'

// Opcional: Definir un tipo para el objeto de solicitud
interface PacRequest {
  id_solicitud: number
  codigo_solicitud: string
  descripcion: string
  unidad_solicitante: string
  monto_total: number
  estado: string
  estado_color: string
  modalidad_compra: string
  unidad_medida: string
  numero_renglon: number
  nombre_renglon: string
  historial: {
    fecha_cambio: string
    estado: string
    usuario_cambio: string
    comentario: string
  }[]
}

export const usePacStore = defineStore('pac', {
  state: () => ({
    requests: [] as PacRequest[],
    currentRequest: null as PacRequest | null, // Para guardar el item que se está editando
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchRequests(params = {}) {
      this.isLoading = true
      this.error = null
      try {
        const response = await pacService.getAll(params)
        this.requests = response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al obtener las solicitudes'
      } finally {
        this.isLoading = false
      }
    },

    async fetchRequestById(id: string) {
      this.isLoading = true
      this.currentRequest = null
      this.error = null
      try {
        const response = await pacService.getById(id)
        this.currentRequest = response.data
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al obtener la solicitud'
        router.push('/pac') // Si hay error (ej. no encontrado), volver al dashboard
      } finally {
        this.isLoading = false
      }
    },

    async createRequest(data: PacRequest) {
      this.isLoading = true
      this.error = null
      try {
        await pacService.create(data)
        router.push('/pac') // Redirigir al dashboard tras el éxito
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al crear la solicitud'
        throw error // Re-lanzar el error para que el componente lo pueda manejar
      } finally {
        this.isLoading = false
      }
    },

    async updateRequest(id: string, data: PacRequest) {
      this.isLoading = true
      this.error = null
      try {
        await pacService.update(id, data)
        router.push('/pac') // Redirigir al dashboard tras el éxito
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al actualizar la solicitud'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async changeRequestStatus(id: string, data: { nuevoEstadoId: number; comentario?: string }) {
      this.isLoading = true
      this.error = null
      try {
        await pacService.changeStatus(id, data)
        // Después de cambiar el estado, volvemos a cargar los datos para ver el historial actualizado
        await this.fetchRequestById(id)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al cambiar el estado'
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})
