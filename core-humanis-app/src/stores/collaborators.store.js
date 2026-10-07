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
    cumpleanios: [],
    alertasStats: { total: 0, vencidos: 0, por_vencer: 0, colegiados: 0, cgc: 0, licencias: 0, rtu_dpi: 0 },
  }),

  actions: {
    async fetchCatalogos() {
      if (this.catalogos.renglones.length > 0 && this.catalogos.unidades.length > 0) {
        return this.catalogos;
      }
      try {
        const [renglones, unidades, funcionales, nominales, tiposDoc] = await Promise.all([
          apiClient.get("/catalogs/budget-lines"),
          apiClient.get("/catalogs/units"),
          apiClient.get("/catalogs/functional-positions"),
          apiClient.get("/catalogs/nominal-positions"),
          apiClient.get("/catalogs/document-types"),
        ]);

        this.catalogos = {
          renglones: renglones.data.data || [],
          unidades: unidades.data.data || [],
          puestos_funcionales: funcionales.data.data || [],
          puestos_nominales: nominales.data.data || [],
          tipos_documento: tiposDoc.data.data || [],
        };
      } catch (err) {
        console.error("Error al cargar catálogos por recursos granulares:", err);
      }
    },

    async fetchBudgetLines() {
      try {
        const res = await apiClient.get("/catalogs/budget-lines");
        if (res.data.success) {
          this.catalogos.renglones = res.data.data;
        }
        return this.catalogos.renglones;
      } catch (err) {
        console.error("Error al cargar renglones presupuestarios:", err);
      }
    },

    async fetchUnits() {
      try {
        const res = await apiClient.get("/catalogs/units");
        if (res.data.success) {
          this.catalogos.unidades = res.data.data;
        }
        return this.catalogos.unidades;
      } catch (err) {
        console.error("Error al cargar unidades administrativas:", err);
      }
    },

    async fetchFunctionalPositions() {
      try {
        const res = await apiClient.get("/catalogs/functional-positions");
        if (res.data.success) {
          this.catalogos.puestos_funcionales = res.data.data;
        }
        return this.catalogos.puestos_funcionales;
      } catch (err) {
        console.error("Error al cargar puestos funcionales:", err);
      }
    },

    async fetchNominalPositions() {
      try {
        const res = await apiClient.get("/catalogs/nominal-positions");
        if (res.data.success) {
          this.catalogos.puestos_nominales = res.data.data;
        }
        return this.catalogos.puestos_nominales;
      } catch (err) {
        console.error("Error al cargar puestos nominales:", err);
      }
    },

    async fetchDocumentTypes() {
      try {
        const res = await apiClient.get("/catalogs/document-types");
        if (res.data.success) {
          this.catalogos.tipos_documento = res.data.data;
        }
        return this.catalogos.tipos_documento;
      } catch (err) {
        console.error("Error al cargar tipos de documento:", err);
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

    async actualizarColaborador(id, payload) {
      try {
        const res = await apiClient.put(`/collaborators/${id}`, payload);
        await this.fetchColaboradorById(id);
        return res.data;
      } catch (err) {
        throw err.response?.data || { message: "Error al actualizar colaborador" };
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

    async descargarDocumento(colaboradorId, docId, filename = "documento.pdf") {
      try {
        const res = await apiClient.get(`/collaborators/${colaboradorId}/documents/${docId}/download`, {
          responseType: "blob",
        });
        const contentType = res.headers["content-type"] || "application/pdf";
        const blob = new Blob([res.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } catch (err) {
        console.error("Error al descargar documento:", err);
        throw err.response?.data || { message: "Error al descargar el documento del expediente" };
      }
    },

    async obtenerBlobDocumento(colaboradorId, docId) {
      try {
        const res = await apiClient.get(`/collaborators/${colaboradorId}/documents/${docId}/view`, {
          responseType: "blob",
        });
        const contentType = res.headers["content-type"] || "application/pdf";
        const blob = new Blob([res.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        return { blobUrl: url, contentType };
      } catch (err) {
        console.error("Error al previsualizar documento:", err);
        throw err.response?.data || { message: "Error al cargar el documento para visualización" };
      }
    },

    async fetchAlertas() {
      try {
        const res = await apiClient.get("/alerts");
        if (res.data.success) {
          this.alertas = res.data.data || [];
          this.cumpleanios = res.data.cumpleanios || [];
          this.alertasStats = {
            total: res.data.total || 0,
            vencidos: res.data.vencidos_count || 0,
            por_vencer: res.data.por_vencer_count || 0,
            colegiados: res.data.colegiados_count || 0,
            cgc: res.data.cgc_count || 0,
            licencias: res.data.licencias_count || 0,
            rtu_dpi: res.data.rtu_dpi_count || 0,
          };
        }
      } catch (err) {
        console.error("Error al cargar alertas:", err);
      }
    },

    async fetchEstudios(colaboradorId) {
      try {
        const res = await apiClient.get(`/collaborators/${colaboradorId}/studies`);
        if (this.colaboradorActual && this.colaboradorActual.id === colaboradorId) {
          this.colaboradorActual.estudios = res.data.data || [];
        }
        return res.data.data || [];
      } catch (err) {
        console.error("Error al cargar estudios del colaborador:", err);
        return [];
      }
    },

    async crearEstudio(colaboradorId, payload) {
      try {
        const res = await apiClient.post(`/collaborators/${colaboradorId}/studies`, payload);
        await this.fetchColaboradorById(colaboradorId);
        return res.data;
      } catch (err) {
        throw err.response?.data || { message: "Error al registrar formación académica" };
      }
    },

    async actualizarEstudio(colaboradorId, estudioId, payload) {
      try {
        const res = await apiClient.put(`/collaborators/${colaboradorId}/studies/${estudioId}`, payload);
        await this.fetchColaboradorById(colaboradorId);
        return res.data;
      } catch (err) {
        throw err.response?.data || { message: "Error al actualizar formación académica" };
      }
    },

    async eliminarEstudio(colaboradorId, estudioId) {
      try {
        const res = await apiClient.delete(`/collaborators/${colaboradorId}/studies/${estudioId}`);
        await this.fetchColaboradorById(colaboradorId);
        return res.data;
      } catch (err) {
        throw err.response?.data || { message: "Error al eliminar formación académica" };
      }
    },
  },
});

export const useColaboradoresStore = useCollaboratorsStore;
