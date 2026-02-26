import { defineStore } from 'pinia';
import authService from '../services/auth.service';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: authService.getCurrentUser(),
        isAuthenticated: authService.isAuthenticated(),
        error: null,
        loading: false
    }),
    actions: {
        async login(email, password) {
            this.loading = true;
            this.error = null;
            try {
                const data = await authService.login(email, password);
                this.user = data.user;
                this.isAuthenticated = true;
                return true;
            } catch (error) {
                console.error("Error de autenticación", error);
                this.error = error.response?.data?.message || 'Error al iniciar sesión';
                return false;
            } finally {
                this.loading = false;
            }
        },
        logout() {
            authService.logout();
            this.user = null;
            this.isAuthenticated = false;
        },
        hasPermission(permission) {
            if (!this.user || !this.user.permissions) return false;
            return this.user.permissions.includes(permission);
        },
        checkAuth() {
            this.isAuthenticated = authService.isAuthenticated();
            this.user = authService.getCurrentUser();
            if (!this.isAuthenticated) {
                this.logout();
            }
        }
    }
});
