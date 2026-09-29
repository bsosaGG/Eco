import { defineStore } from "pinia";
import apiClient from "../api/client";

export const useAuthStore = defineStore("auth", {
  state: () => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      storedUser = null;
    }

    return {
      user: storedUser,
      token: typeof window !== "undefined" && window.localStorage 
        ? localStorage.getItem("token")
        : null,
      loading: false,
    };
  },

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    rolNombre: (state) => {
      if (state.user?.role === "admin") return "Administrador General";
      return state.user?.rol_nombre || state.user?.role || "Usuario Institucional";
    },
    canWrite: (state) => {
      if (!state.user) return false;
      if (state.user.role === "admin") return true;
      return (state.user.permissions || []).includes("core-humanis:write") || (state.user.permissions || []).includes("core-humanis:admin");
    },
    canIssueConstancias: (state) => {
      if (!state.user) return false;
      if (state.user.role === "admin") return true;
      return (state.user.permissions || []).includes("core-humanis:constancias") || (state.user.permissions || []).includes("core-humanis:admin");
    },
    isColaborador: (state) => state.user?.role === "COLABORADOR",
    isRRHH: (state) => {
      if (!state.user) return false;
      if (state.user.role === "admin") return true;
      return (state.user.permissions || []).some(p => p.startsWith("core-humanis:"));
    },
    isAuditor: (state) => {
      if (!state.user) return false;
      return state.user?.role === "AUDITOR" || (state.user.permissions || []).includes("core-humanis:audit");
    },
  },

  actions: {
    async initAuth() {
      // Sincronizar token y usuario desde localStorage del portal central
      if (typeof window !== "undefined" && window.localStorage) {
        this.token = localStorage.getItem("token");
        try {
          this.user = JSON.parse(localStorage.getItem("user") || "null");
        } catch (e) {
          this.user = null;
        }
      }

      if (this.token) {
        try {
          const res = await apiClient.get("/auth/me");
          if (res.data?.user) {
            this.user = {
              ...this.user,
              ...res.data.user,
            };
          }
        } catch (meErr) {
          console.warn("Sesión institucional no verificable con /auth/me:", meErr.message);
        }
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      window.location.href = "/login";
    },

    async updateProfile(profileData) {
      this.loading = true;
      try {
        const res = await apiClient.put("/auth/me", profileData);
        if (res.data.success) {
          this.user = {
            ...this.user,
            ...res.data.user,
          };
          return res.data;
        }
      } catch (error) {
        console.error("Error al actualizar perfil:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async downloadProfile() {
      try {
        const res = await apiClient.get("/auth/me/download", {
          responseType: "blob",
        });
        const blob = new Blob([res.data], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `SCSPR-Expediente-Digital-${this.user?.username || "perfil"}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        console.error("Error al descargar expediente digital:", error);
        throw error;
      }
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
