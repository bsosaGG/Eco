import { jwtDecode } from 'jwt-decode';

// El inicio de sesión es compartido con el resto de módulos del core (admin-panel en /login).
// Esta app solo lee la sesión guardada en localStorage, igual que adquisiciones-app.
export default {
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr || userStr === 'undefined') return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user from localStorage', e);
            localStorage.removeItem('user');
            return null;
        }
    },

    isAuthenticated() {
        const token = localStorage.getItem('token');
        if (!token) return false;
        try {
            const decoded = jwtDecode(token);
            return decoded.exp > Date.now() / 1000;
        } catch (e) {
            return false;
        }
    },

    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.role === 'admin') return true;
        return Boolean(user.permissions && user.permissions.includes(permission));
    },
};
