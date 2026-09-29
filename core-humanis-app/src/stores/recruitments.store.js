import { defineStore } from "pinia";
import api from "../api/client";

export const useRecruitmentsStore = defineStore("recruitments", {
  state: () => ({
    recruitments: [],
    currentRecruitment: null,
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
    async fetchRecruitments(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/recruitments", { params });
        this.recruitments = res.data.data || [];
        if (res.data.pagination) {
          this.pagination = res.data.pagination;
        }
        return this.recruitments;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar convocatorias";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchRecruitmentById(id) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/recruitments/${id}`);
        this.currentRecruitment = res.data.data;
        return this.currentRecruitment;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar convocatoria";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createRecruitment(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/recruitments", payload);
        await this.fetchRecruitments();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al publicar convocatoria";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateRecruitmentStatus(id, estado) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.patch(`/recruitments/${id}/status`, { estado });
        if (this.currentRecruitment && this.currentRecruitment.id === id) {
          this.currentRecruitment.estado = estado;
        }
        await this.fetchRecruitments();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al actualizar estado";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateRecruitment(id, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.put(`/recruitments/${id}`, payload);
        if (this.currentRecruitment && this.currentRecruitment.id === id) {
          this.currentRecruitment = { ...this.currentRecruitment, ...res.data.data };
        }
        await this.fetchRecruitments();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al actualizar convocatoria";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async applyCandidate(convocatoriaId, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post(`/recruitments/${convocatoriaId}/applications`, payload);
        if (this.currentRecruitment && this.currentRecruitment.id === convocatoriaId) {
          await this.fetchRecruitmentById(convocatoriaId);
        }
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al postular candidato";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async scoreCandidate(convocatoriaId, appId, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.patch(`/recruitments/${convocatoriaId}/applications/${appId}/score`, payload);
        if (this.currentRecruitment && this.currentRecruitment.id === convocatoriaId) {
          await this.fetchRecruitmentById(convocatoriaId);
        }
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al calificar candidato";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async selectWinner(convocatoriaId, appId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post(`/recruitments/${convocatoriaId}/applications/${appId}/select`);
        if (this.currentRecruitment && this.currentRecruitment.id === convocatoriaId) {
          await this.fetchRecruitmentById(convocatoriaId);
        }
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al seleccionar ganador";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
