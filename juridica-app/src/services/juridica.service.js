import api from './api';

export default {
    getJuicios(params = {}) {
        return api.get('/juridica', { params });
    },
    getJuicioAndHistory(id) {
        return api.get(`/juridica/${id}`);
    },
    createJuicio(data) {
        return api.post('/juridica', data);
    },
    updateJuicio(id, data) {
        return api.put(`/juridica/${id}`, data);
    },
    addHistorial(id, formData) {
        // formData must include 'archivo' if present
        return api.post(`/juridica/${id}/historial`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    exportDocx(id) {
        return api.get(`/juridica/${id}/export-docx`, {
            responseType: 'blob'
        });
    },
    getSuggestions(field, search) {
        return api.get('/juridica/suggestions', { params: { field, search } });
    }
};
