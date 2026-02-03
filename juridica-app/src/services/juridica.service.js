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
    downloadAttachment(historialId) {
        return api.get(`/juridica/historial/${historialId}/adjunto`, {
            responseType: 'blob'
        });
    },
    exportDocx(id) {
        return api.get(`/juridica/${id}/export-docx`, {
            responseType: 'blob'
        });
    },
    getSuggestions(field, search) {
        return api.get('/juridica/suggestions', { params: { field, search } });
    },
    searchActores(search, tipo) {
        return api.get('/juridica/actores/search', { params: { search, tipo } });
    },
    createActor(data) {
        return api.post('/juridica/actores', data);
    },
    getActorById(id) {
        return api.get(`/juridica/actores/${id}`);
    },
    getAuditLogs(id) {
        return api.get(`/juridica/${id}/audit-logs`);
    },
    getStats() {
        return api.get('/juridica/stats');
    }
};
