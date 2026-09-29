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

    // Búsqueda de apoyo en el catálogo público de insumos MAGA/SIGES (sin precio;
    // solo ayuda a estandarizar descripción/unidad al armar un renglón).
    buscarInsumosMaga(q) {
        return api.get('/adquisiciones/insumos-maga', { params: { q } }).then((r) => r.data);
    },

    // Usuarios asignados a una unidad solicitante (para el dropdown de "firma 2" en la
    // Solicitud de Compra -- solo devuelve los que ya existan asignados de momento).
    getUsuariosPorUnidad(idUnidad) {
        return api.get(`/adquisiciones/catalogos/unidades/${idUnidad}/usuarios`).then((r) => r.data);
    },

    descargarSolicitudPdf(idExpediente) {
        return api.get(`/adquisiciones/expedientes/${idExpediente}/pdf`, { responseType: 'blob' });
    },

    // Administración de firmantes por unidad (usuarios_unidad_solicitante)
    getAsignacionesUnidad(idUnidad) {
        return api.get(`/adquisiciones/catalogos/unidades/${idUnidad}/asignaciones`).then((r) => r.data);
    },
    asignarUsuarioUnidad(idUnidad, data) {
        return api.post(`/adquisiciones/catalogos/unidades/${idUnidad}/asignaciones`, data).then((r) => r.data);
    },
    quitarAsignacionUnidad(idUnidad, idUsuario) {
        return api.delete(`/adquisiciones/catalogos/unidades/${idUnidad}/asignaciones/${idUsuario}`).then((r) => r.data);
    },

    // Unidades Solicitantes (catálogo administrable)
    getUnidadesSolicitantes(params = {}) {
        return api.get('/adquisiciones/unidades', { params }).then((r) => r.data);
    },
    createUnidadSolicitante(data) {
        return api.post('/adquisiciones/unidades', data).then((r) => r.data);
    },
    updateUnidadSolicitante(id, data) {
        return api.put(`/adquisiciones/unidades/${id}`, data).then((r) => r.data);
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
    // Usuarios del módulo (para el selector de "Asignar a" — solo gente que
    // realmente pertenece a Adquisiciones, no toda la plataforma).
    getUsuariosModulo() {
        return api.get('/adquisiciones/usuarios').then((r) => r.data);
    },
    asignarExpediente(id, idUsuarioAsignado) {
        return api
            .post(`/adquisiciones/expedientes/${id}/asignar`, { id_usuario_asignado: idUsuarioAsignado })
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

    // CDP (CU-03)
    elaborarCdp(idExpediente, data) {
        return api.post(`/adquisiciones/expedientes/${idExpediente}/cdp`, data).then((r) => r.data);
    },
    aprobarCdp(idCdp) {
        return api.post(`/adquisiciones/cdp/${idCdp}/aprobar`).then((r) => r.data);
    },
    voboCdp(idCdp) {
        return api.post(`/adquisiciones/cdp/${idCdp}/vobo`).then((r) => r.data);
    },

    // Orden de Compra (CU-04)
    elaborarOrdenCompra(idExpediente, data) {
        return api.post(`/adquisiciones/expedientes/${idExpediente}/orden-compra`, data).then((r) => r.data);
    },
    aprobarOrdenCompra(idOrdenCompra) {
        return api.post(`/adquisiciones/orden-compra/${idOrdenCompra}/aprobar`).then((r) => r.data);
    },
    autorizarOrdenCompra(idOrdenCompra) {
        return api.post(`/adquisiciones/orden-compra/${idOrdenCompra}/autorizar`).then((r) => r.data);
    },

    // Recepción y Documentos de Soporte (CU-05 / CU-06)
    registrarRecepcion(idOrdenCompra, data) {
        return api.post(`/adquisiciones/orden-compra/${idOrdenCompra}/recepcion`, data).then((r) => r.data);
    },
    adjuntarDocumentoSoporte(idExpediente, formData) {
        return api
            .post(`/adquisiciones/expedientes/${idExpediente}/documentos-soporte`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((r) => r.data);
    },
    trasladarAContabilidad(idExpediente) {
        return api.post(`/adquisiciones/expedientes/${idExpediente}/trasladar-contabilidad`).then((r) => r.data);
    },
    descargarDocumentoSoporte(archivoUrl) {
        return api.get(`/uploads/${archivoUrl}`, { responseType: 'blob' });
    },

    // Fase Financiera (CU-07 / CU-08 / CU-09)
    registrarCompromiso(idExpediente, data) {
        return api.post(`/adquisiciones/expedientes/${idExpediente}/compromiso`, data).then((r) => r.data);
    },
    registrarDevengado(idCompromiso, data) {
        return api.post(`/adquisiciones/compromiso/${idCompromiso}/devengado`, data).then((r) => r.data);
    },
    solicitarPago(idDevengado, data) {
        return api.post(`/adquisiciones/devengado/${idDevengado}/solicitar-pago`, data).then((r) => r.data);
    },
    autorizarPago(idSolicitudPago) {
        return api.post(`/adquisiciones/solicitud-pago/${idSolicitudPago}/autorizar`).then((r) => r.data);
    },

    // Reportes / vistas administrativas (listados cross-expediente)
    getReporteCotizaciones() {
        return api.get('/adquisiciones/reportes/cotizaciones').then((r) => r.data);
    },
    getReporteCdp() {
        return api.get('/adquisiciones/reportes/cdp').then((r) => r.data);
    },
    getReporteOrdenesCompra() {
        return api.get('/adquisiciones/reportes/ordenes-compra').then((r) => r.data);
    },
    getReporteFinanciera() {
        return api.get('/adquisiciones/reportes/financiera').then((r) => r.data);
    },
    getReporteResumen() {
        return api.get('/adquisiciones/reportes/resumen').then((r) => r.data);
    },
};
