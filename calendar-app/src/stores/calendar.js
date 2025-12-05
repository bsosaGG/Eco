import { defineStore } from 'pinia'
import calendarService from '../services/calendar.service'
import Swal from 'sweetalert2'

export const useCalendarStore = defineStore('calendar', {
    state: () => ({
        isLoading: false,
        error: null,
    }),
    actions: {
        async fetchEvents(start, end) {
            this.isLoading = true
            this.error = null
            try {
                const events = await calendarService.getEvents(start, end)
                console.log(events);
                // Transformar las fechas para quitar la 'Z' (UTC) y que el navegador
                // las interprete como hora local (Wall Time).
                return events.map(e => ({
                    ...e,
                    start_date: e.start_date ? e.start_date.replace('Z', '') : e.start_date,
                    end_date: e.end_date ? e.end_date.replace('Z', '') : e.end_date
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
