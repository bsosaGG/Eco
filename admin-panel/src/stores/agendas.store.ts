import { defineStore } from 'pinia'
import apiClient from '@/services/api.service'
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL;

console.log("API_URL", API_URL);

export const useAgendasStore = defineStore('agendas', {
    state: () => ({
        myAssignment: null as any,
        currentWeekEntry: null as any,
        matrix: [] as any[],
        matrixSummary: null as any,
        monthlyOverview: [] as any[],
        weeks: [] as any[],
        itemTypes: [] as any[],
        loading: false,
        error: null as string | null,
    }),

    actions: {
        async fetchMyAssignment() {
            this.loading = true
            try {
                const response = await apiClient.get('/agendas/my-assignment')
                this.myAssignment = response.data
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error fetching assignment'
                console.error(error)
            } finally {
                this.loading = false
            }
        },

        async fetchWeeklyEntry(weekId: number) {
            this.loading = true
            this.currentWeekEntry = null // Reset previous data
            try {
                const response = await apiClient.get(`/agendas/weekly-entry?weekId=${weekId}`)
                this.currentWeekEntry = response.data
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error fetching weekly entry'
                console.error(error)
            } finally {
                this.loading = false
            }
        },

        async saveWeeklyAgenda(weekId: number, items: any[], status: string) {
            this.loading = true
            try {
                await apiClient.post('/agendas/weekly-entry', { weekId, items, status })
                // Refresh entry after save
                await this.fetchWeeklyEntry(weekId)
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error saving agenda'
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchMatrix(weekId: number) {
            this.loading = true
            try {
                const response = await apiClient.get(`/agendas/matrix?weekId=${weekId}`)
                this.matrix = response.data
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error fetching matrix'
                console.error(error)
            } finally {
                this.loading = false
            }
        },

        async fetchMatrixSummary(weekId: number) {
            try {
                const response = await apiClient.get(`/agendas/matrix-summary?weekId=${weekId}`)
                this.matrixSummary = response.data
            } catch (error: any) {
                console.error('Error fetching matrix summary:', error)
            }
        },

        async fetchMonthlyOverview(year: number, month: number) {
            this.loading = true
            try {
                const response = await apiClient.get(`/agendas/monthly-overview?year=${year}&month=${month}`)
                this.monthlyOverview = response.data
                console.log("Monthly Overview", this.monthlyOverview)
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error fetching monthly overview'
                console.error(error)
            } finally {
                this.loading = false
            }
        },

        async closeMonth(institutionId: number, month: number, year: number, file: File) {
            const formData = new FormData()
            formData.append('institutionId', institutionId.toString())
            formData.append('month', month.toString())
            formData.append('year', year.toString())
            formData.append('file', file)

            this.loading = true
            try {
                await apiClient.post('/agendas/close-month', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                // Refresh overview
                await this.fetchMonthlyOverview(year, month)
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cerrar mes'
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchWeeks(year: number) {
            this.loading = true
            try {
                const response = await apiClient.get(`/agendas/weeks?year=${year}`)
                this.weeks = response.data
                return response.data
            } catch (error: any) {
                console.error(error)
                return []
            } finally {
                this.loading = false
            }
        },

        async fetchItemTypes() {
            const authStore = useAuthStore();
            try {
                const response = await axios.get(`${API_URL}/agendas/item-types`, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
                this.itemTypes = response.data;
                return response.data;
            } catch (error: any) {
                console.error("Error fetching item types:", error);
                return [];
            }
        },

        // --- Admin Actions ---

        async fetchInstitutions() {
            const authStore = useAuthStore();
            try {
                const response = await axios.get(`${API_URL}/agendas/admin/institutions`, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
                return response.data;
            } catch (error) {
                console.error("Error fetching institutions:", error);
                throw error;
            }
        },

        async createInstitution(formData: FormData) {
            const authStore = useAuthStore();
            try {
                await axios.post(`${API_URL}/agendas/admin/institutions`, formData, {
                    headers: {
                        Authorization: `Bearer ${authStore.token}`,
                        "Content-Type": "multipart/form-data"
                    },
                });
            } catch (error) {
                console.error("Error creating institution:", error);
                throw error;
            }
        },

        async updateInstitution(id: number, formData: FormData) {
            const authStore = useAuthStore();
            try {
                await axios.put(`${API_URL}/agendas/admin/institutions/${id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${authStore.token}`,
                        "Content-Type": "multipart/form-data"
                    },
                });
            } catch (error) {
                console.error("Error updating institution:", error);
                throw error;
            }
        },

        async deleteInstitution(id: number) {
            const authStore = useAuthStore();
            try {
                await axios.delete(`${API_URL}/agendas/admin/institutions/${id}`, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
            } catch (error) {
                console.error("Error deleting institution:", error);
                throw error;
            }
        },

        async fetchAssignments(institutionId: number) {
            const authStore = useAuthStore();
            try {
                const response = await axios.get(`${API_URL}/agendas/admin/assignments`, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                    params: { institutionId },
                });
                return response.data;
            } catch (error) {
                console.error("Error fetching assignments:", error);
                throw error;
            }
        },

        async createAssignment(userId: number, institutionId: number) {
            const authStore = useAuthStore();
            try {
                await axios.post(`${API_URL}/agendas/admin/assignments`, { userId, institutionId }, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
            } catch (error) {
                console.error("Error creating assignment:", error);
                throw error;
            }
        },

        async deleteAssignment(userId: number, institutionId: number) {
            const authStore = useAuthStore();
            try {
                await axios.delete(`${API_URL}/agendas/admin/assignments`, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                    data: { userId, institutionId },
                });
            } catch (error) {
                console.error("Error deleting assignment:", error);
                throw error;
            }
        },

        async searchUsers(email: string) {
            const authStore = useAuthStore();
            try {
                const response = await axios.get(`${API_URL}/agendas/admin/users/search`, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                    params: { email },
                });
                return response.data;
            } catch (error) {
                console.error("Error searching users:", error);
                throw error;
            }
        },

        async updateItemType(key: string, label: string, orderIndex: number) {
            const authStore = useAuthStore();
            try {
                await axios.put(`${API_URL}/agendas/admin/item-types/${key}`, { label, order_index: orderIndex }, {
                    headers: { Authorization: `Bearer ${authStore.token}` },
                });
            } catch (error) {
                console.error("Error updating item type:", error);
                throw error;
            }
        },
    },
})
