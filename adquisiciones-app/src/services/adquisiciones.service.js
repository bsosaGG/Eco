import api from './api';

export default {
    // Catálogos
    getUnidades() {
        return api.get('/adquisiciones/catalogos/unidades').then((r) => r.data);
    },
    getRenglones() {
        return api.get('/adquisiciones/catalogos/renglones').then((r) => r.data);
    },
    getPartidas() {
        return api.get('/adquisiciones/catalogos/partidas').then((r) => r.data);
    },
    getEstados() {
        return api.get('/adquisiciones/catalogos/estados').then((r) => r.data);
    },

    // Proveedores
    getProveedores(params = {}) {
        return api.get('/adquisiciones/proveedores', { params }).then((r) => r.data);
    },
    createProveedor(data) {
        return api.post('/adquisiciones/proveedores', data).then((r) => r.data);
    },
    updateProveedor(id, data) {
        return api.put(`/adquisiciones/proveedores/${id}`, data).then((r) => r.data);
    },

    // Expedientes (CU-01)
    getExpedientes(params = {}) {
        return api.get('/adquisiciones/expedientes', { params }).then((r) => r.data);
    },
    getExpedienteById(id) {
        return api.get(`/adquisiciones/expedientes/${id}`).then((r) => r.data);
    },
    crearExpediente(data) {
        return api.post('/adquisiciones/expedientes', data).then((r) => r.data);
    },
    asignarExpediente(id, funcionario_responsable) {
        return api
            .post(`/adquisiciones/expedientes/${id}/asignar`, { funcionario_responsable })
            .then((r) => r.data);
    },
    cambiarEstado(id, nuevoEstadoId, comentario) {
        return api
            .put(`/adquisiciones/expedientes/${id}/estado`, { nuevoEstadoId, comentario })
            .then((r) => r.data);
    },
    devolverExpediente(id, data) {
        return api.post(`/adquisiciones/expedientes/${id}/devolver`, data).then((r) => r.data);
    },
    getBitacora(id) {
        return api.get(`/adquisiciones/expedientes/${id}/bitacora`).then((r) => r.data);
    },

    // Cotizaciones (CU-02)
    registrarCotizacion(idExpediente, data) {
        return api.post(`/adquisiciones/expedientes/${idExpediente}/cotizaciones`, data).then((r) => r.data);
    },
    adjudicarCotizacion(idExpediente, idCotizacion) {
        return api
            .post(`/adquisiciones/expedientes/${idExpediente}/cotizaciones/${idCotizacion}/adjudicar`)
            .then((r) => r.data);
    },
};
