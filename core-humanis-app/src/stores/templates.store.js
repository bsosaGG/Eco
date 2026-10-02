import { defineStore } from 'pinia';
import api from '../api/client';

export const useTemplatesStore = defineStore('templates', {
  state: () => ({
    templates: [],
    currentTemplate: null,
    loading: false,
    error: null,
    successMessage: null
  }),

  actions: {
    async fetchTemplates() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/templates');
        this.templates = response.data.data || [];
        return this.templates;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar el catálogo de plantillas';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async downloadDocx(templateCode) {
      try {
        const response = await api.get(`/templates/${templateCode}/download`, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `plantilla_${templateCode.toLowerCase()}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al descargar la plantilla DOCX';
        throw err;
      }
    },

    async updateTemplate(templateCode, payload) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      try {
        const response = await api.put(`/templates/${templateCode}`, payload);
        this.successMessage = response.data.message || 'Información de la plantilla actualizada correctamente';
        await this.fetchTemplates();
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al actualizar información de la plantilla';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async uploadDocx(templateCode, file) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('template', file);

        const response = await api.post(`/templates/${templateCode}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        this.successMessage = response.data.message || 'Plantilla actualizada correctamente';
        await this.fetchTemplates();
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al subir la nueva plantilla DOCX';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async renderTemplate(templateCode, format = 'pdf', variables = {}) {
      try {
        const response = await api.post(`/templates/${templateCode}/render?format=${format}`, {
          data: variables,
          variables
        }, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], {
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Documento_${templateCode}_${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al renderizar el documento';
        throw err;
      }
    }
  }
});
