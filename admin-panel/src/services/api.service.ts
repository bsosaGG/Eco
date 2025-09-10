import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

// Lee la URL base desde las variables de entorno de Vite.
const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  console.error('VITE_API_URL no está definida. Asegúrate de tener tus archivos .env configurados.')
}

const apiClient = axios.create({
  baseURL: baseURL, // Usa la variable dinámica
  headers: {
    'Content-Type': 'application/json',
  },
})

// Tu interceptor se mantiene exactamente igual, es correcto.
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default apiClient
