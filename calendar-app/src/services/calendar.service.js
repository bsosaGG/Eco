import axios from 'axios'

// Configuración base de axios para que las peticiones relativas funcionen
// con el proxy de vite/nginx.
// Al estar en /calendario/, las peticiones a 'api/calendar' se resolverán a 
// /calendario/api/calendar, que nginx redirigirá correctamente.

const api = axios.create({
    baseURL: '/api', // Relativo a la base de la app
})

// Interceptor para agregar el token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default {
    async getEvents(start, end, filters = {}) {
        const response = await api.get('/juridica/historial/eventos', {
            params: {
                startDate: start,
                endDate: end,
                ...filters
            },
            // Solución nativa de Axios (reemplaza a qs)
            paramsSerializer: {
                indexes: null // Esto elimina los corchetes [] y los índices
            }
        })
        return response.data
    },

    async createEvent(eventData) {
        const response = await api.post('/calendar', eventData)
        return response.data
    },

    async updateEvent(id, eventData) {
        const response = await api.put(`/calendar/${id}`, eventData)
        return response.data
    },

    async deleteEvent(id) {
        const response = await api.delete(`/calendar/${id}`)
        return response.data
    }
}
