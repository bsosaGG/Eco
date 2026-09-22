import { defineStore } from "pinia";
import apiClient from "../api/client";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: localStorage.getItem("token") || localStorage.getItem("core_humanis_dev_token") || null,
    loading: false,
    availableRoles: [],
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    rolNombre: (state) => state.user?.rol_nombre || state.user?.role || "Jefa de Recursos Humanos",
    canWrite: (state) => {
      if (!state.user) return true;
      return ["admin", "ADMIN_TI", "JEFA_RRHH", "ANALISTA_RRHH"].includes(state.user.role);
    },
    canIssueConstancias: (state) => {
      if (!state.user) return true;
      return ["admin", "ADMIN_TI", "JEFA_RRHH"].includes(state.user.role);
    },
    isColaborador: (state) => state.user?.role === "COLABORADOR",
    isRRHH: (state) => ["admin", "ADMIN_TI", "JEFA_RRHH", "ANALISTA_RRHH"].includes(state.user?.role),
    isAuditor: (state) => state.user?.role === "AUDITOR",
  },

  actions: {
    async initAuth() {
      try {
        // Cargar roles dev disponibles
        const rolesRes = await apiClient.get("/auth/roles");
        this.availableRoles = rolesRes.data.roles || [];

        // Si ya hay token, verificarlo; si falla (401), regenerar sesión dev
        if (this.token) {
          try {
            const res = await apiClient.get("/auth/me");
            this.user = res.data.user;
          } catch (meErr) {
            console.warn("Token existente inválido o expirado. Renovando sesión dev...");
            await this.switchDevRole("jefa.rrhh");
          }
        } else {
          // Iniciar con rol de Jefa RRHH por defecto en standalone
          await this.switchDevRole("jefa.rrhh");
        }
      } catch (err) {
        console.warn("Error al inicializar sesión, usando rol predeterminado:", err.message);
        if (!this.user && this.availableRoles.length > 0) {
          this.user = this.availableRoles[0];
        }
      }
    },

    async switchDevRole(username) {
      try {
        const res = await apiClient.post("/auth/tokens", { username });
        this.token = res.data.token;
        this.user = res.data.user;
        localStorage.setItem("core_humanis_dev_token", this.token);
        localStorage.setItem("token", this.token);
      } catch (error) {
        console.error("Error al cambiar rol:", error);
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem("core_humanis_dev_token");
      localStorage.removeItem("token");
    },

    hasPermission(permiso) {
      if (!this.user) return true;
      if (this.user.role === "admin" || this.user.role === "ADMIN_TI" || this.user.role === "JEFA_RRHH") {
        return true;
      }
      return (this.user.permissions || []).includes(permiso);
    },
  },
});
