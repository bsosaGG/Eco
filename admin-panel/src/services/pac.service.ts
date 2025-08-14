// src/services/pac.service.ts
import apiClient from './api.service'

// Definimos un tipo para los parámetros de filtro para mayor claridad
interface PacRequestParams {
  limit?: number
  offset?: number
  unidad?: number
  estado?: number
  search?: string
}

export const pacService = {
  getAll(params: PacRequestParams) {
    return apiClient.get('/pac', { params })
  },

  getById(id: string) {
    const encodedId = encodeURIComponent(id) // Codificamos el ID aquí
    return apiClient.get(`/pac/${encodedId}`)
  },

  create(data: any) {
    return apiClient.post('/pac', data)
  },

  update(id: string, data: any) {
    const encodedId = encodeURIComponent(id)
    return apiClient.put(`/pac/${encodedId}`, data)
  },

  changeStatus(id: string, data: { nuevoEstadoId: number; comentario?: string }) {
    const encodedId = encodeURIComponent(id)
    return apiClient.post(`/pac/${encodedId}/estado`, data)
  },
}
