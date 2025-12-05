import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user')) || null
    }),
    actions: {
        async login(email, password) {
            try {
                const response = await axios.post('/api/auth/login', { email, password })
                this.token = response.data.token
                this.user = { id: response.data.userId, role: response.data.role }

                localStorage.setItem('token', this.token)
                localStorage.setItem('user', JSON.stringify(this.user))

                // Configurar header por defecto para axios
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

                return true
            } catch (error) {
                console.error('Login failed', error)
                return false
            }
        },
        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            delete axios.defaults.headers.common['Authorization']
        }
    }
})
