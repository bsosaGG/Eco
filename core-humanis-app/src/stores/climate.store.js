import { defineStore } from "pinia";
import api from "../api/client";

export const useClimateStore = defineStore("climate", {
  state: () => ({
    surveys: [],
    activeCampaign: null,
    activeQuestions: [],
    hasParticipated: false,
    surveyResults: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchSurveys() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/climate/surveys");
        this.surveys = res.data.data || [];
        return this.surveys;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar encuestas de clima";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchActiveSurvey() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/climate/surveys/active");
        this.activeCampaign = res.data.campaign;
        this.activeQuestions = res.data.questions || [];
        this.hasParticipated = Boolean(res.data.hasParticipated);
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al consultar encuesta activa";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createSurvey(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/climate/surveys", payload);
        await this.fetchSurveys();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al crear campaña de clima";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async submitAnonymousResponse(surveyId, payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post(`/climate/surveys/${surveyId}/submit`, payload);
        this.hasParticipated = true;
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al enviar encuesta";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchSurveyResults(surveyId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/climate/surveys/${surveyId}/results`);
        this.surveyResults = res.data;
        return this.surveyResults;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar resultados de clima";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
