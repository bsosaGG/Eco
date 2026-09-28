import { defineStore } from "pinia";
import api from "../api/client";

export const useOccupationalHealthStore = defineStore("occupationalHealth", {
  state: () => ({
    committee: null,
    committeeMembers: [],
    incidents: [],
    metrics: {
      totalIncidents: 0,
      lostTimeAccidents: 0,
      noLostTimeAccidents: 0,
      dangerousIncidents: 0,
      totalLostDays: 0,
      frequencyRate: 0,
      severityRate: 0,
    },
    medicalProfile: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  }),

  actions: {
    async fetchCommittee() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/occupational-health/committee");
        this.committee = res.data.committee;
        this.committeeMembers = res.data.members || [];
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar comité SSO";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async addCommitteeMember(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/occupational-health/committee/members", payload);
        await this.fetchCommittee();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al agregar miembro al comité";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchIncidents(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/occupational-health/incidents", { params });
        this.incidents = res.data.data || [];
        if (res.data.metrics) {
          this.metrics = res.data.metrics;
        }
        if (res.data.pagination) {
          this.pagination = res.data.pagination;
        }
        return this.incidents;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar accidentes e incidentes";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createIncident(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/occupational-health/incidents", payload);
        await this.fetchIncidents();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al asentar incidente en libro oficial";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchMedicalProfile(personaId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/occupational-health/medical-profiles/${personaId}`);
        this.medicalProfile = res.data.data;
        return this.medicalProfile;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar ficha médica";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateMedicalProfile(personaId, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.put(`/occupational-health/medical-profiles/${personaId}`, payload);
        this.medicalProfile = res.data.data;
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al actualizar ficha médica";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
