import { defineStore } from 'pinia';
import api from '../api/client';

export const useVacationsStore = defineStore('vacations', {
  state: () => ({
    balance: null,
    balances: [],
    requests: [],
    currentRequest: null,
    leaves: [],
    incidents: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchBalances(year = new Date().getFullYear()) {
      this.loading = true;
      try {
        const response = await api.get(`/vacations/balances?year=${year}`);
        this.balances = response.data.data || [];
        return this.balances;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al obtener saldos kardex';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchBalance(collaboratorId, year = new Date().getFullYear()) {
      this.loading = true;
      try {
        const response = await api.get(`/vacations/balances/${collaboratorId}?year=${year}`);
        this.balance = response.data.data;
        return this.balance;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al obtener el saldo de vacaciones';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchRequests(filters = {}) {
      this.loading = true;
      try {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/vacations/requests${params ? `?${params}` : ''}`);
        this.requests = response.data.data;
        return this.requests;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al listar las solicitudes de vacaciones';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchRequestDetail(id) {
      this.loading = true;
      try {
        const response = await api.get(`/vacations/requests/${id}`);
        this.currentRequest = response.data.data;
        return this.currentRequest;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al obtener el detalle de la solicitud';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async printRequest(id, format = 'pdf') {
      try {
        const response = await api.get(`/vacations/requests/${id}/print?format=${format}`, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], {
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Boleta_Vacaciones_${id}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al generar documento de impresión';
        throw err;
      }
    },

    async createRequest(payload) {
      this.loading = true;
      try {
        const response = await api.post('/vacations/requests', payload);
        await this.fetchRequests();
        return response.data.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al crear la solicitud';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateStatus(id, estado, observaciones = '') {
      this.loading = true;
      try {
        const response = await api.patch(`/vacations/requests/${id}/status`, { estado, observaciones });
        await this.fetchRequests();
        return response.data.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al actualizar el estado';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchLeaves(filters = {}) {
      this.loading = true;
      try {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/leaves${params ? `?${params}` : ''}`);
        this.leaves = response.data.data;
        return this.leaves;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al listar licencias';
      } finally {
        this.loading = false;
      }
    },

    async fetchIncidents(filters = {}) {
      this.loading = true;
      try {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/attendance/incidents${params ? `?${params}` : ''}`);
        this.incidents = response.data.data;
        return this.incidents;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al listar incidencias';
      } finally {
        this.loading = false;
      }
    }
  }
});
