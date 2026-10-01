import api from './api';

const base = '/plan-medios';
const enc = encodeURIComponent;

// Un descarga llega como Blob; el componente decide cómo guardarla.
const blobGet = (url) => api.get(url, { responseType: 'blob' });
const blobPost = (url, data) => api.post(url, data, { responseType: 'blob' });

export default {
    // --- Expedientes ---
    listExpedientes(q = '', limite = 200) {
        return api.get(`${base}/expedientes`, { params: { q: q || undefined, limite } }).then((r) => r.data.expedientes);
    },
    createExpediente(file) {
        const form = new FormData();
        form.append('brief', file);
        // Sin Content-Type fijo: el navegador agrega el boundary del multipart.
        return api
            .post(`${base}/expedientes`, form, { headers: { 'Content-Type': undefined } })
            .then((r) => r.data);
    },
    getExpediente(id) {
        return api.get(`${base}/expedientes/${enc(id)}`).then((r) => r.data);
    },
    saveResumen(id, payload) {
        return api.put(`${base}/expedientes/${enc(id)}/resumen`, payload).then((r) => r.data);
    },
    getRanking(id, limite = 3) {
        return api.get(`${base}/expedientes/${enc(id)}/ranking-medios`, { params: { limite } }).then((r) => r.data);
    },
    getAuditoria(id) {
        return api.get(`${base}/expedientes/${enc(id)}/auditoria`).then((r) => r.data);
    },

    // --- Plan de Medios (Word) ---
    generarPlanMedios(id) {
        return api.post(`${base}/expedientes/${enc(id)}/plan-medios`).then((r) => r.data);
    },
    descargarPlanMedios(id) {
        return blobGet(`${base}/expedientes/${enc(id)}/documentos/plan-medios`);
    },

    // --- Solicitudes de Compra (Excel) ---
    prepararSolicitud(id, index, form) {
        return api.post(`${base}/expedientes/${enc(id)}/solicitudes-compra/${index}/preparar`, form).then((r) => r.data);
    },
    generarSolicitud(id, index, form) {
        return blobPost(`${base}/expedientes/${enc(id)}/solicitudes-compra/${index}/generar`, form);
    },
    justificacionIA(id, index) {
        // La IA local puede tardar varios minutos: sin límite de tiempo en esta petición.
        return api
            .post(`${base}/expedientes/${enc(id)}/solicitudes-compra/${index}/justificacion-ia`, null, { timeout: 0 })
            .then((r) => r.data);
    },

    // --- Revisión ortográfica ---
    revisarTexto(text, language = 'es') {
        return api.post(`${base}/revision-ortografica`, { text, language }).then((r) => r.data);
    },
    agregarTermino(term) {
        return api.post(`${base}/diccionario-institucional`, { term }).then((r) => r.data);
    },
};
