import api from './api';
import { jwtDecode } from 'jwt-decode';

export default {
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;
        if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        }
        return response.data;
    },

    async verificarContrasenia(password) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('No hay sesión activa.');
        const response = await api.post('/auth/verify-password', { password });
        return response.data?.valid === true;
    },

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
            const now = Date.now() / 1000;
            return decoded.exp > now;
        } catch (e) {
            return false;
        }
    },

    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.permissions && user.permissions.includes(permission);
    }
};
