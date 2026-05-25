import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    // timeout: 10000, 
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // DETECCIÓN DINÁMICA DEL ENDPOINT DE LA API
        const isCorrespondencia = window.location.pathname.startsWith('/correspondencia');
        config.baseURL = isCorrespondencia ? '/api/correspondencia' : '/api/impresiones';

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('No autorizado o sesión expirada');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            const isCorrespondencia = window.location.pathname.startsWith('/correspondencia');
            const loginPath = isCorrespondencia ? '/correspondencia/login' : '/impresiones/login';
            window.location.href = loginPath;
        }
        return Promise.reject(error);
    }
);

export default api;
