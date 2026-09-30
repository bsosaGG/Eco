import { defineStore } from "pinia";
import api from "../api/client";

export const useTrainingsStore = defineStore("trainings", {
  state: () => ({
    trainings: [],
    currentTraining: null,
    collaboratorTrainings: [],
    totalHorasAcreditadas: 0,
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
    async fetchTrainings(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/trainings", { params });
        this.trainings = res.data.data || [];
        if (res.data.pagination) {
          this.pagination = res.data.pagination;
        }
        return this.trainings;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar capacitaciones";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchTrainingById(id) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/trainings/${id}`);
        this.currentTraining = res.data.data;
        return this.currentTraining;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar detalle del curso";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createTraining(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/trainings", payload);
        await this.fetchTrainings();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al crear programa de capacitación";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async enrollParticipant(trainingId, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post(`/trainings/${trainingId}/enrollments`, payload);
        if (this.currentTraining && this.currentTraining.id === trainingId) {
          await this.fetchTrainingById(trainingId);
        }
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al inscribir colaborador";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async gradeParticipant(trainingId, enrId, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.patch(`/trainings/${trainingId}/enrollments/${enrId}/grade`, payload);
        if (this.currentTraining && this.currentTraining.id === trainingId) {
          await this.fetchTrainingById(trainingId);
        }
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al asentar calificación";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchCollaboratorTrainings(personaId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/trainings/collaborator/${personaId}`);
        this.collaboratorTrainings = res.data.data || [];
        this.totalHorasAcreditadas = res.data.total_horas_acreditadas || 0;
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al consultar historial formativo";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
