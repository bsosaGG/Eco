import { defineStore } from "pinia";
import api from "../api/client";

export const useAnalyticsStore = defineStore("analytics", {
  state: () => ({
    dashboard: null,
    laipReport: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchDashboard() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/analytics/dashboard");
        this.dashboard = res.data.data;
        return this.dashboard;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al cargar datos del Dashboard BI";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchLaipReport() {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/analytics/laip-art10", {
          params: { format: "json" },
        });
        this.laipReport = res.data;
        return this.laipReport;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al consultar reporte LAIP Art. 10";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async downloadLaipCsv() {
      try {
        const res = await api.get("/analytics/laip-art10", {
          params: { format: "csv" },
          responseType: "blob",
        });

        const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const dateStr = new Date().toISOString().split("T")[0];
        link.setAttribute("download", `SCSPR_LAIP_Art10_Numeral4_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Error al descargar CSV LAIP:", err);
        throw err;
      }
    },
  },
});
