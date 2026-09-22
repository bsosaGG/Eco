import { defineStore } from 'pinia';
import api from '../api/client';

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    punches: [],
    incidents: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchPunches(personaId) {
      this.loading = true;
      try {
        const res = await api.get(`/attendance/punches/${personaId}`);
        this.punches = res.data.data;
        return this.punches;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al obtener marcas biométricas';
      } finally {
        this.loading = false;
      }
    },

    async registerPunches(punchesData) {
      this.loading = true;
      try {
        const res = await api.post('/attendance/punches', punchesData);
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al registrar marcas biométricas';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchIncidents(params = {}) {
      this.loading = true;
      try {
        const res = await api.get('/attendance/incidents', { params });
        this.incidents = res.data.data;
        return this.incidents;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al obtener incidencias';
      } finally {
        this.loading = false;
      }
    },

    async updateIncidentStatus(incidentId, statusData) {
      this.loading = true;
      try {
        const res = await api.patch(`/attendance/incidents/${incidentId}/status`, statusData);
        await this.fetchIncidents();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al actualizar incidencia';
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});

