import { defineStore } from 'pinia'
import apiClient from '@/services/api.service'

// 1. Definimos las interfaces TypeScript para nuestros datos
export interface Plantilla {
  id_plantilla: number
  nombre: string
  descripcion?: string
  nombre_archivo_original: string
  tamano_archivo: number
  fecha_creacion: string
}

interface DocumentosState {
  plantillas: Plantilla[]
  isLoading: boolean
  error: string | null
}

export const useDocumentosStore = defineStore('documentos', {
  // 2. Estado inicial del store
  state: (): DocumentosState => ({
    plantillas: [],
    isLoading: false,
    error: null,
  }),

  // 3. Acciones que llaman a nuestra API
  actions: {
    async fetchPlantillas() {
      this.isLoading = true
      this.error = null
      try {
        const response = await apiClient.get<Plantilla[]>('/documentos/plantillas')
        this.plantillas = response.data
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al cargar las plantillas.'
        // Devolvemos el error por si el componente necesita reaccionar
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async addPlantilla(formData: FormData) {
      this.isLoading = true
      this.error = null
      try {
        // Para subir archivos, es crucial usar FormData y la cabecera 'multipart/form-data'
        const response = await apiClient.post<Plantilla>('/documentos/plantillas', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        this.plantillas.push(response.data)
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al añadir la plantilla.'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async updatePlantilla(plantillaId: number, data: { nombre: string; descripcion?: string }) {
      this.isLoading = true
      this.error = null
      try {
        const response = await apiClient.put<Plantilla>(
          `/documentos/plantillas/${plantillaId}`,
          data,
        )
        const index = this.plantillas.findIndex((p) => p.id_plantilla === plantillaId)
        if (index !== -1) {
          this.plantillas[index] = { ...this.plantillas[index], ...response.data }
        }
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al actualizar la plantilla.'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async deletePlantilla(plantillaId: number) {
      this.isLoading = true
      this.error = null
      try {
        await apiClient.delete(`/documentos/plantillas/${plantillaId}`)
        this.plantillas = this.plantillas.filter((p) => p.id_plantilla !== plantillaId)
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Error al eliminar la plantilla.'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async generateDocumento(plantillaId: number, datos: object) {
      // No manejamos isLoading/error globalmente, es una acción única.
      try {
        const response = await apiClient.post(
          `/documentos/plantillas/${plantillaId}/generar`,
          { datos },
          {
            responseType: 'blob', // ¡Muy importante! Le decimos a Axios que espere datos binarios (un archivo)
          },
        )

        // El nombre del archivo viene en la cabecera 'Content-Disposition'
        const contentDisposition = response.headers['content-disposition']
        let filename = 'documento.docx' // Fallback
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
          if (filenameMatch.length > 1) {
            filename = filenameMatch[1]
          }
        }

        // Creamos una URL temporal para el blob y la devolvemos para la descarga
        const url = window.URL.createObjectURL(new Blob([response.data]))
        return { url, filename }
      } catch (err: any) {
        // Si el error es un blob, puede contener un mensaje JSON de error de la API
        if (err.response && err.response.data instanceof Blob) {
          const errorJson = await err.response.data.text()
          const errorObj = JSON.parse(errorJson)
          throw new Error(errorObj.message || 'Error al generar el documento.')
        }
        throw new Error(err.response?.data?.message || 'Error desconocido al generar el documento.')
      }
    },
  },
})
