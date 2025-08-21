// admin-panel/src/services/cloudflare.service.ts

import apiClient from './api.service'

class CloudflareService {
  /**
   * Solicita la generación del reporte de Cloudflare al backend.
   * @param zoneTags - Un array de strings con los Zone Tags a analizar.
   * @returns El archivo del reporte como un Blob.
   */
  async generateReport(zoneTags: string[]): Promise<Blob> {
    try {
      const response = await apiClient.post(
        '/cloudflare/report',
        { zoneTags },
        {
          // ¡Importante! Indicar que la respuesta esperada es un 'blob' (un archivo).
          responseType: 'blob',
        },
      )
      return response.data
    } catch (error) {
      console.error('Error al generar el reporte:', error)
      throw error
    }
  }
}

export default new CloudflareService()
