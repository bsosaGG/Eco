import { defineStore } from 'pinia'
import calendarService from '../services/calendar.service'
import Swal from 'sweetalert2'

export const useCalendarStore = defineStore('calendar', {
    state: () => ({
        isLoading: false,
        error: null,
    }),
    actions: {
        async fetchEvents(start, end, filters = {}) {
            this.isLoading = true
            this.error = null
            try {
                const events = await calendarService.getEvents(start, end, filters)
                // Las fechas vienen como fecha_interposicion 
                return events.map(e => ({
                    ...e,
                    start_date: e.fecha_interposicion ? e.fecha_interposicion.replace('Z', '') : e.fecha_interposicion,
                    end_date: e.fecha_interposicion ? e.fecha_interposicion.replace('Z', '') : e.fecha_interposicion
                }))
            } catch (error) {
                this.error = error.message
                console.error('Error loading events:', error)
                Swal.fire('Error', 'No se pudieron cargar los eventos', 'error')
                return []
            } finally {
                this.isLoading = false
            }
        },

        async createEvent(eventData) {
            this.isLoading = true
            try {
                await calendarService.createEvent(eventData)
                Swal.fire('Éxito', 'Evento creado correctamente', 'success')
                return true
            } catch (error) {
                const msg = error.response?.data?.message || 'Error al crear el evento'
                Swal.fire('Error', msg, 'error')
                return false
            } finally {
                this.isLoading = false
            }
        },

        async updateEvent(id, eventData) {
            this.isLoading = true;
            try {
                await calendarService.updateEvent(id, eventData);
                Swal.fire('Éxito', 'Evento actualizado correctamente', 'success');
                return true;
            } catch (error) {
                const msg = error.response?.data?.message || 'Error al actualizar el evento';
                Swal.fire('Error', msg, 'error');
                return false;
            } finally {
                this.isLoading = false;
            }
        },

        async deleteEvent(id) {
            this.isLoading = true;
            try {
                await calendarService.deleteEvent(id);
                Swal.fire('Eliminado', 'El evento ha sido eliminado', 'success');
                return true;
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el evento', 'error');
                return false;
            } finally {
                this.isLoading = false;
            }
        }
    }
})
