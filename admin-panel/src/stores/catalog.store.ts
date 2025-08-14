// src/stores/catalog.store.ts
import { defineStore } from 'pinia'
import apiClient from '@/services/api.service'

interface CatalogItem {
  value: number
  text: string
}

export const useCatalogStore = defineStore('catalogs', {
  state: () => ({
    unidades: [] as CatalogItem[],
    modalidades: [] as CatalogItem[],
    renglones: [] as CatalogItem[],
    estados: [] as CatalogItem[],
    isLoading: false,
  }),
  actions: {
    async fetchAllCatalogs() {
      if (this.unidades.length > 0) return // No volver a cargar si ya los tenemos
      this.isLoading = true
      try {
        const [unidades, modalidades, renglones, estados] = await Promise.all([
          apiClient.get('/pac/catalogs/unidades'),
          apiClient.get('/pac/catalogs/modalidades'),
          apiClient.get('/pac/catalogs/renglones'),
          apiClient.get('/pac/catalogs/estados'),
        ])
        this.unidades = unidades.data
        this.modalidades = modalidades.data
        this.renglones = renglones.data
        this.estados = estados.data
      } catch (error) {
        console.error('Error al cargar los catálogos:', error)
      } finally {
        this.isLoading = false
      }
    },
  },
})
