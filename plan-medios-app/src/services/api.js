import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: agrega el token JWT (mismo mecanismo que adquisiciones-app/juridica-app)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: si el token expira o es inválido, regresa al login compartido (admin-panel)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/**
 * Mensaje legible de un error de axios. Los blobs de error (descargas) se leen aparte
 * con `errorMessageFromBlob`.
 */
export function errorMessage(error, fallback = 'Ocurrió un error inesperado.') {
    const data = error?.response?.data;
    if (data && typeof data === 'object' && !(data instanceof Blob)) {
        if (data.message) return data.message;
        if (Array.isArray(data.errors) && data.errors.length) return data.errors.map((e) => e.msg).join(' ');
    }
    if (error?.response?.status === 403) return 'No tiene permiso para realizar esta acción.';
    if (!error?.response && error?.request) return 'No fue posible comunicarse con el servidor.';
    return fallback;
}

/** Igual que errorMessage, para respuestas de error de peticiones con responseType "blob". */
export async function errorMessageFromBlob(error, fallback) {
    const data = error?.response?.data;
    if (data instanceof Blob) {
        try {
            const parsed = JSON.parse(await data.text());
            if (parsed?.message) return parsed.message;
        } catch (parseError) {
            // el cuerpo no era JSON: se usa el mensaje genérico
        }
    }
    return errorMessage(error, fallback);
}

export default api;
