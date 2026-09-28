import { defineStore } from "pinia";
import apiClient from "../api/client";

export const useComplaintsStore = defineStore("complaints", {
  state: () => ({
    complaints: [],
    currentComplaint: null,
    trackedComplaint: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
    filters: {
      search: "",
      estado: "ALL",
      tipo: "ALL",
      prioridad: "ALL",
    },
    loading: false,
    trackingLoading: false,
    submitting: false,
    error: null,
    trackingError: null,
  }),

  getters: {
    totalDenuncias: (state) => state.pagination.total || state.complaints.length,
    pendientesCount: (state) =>
      state.complaints.filter((c) => ["RECIBIDA", "EN_INVESTIGACION"].includes(c.estado)).length,
    resueltasCount: (state) =>
      state.complaints.filter((c) => c.estado === "RESUELTA").length,
  },

  actions: {
    async fetchComplaints(page = 1) {
      this.loading = true;
      this.error = null;
      try {
        const params = {
          page,
          limit: this.pagination.limit,
          search: this.filters.search || undefined,
          estado: this.filters.estado !== "ALL" ? this.filters.estado : undefined,
          tipo: this.filters.tipo !== "ALL" ? this.filters.tipo : undefined,
          prioridad: this.filters.prioridad !== "ALL" ? this.filters.prioridad : undefined,
        };

        const res = await apiClient.get("/complaints", { params });
        if (res.data.success) {
          this.complaints = res.data.data || [];
          this.pagination = res.data.pagination || this.pagination;
        }
      } catch (err) {
        console.error("Error al obtener denuncias:", err);
        this.error = err.response?.data?.message || "Error al cargar buzón de denuncias";
      } finally {
        this.loading = false;
      }
    },

    async createComplaint(payload) {
      this.submitting = true;
      this.error = null;
      try {
        const res = await apiClient.post("/complaints", payload);
        if (res.data.success) {
          return res.data.data;
        }
        throw new Error(res.data.message || "Error al registrar denuncia");
      } catch (err) {
        console.error("Error al registrar denuncia:", err);
        this.error = err.response?.data?.message || err.message;
        throw err;
      } finally {
        this.submitting = false;
      }
    },

    async trackComplaint(trackingCode) {
      this.trackingLoading = true;
      this.trackingError = null;
      this.trackedComplaint = null;
      try {
        const code = (trackingCode || "").trim();
        const res = await apiClient.get(`/complaints/track/${code}`);
        if (res.data.success) {
          this.trackedComplaint = res.data.data;
          return res.data.data;
        }
      } catch (err) {
        this.trackingError =
          err.response?.data?.message || "No se encontró ningún expediente con el código indicado";
        throw err;
      } finally {
        this.trackingLoading = false;
      }
    },

    async updateStatus(id, estado, resolucion_nota) {
      this.loading = true;
      try {
        const res = await apiClient.patch(`/complaints/${id}/status`, {
          estado,
          resolucion_nota,
        });
        if (res.data.success) {
          const updated = res.data.data;
          const idx = this.complaints.findIndex((c) => c.id === id);
          if (idx !== -1) {
            this.complaints[idx] = {
              ...this.complaints[idx],
              ...updated,
            };
          }
          if (this.currentComplaint?.id === id) {
            this.currentComplaint = {
              ...this.currentComplaint,
              ...updated,
            };
          }
          return updated;
        }
      } catch (err) {
        console.error("Error al actualizar estado de la denuncia:", err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    selectComplaint(complaint) {
      this.currentComplaint = complaint;
    },
  },
});
