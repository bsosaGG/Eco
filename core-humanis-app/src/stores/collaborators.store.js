import { defineStore } from "pinia";
import apiClient from "../api/client";

export const useCollaboratorsStore = defineStore("collaborators", {
  state: () => ({
    colaboradores: [],
    colaboradorActual: null,
    loading: false,
    error: null,
    catalogos: {
      renglones: [],
      unidades: [],
      puestos_nominales: [],
      puestos_funcionales: [],
      tipos_documento: [],
    },
    filtros: {
      search: "",
      renglon: "ALL",
      unidad: "ALL",
      estado_expediente: "ALL",
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
    links: {},
    constanciasColaborador: [],
    loadingConstancias: false,
    alertas: [],
    alertasStats: { total: 0, vencidos: 0, por_vencer: 0 },
  }),

  actions: {
    async fetchCatalogos() {
      try {
        const res = await apiClient.get("/catalogs");
        if (res.data.success) {
          this.catalogos = res.data.data;
        }
      } catch (err) {
        console.error("Error al cargar catálogos:", err);
      }
    },

    async fetchColaboradores(targetPage = null) {
      this.loading = true;
      this.error = null;
      try {
        if (targetPage !== null) {
          this.pagination.page = targetPage;
        }
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
        };
        if (this.filtros.search) params.search = this.filtros.search;
        if (this.filtros.renglon !== "ALL") params.renglon = this.filtros.renglon;
        if (this.filtros.unidad !== "ALL") params.unidad = this.filtros.unidad;
        if (this.filtros.estado_expediente !== "ALL") params.estado_expediente = this.filtros.estado_expediente;

        const res = await apiClient.get("/collaborators", { params });
        this.colaboradores = res.data.data || [];
        this.pagination = {
          page: res.data.page || 1,
          limit: res.data.limit || 10,
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 1,
        };
        this.links = res.data._links || {};
      } catch (err) {
        this.error = "No se pudo cargar la lista de colaboradores";
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async irAPagina(p) {
      if (p >= 1 && p <= this.pagination.totalPages) {
        await this.fetchColaboradores(p);
      }
    },

    async fetchConstanciasColaborador(id) {
      this.loadingConstancias = true;
      try {
        const res = await apiClient.get(`/certificates?persona_id=${id}`);
        this.constanciasColaborador = res.data.data || [];
        return this.constanciasColaborador;
      } catch (err) {
        console.error("Error al cargar constancias del colaborador:", err);
        this.constanciasColaborador = [];
        return [];
      } finally {
        this.loadingConstancias = false;
      }
    },

    async fetchColaboradorById(id) {
      this.loading = true;
      try {
        const res = await apiClient.get(`/collaborators/${id}`);
        this.colaboradorActual = res.data.data;
        return res.data.data;
      } catch (err) {
        console.error("Error al cargar colaborador:", err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async crearColaborador(payload) {
      try {
        const res = await apiClient.post("/collaborators", payload);
        await this.fetchColaboradores();
        return res.data;
      } catch (err) {
        throw err.response?.data || { message: "Error al crear colaborador" };
      }
    },

    async subirDocumento(colaboradorId, formData) {
      try {
        const res = await apiClient.post(`/collaborators/${colaboradorId}/documents`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await this.fetchColaboradorById(colaboradorId);
        return res.data;
      } catch (err) {
        throw err.response?.data || { message: "Error al subir documento" };
      }
    },

    async fetchAlertas() {
      try {
        const res = await apiClient.get("/alerts");
        if (res.data.success) {
          this.alertas = res.data.data || [];
          this.alertasStats = {
            total: res.data.total,
            vencidos: res.data.vencidos_count,
            por_vencer: res.data.por_vencer_count,
          };
        }
      } catch (err) {
        console.error("Error al cargar alertas:", err);
      }
    },
  },
});

export const useColaboradoresStore = useCollaboratorsStore;
