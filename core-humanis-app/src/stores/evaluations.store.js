import { defineStore } from "pinia";
import api from "../api/client";

export const useEvaluationsStore = defineStore("evaluations", {
  state: () => ({
    evaluations: [],
    currentEvaluation: null,
    collaboratorEvaluations: [],
    defaultFactors: [],
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
    async fetchEvaluations(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/performance-evaluations", { params });
        this.evaluations = res.data.data || [];
        if (res.data.pagination) {
          this.pagination = res.data.pagination;
        }
        return this.evaluations;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar evaluaciones";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchEvaluationById(id) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/performance-evaluations/${id}`);
        this.currentEvaluation = res.data.data;
        return this.currentEvaluation;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar detalle de la evaluación";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchCollaboratorEvaluations(personaId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/performance-evaluations/collaborator/${personaId}`);
        this.collaboratorEvaluations = res.data.data || [];
        return this.collaboratorEvaluations;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar historial del colaborador";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchDefaultFactors(tipo = "ONSEC_011_022") {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/performance-evaluations/factors/default", {
          params: { tipo },
        });
        this.defaultFactors = res.data.data || [];
        return this.defaultFactors;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar factores";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createEvaluation(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/performance-evaluations", payload);
        await this.fetchEvaluations();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al registrar evaluación";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
