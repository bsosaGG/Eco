import { defineStore } from 'pinia';
import api from '../api/client';

export const useVacationsStore = defineStore('vacations', {
  state: () => ({
    balance: null,
    requests: [],
    leaves: [],
    incidents: [],
    loading: false,
    error: null
  }),

  actions: {
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
