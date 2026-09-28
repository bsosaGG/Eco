import axios from "axios";

// Cliente Axios configurado para comunicarse con la API RESTful canónica /api/v1/core-humanis
// Respetando la autenticación compartida de denuncias-scsp vía localStorage.getItem('token')
const apiClient = axios.create({
  baseURL: "/api/v1/core-humanis",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor para inyectar automáticamente el token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' && window.localStorage 
      ? (localStorage.getItem("token") || localStorage.getItem("core_humanis_dev_token"))
      : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para captura de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Sesión expirada o no autorizada");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
