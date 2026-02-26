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

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/impresiones/login'; // Force redirect
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr || userStr === 'undefined') return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
            localStorage.removeItem('user'); // Clear bad data
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
        return user.permissions && user.permissions.includes(permission);
    }
};
