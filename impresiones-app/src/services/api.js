import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  // timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    // 1. Inyectar token si existe
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. DETECTAR SI ES LA PETICIÓN DE LOGIN
    // Cambia '/login' por la ruta exacta de tu endpoint de autenticación
    const isLoginRequest = config.url && config.url.includes("/auth/login");

    if (!isLoginRequest) {
      // 3. ASIGNACIÓN DINÁMICA DE BASEURL (Solo si no es login)
      const isCorrespondencia =
        window.location.pathname.startsWith("/correspondencia");
      config.baseURL = isCorrespondencia
        ? "/api/correspondencia"
        : "/api/impresiones";
    } else {
      // Opcional: Define una baseURL limpia para el login si la necesita
      config.baseURL = "/api";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("No autorizado o sesión expirada");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const isCorrespondencia =
        window.location.pathname.startsWith("/correspondencia");
      const loginPath = isCorrespondencia
        ? "/correspondencia/login"
        : "/impresiones/login";
      window.location.href = loginPath;
    }
    return Promise.reject(error);
  },
);

export default api;
