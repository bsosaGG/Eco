import { defineStore } from "pinia";
import api from "../api/client";

export const usePayrollsStore = defineStore("payrolls", {
  state: () => ({
    payrolls: [],
    currentPayroll: null,
    personnelActions: [],
    disciplinaryRecords: [],
    mySlips: [],
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
    async fetchPayrolls(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/payrolls", { params });
        this.payrolls = res.data.data || [];
        this.pagination = {
          page: res.data.page || 1,
          limit: res.data.limit || 10,
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 1,
        };
        return this.payrolls;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al obtener nóminas";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchPayrollById(id) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get(`/payrolls/${id}`);
        this.currentPayroll = res.data.data;
        return this.currentPayroll;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al obtener detalle de nómina";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createPayroll(data) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/payrolls", data);
        await this.fetchPayrolls();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al crear nómina";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async calculatePayroll(id) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post(`/payrolls/${id}/calculate`);
        await this.fetchPayrollById(id);
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al calcular nómina";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updatePayrollStatus(id, estado) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.patch(`/payrolls/${id}/status`, { estado });
        await this.fetchPayrollById(id);
        await this.fetchPayrolls();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al actualizar estado de nómina";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchPersonnelActions(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/personnel-actions", { params });
        this.personnelActions = res.data.data || [];
        return this.personnelActions;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al obtener acciones de personal";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createPersonnelAction(data) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post("/personnel-actions", data);
        await this.fetchPersonnelActions();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al registrar acción de personal";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updatePersonnelActionStatus(id, estado) {
      this.loading = true;
      try {
        const res = await api.patch(`/personnel-actions/${id}/status`, { estado });
        await this.fetchPersonnelActions();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al actualizar acción de personal";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateCgcDjpStatus(id, djp_cumplida) {
      this.loading = true;
      try {
        const res = await api.patch(`/personnel-actions/${id}/cgc-djp`, { djp_cumplida });
        await this.fetchPersonnelActions();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al actualizar estado DJP";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchDisciplinaryRecords(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.get("/disciplinary-records", { params });
        this.disciplinaryRecords = res.data.data || [];
        return this.disciplinaryRecords;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al obtener expedientes disciplinarios";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createDisciplinaryRecord(data) {
      this.loading = true;
      try {
        const res = await api.post("/disciplinary-records", data);
        await this.fetchDisciplinaryRecords();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al registrar falta disciplinaria";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createHearing(id, fecha_notificacion) {
      this.loading = true;
      try {
        const res = await api.post(`/disciplinary-records/${id}/hearings`, { fecha_notificacion });
        await this.fetchDisciplinaryRecords();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al conferir audiencia de descargo";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async resolveDisciplinaryRecord(id, data) {
      this.loading = true;
      try {
        const res = await api.patch(`/disciplinary-records/${id}/resolution`, data);
        await this.fetchDisciplinaryRecords();
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al resolver expediente disciplinario";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchMySlips() {
      this.loading = true;
      try {
        const res = await api.get("/portal/payroll-slips");
        this.mySlips = res.data.data || [];
        return this.mySlips;
      } catch (err) {
        this.error = err.response?.data?.message || "Error al obtener boletas de pago";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
