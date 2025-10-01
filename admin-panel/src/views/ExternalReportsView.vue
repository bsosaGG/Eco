<template>
    <div class="container-fluid">
        <h1>Herramientas Remotas</h1>
        <p class="text-muted">
            Generación de reportes y acciones en sistemas legados.
        </p>
        <hr />

        <div class="row">
            <div v-if="authStore.hasPermission('extl-rprts-prensa:read')" class="col-12 col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title mb-0"><i class="bi bi-newspaper me-2"></i>Reportes de Prensa</h5>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <p class="card-text">Descargar el reporte de recursos por rango de fechas.</p>
                        <div class="mb-3">
                            <label for="startDatePrensa" class="form-label">Fecha de Inicio:</label>
                            <input type="date" class="form-control" id="startDatePrensa" v-model="fechaInicioPrensa">
                        </div>
                        <div class="mb-3">
                            <label for="endDatePrensa" class="form-label">Fecha de Fin:</label>
                            <input type="date" class="form-control" id="endDatePrensa" v-model="fechaFinPrensa">
                        </div>
                        <div class="mb-3">
                            <label for="formatPrensa" class="form-label">Formato:</label>
                            <select class="form-select" id="formatPrensa" v-model="formatoReportePrensaSeleccionado">
                                <option value="xlsx">Excel (XLSX)</option>
                                <option value="ods">OpenDocument (ODS)</option>
                            </select>
                        </div>
                        <div class="mt-auto">
                            <button class="btn btn-primary w-100" @click="descargarReportePrensa"
                                :disabled="isDownloadingPrensaReport || !formatoReportePrensaSeleccionado || !fechaInicioPrensa || !fechaFinPrensa">
                                <span v-if="isDownloadingPrensaReport" class="spinner-border spinner-border-sm"
                                    role="status" aria-hidden="true"></span>
                                <i v-else class="bi bi-download me-2"></i>
                                Descargar
                            </button>
                            <p v-if="reportPrensaDownloadError" class="text-danger text-center small mt-2">{{
                                reportPrensaDownloadError }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="authStore.hasPermission('extl-rprts-guinadri:read')" class="col-12 col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title mb-0"><i class="bi bi-file-earmark-spreadsheet-fill me-2"></i>Reportes de
                            Guinadri 2023</h5>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <p class="card-text">Selecciona las tablas de la base de datos para generar un reporte.</p>
                        <div class="mb-3">
                            <label for="formatGuinadri" class="form-label">Formato:</label>
                            <select class="form-select" id="formatGuinadri" v-model="formatoReporteTablasSeleccionado">
                                <option value="xlsx">Excel (XLSX)</option>
                                <option value="ods">OpenDocument (ODS)</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="tablesGuinadri" class="form-label">Tablas:</label>
                            <select class="form-select" id="tablesGuinadri" v-model="tablasSeleccionadas" multiple
                                style="height: 150px;">
                                <option v-for="table in availableTables" :key="table" :value="table">{{ table }}
                                </option>
                            </select>
                            <div class="d-flex justify-content-end mt-2">
                                <button class="btn btn-link btn-sm p-0 me-2" @click="selectAllTables">Seleccionar
                                    todo</button>
                                <button class="btn btn-link btn-sm p-0 text-danger"
                                    @click="deselectAllTables">Deseleccionar todo</button>
                            </div>
                        </div>
                        <div class="mt-auto">
                            <button class="btn btn-primary w-100" @click="descargarReporteTablas"
                                :disabled="isDownloadingTablasReport || !formatoReporteTablasSeleccionado || tablasSeleccionadas.length === 0">
                                <span v-if="isDownloadingTablasReport" class="spinner-border spinner-border-sm"
                                    role="status" aria-hidden="true"></span>
                                <i v-else class="bi bi-download me-2"></i>
                                Descargar
                            </button>
                            <p v-if="reportTablasDownloadError" class="text-danger text-center small mt-2">{{
                                reportTablasDownloadError }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="authStore.hasPermission('extl-rprts-guinadri:update')" class="col-12 col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title mb-0"><i class="bi bi-key-fill me-2"></i>Contraseña Usuario Guinadri 2023
                        </h5>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <p class="card-text">Ingresa el correo del usuario y la nueva contraseña.</p>
                        <div class="mb-3">
                            <label for="userEmail" class="form-label">Correo Electrónico:</label>
                            <input type="email" class="form-control" id="userEmail" v-model="userEmailToReset"
                                placeholder="usuario@ejemplo.com">
                        </div>
                        <div class="mb-3">
                            <label for="newPassword" class="form-label">Nueva Contraseña:</label>
                            <input type="password" class="form-control" id="newPassword" v-model="newPasswordForReset">
                        </div>
                        <div class="mt-auto">
                            <button class="btn btn-warning w-100" @click="resetUserPassword"
                                :disabled="isResettingPassword || !userEmailToReset || !newPasswordForReset">
                                <span v-if="isResettingPassword" class="spinner-border spinner-border-sm" role="status"
                                    aria-hidden="true"></span>
                                <i v-else class="bi bi-shield-check me-2"></i>
                                Restablecer
                            </button>
                            <p v-if="resetPasswordError" class="text-danger text-center small mt-2">{{
                                resetPasswordError }}</p>
                            <p v-if="resetPasswordSuccess" class="text-success text-center small mt-2">{{
                                resetPasswordSuccess }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="authStore.hasPermission('extl-rprts-srvcios-gnrls:delete')"
                class="col-12 col-md-6 col-lg-8 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-pencil-square me-2"></i>Gestión de Detalles de Solicitud (Almacén)
                        </h5>
                    </div>
                    <div class="card-body">
                        <p class="card-text">Busca una solicitud por su ID para ver y eliminar sus detalles de forma
                            individual.</p>

                        <!-- SECCIÓN DE BÚSQUEDA -->
                        <div class="input-group mb-3">
                            <span class="input-group-text">ID de Solicitud:</span>
                            <input type="number" class="form-control" placeholder="Ej: 12345"
                                v-model="solicitudIdToSearch" @keyup.enter="fetchDetails">
                            <button class="btn btn-primary" @click="fetchDetails"
                                :disabled="isLoadingDetails || !solicitudIdToSearch">
                                <span v-if="isLoadingDetails" class="spinner-border spinner-border-sm" role="status"
                                    aria-hidden="true"></span>
                                <i v-else class="bi bi-search"></i>
                                Buscar
                            </button>
                        </div>
                        <p v-if="searchError" class="text-danger text-center small mt-2">{{ searchError }}</p>

                        <!-- SECCIÓN DE RESULTADOS -->
                        <div v-if="!isLoadingDetails && details.length > 0">
                            <hr>
                            <h6>Resultados para la Solicitud #{{ lastSearchedId }}</h6>
                            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                                <table class="table table-sm table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th scope="col" style="width: 50px;">Sel.</th>
                                            <th scope="col">Producto</th>
                                            <th scope="col">Cantidad</th>
                                            <th scope="col">ID Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="detail in details" :key="detail.id">
                                            <td>
                                                <input class="form-check-input" type="checkbox" :value="detail.id"
                                                    v-model="selectedDetails">
                                            </td>
                                            <td>{{ detail.nombre }}</td>
                                            <td>{{ detail.csolicitada }}</td>
                                            <td><small class="text-muted">{{ detail.id }}</small></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="d-flex justify-content-end align-items-center mt-3">
                                <p v-if="deleteSuccess" class="text-success small m-0 me-3">{{ deleteSuccess }}</p>
                                <p v-if="deleteError" class="text-danger small m-0 me-3">{{ deleteError }}</p>
                                <button class="btn btn-danger" @click="deleteSelectedDetails"
                                    :disabled="isDeleting || selectedDetails.length === 0">
                                    <span v-if="isDeleting" class="spinner-border spinner-border-sm" role="status"
                                        aria-hidden="true"></span>
                                    <i v-else class="bi bi-trash3-fill"></i>
                                    Eliminar {{ selectedDetails.length }} seleccionado(s)
                                </button>
                            </div>
                        </div>
                        <div v-else-if="!isLoadingDetails && searchAttempted">
                            <p class="text-center text-muted mt-4">No se encontraron detalles para la solicitud #{{
                                lastSearchedId }}.</p>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import apiClient from '@/services/api.service';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();

// --- Estado para Reporte de Prensa ---
const fechaInicioPrensa = ref('');
const fechaFinPrensa = ref('');
const formatoReportePrensaSeleccionado = ref('xlsx');
const isDownloadingPrensaReport = ref(false);
const reportPrensaDownloadError = ref('');

const descargarReportePrensa = async () => {
    isDownloadingPrensaReport.value = true;
    reportPrensaDownloadError.value = '';
    try {
        const response = await apiClient.get('/websites/prensa-recursos-mes', {
            params: {
                startDate: fechaInicioPrensa.value,
                endDate: fechaFinPrensa.value,
                format: formatoReportePrensaSeleccionado.value
            },
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = `reporte_prensa_${fechaInicioPrensa.value}_a_${fechaFinPrensa.value}.${formatoReportePrensaSeleccionado.value}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

    } catch (err: any) {
        reportPrensaDownloadError.value = err.response?.data?.message || 'Error al generar el reporte.';
    } finally {
        isDownloadingPrensaReport.value = false;
    }
};

// --- Estado para Reporte de Guinadri ---
const availableTables = ref(["AA", "B21", "B22", "B23", "B24", "B25", "B27", "B28", "B29", "B261", "B262", "B263", "C31", "C32", "C33", "C34", "C35", "C36", "C37", "C38", "C39", "C40", "CS01", "D41", "D42", "D43", "E51", "E53", "E54", "E55", "E521", "E522", "F61", "F62", "G1", "J1", "J2", "J4"]);
const tablasSeleccionadas = ref<string[]>([]); // Tipado explícito para claridad
const formatoReporteTablasSeleccionado = ref('xlsx');
const isDownloadingTablasReport = ref(false);
const reportTablasDownloadError = ref('');

// Función para seleccionar todas las tablas
const selectAllTables = () => {
    tablasSeleccionadas.value = [...availableTables.value];
};

// Función para deseleccionar todas las tablas
const deselectAllTables = () => {
    tablasSeleccionadas.value = [];
};

const descargarReporteTablas = async () => {
    isDownloadingTablasReport.value = true;
    reportTablasDownloadError.value = '';
    try {
        const response = await apiClient.get('/website-agn', {
            params: {
                tables: tablasSeleccionadas.value.join(','),
                format: formatoReporteTablasSeleccionado.value
            },
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = `reporte_guinadri_tablas.${formatoReporteTablasSeleccionado.value}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

    } catch (err: any) {
        reportTablasDownloadError.value = err.response?.data?.message || 'Error al generar el reporte de tablas.';
    } finally {
        isDownloadingTablasReport.value = false;
    }
};

// --- Estado para Reseteo de Contraseña ---
const userEmailToReset = ref('');
const newPasswordForReset = ref('');
const isResettingPassword = ref(false);
const resetPasswordError = ref('');
const resetPasswordSuccess = ref('');

const resetUserPassword = async () => {
    isResettingPassword.value = true;
    resetPasswordError.value = '';
    resetPasswordSuccess.value = '';
    try {
        const response = await apiClient.post('/website-agn/users/reset-password', {
            email: userEmailToReset.value,
            newPassword: newPasswordForReset.value,
        });
        resetPasswordSuccess.value = response.data.message;
    } catch (err: any) {
        resetPasswordError.value = err.response?.data?.error || 'Error al restablecer la contraseña.';
    } finally {
        isResettingPassword.value = false;
    }
};

// --- ESTADO PARA LA NUEVA TARJETA DE GESTIÓN DE DETALLES ---
interface SolicitudDetail {
    id: number;
    nombre: string;
    cantidad: number;
    detalle: string;
    csolicitada: number;
}

const solicitudIdToSearch = ref<number | null>(null);
const lastSearchedId = ref<number | null>(null);
const isLoadingDetails = ref(false);
const searchError = ref('');
const searchAttempted = ref(false); // Para saber si ya se hizo una búsqueda

const details = ref<SolicitudDetail[]>([]);
const selectedDetails = ref<number[]>([]);

const isDeleting = ref(false);
const deleteError = ref('');
const deleteSuccess = ref('');

const fetchDetails = async () => {
    if (!solicitudIdToSearch.value) return;

    isLoadingDetails.value = true;
    searchError.value = '';
    deleteSuccess.value = '';
    deleteError.value = '';
    details.value = [];
    selectedDetails.value = [];
    searchAttempted.value = true;
    lastSearchedId.value = solicitudIdToSearch.value;


    try {
        const response = await apiClient.get<SolicitudDetail[]>(`/website-scspr/details/${solicitudIdToSearch.value}`);
        details.value = response.data;
    } catch (err: any) {
        searchError.value = err.response?.data?.error || 'Error al buscar los detalles.';
        if (err.response?.data?.details) {
            searchError.value += ` Detalles: ${err.response.data.details}`;
        }
    } finally {
        isLoadingDetails.value = false;
    }
};

const deleteSelectedDetails = async () => {
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar ${selectedDetails.value.length} registro(s)? Esta acción no se puede deshacer.`);
    if (!confirmed) {
        return; // Detiene la ejecución si el usuario presiona "Cancelar"
    }

    if (selectedDetails.value.length === 0) return;

    isDeleting.value = true;
    deleteError.value = '';
    deleteSuccess.value = '';

    try {
        const response = await apiClient.post('/website-scspr/delete-details', {
            detail_ids: selectedDetails.value,
        });
        deleteSuccess.value = response.data.message;
        // Limpiar selección y recargar la lista para mostrar el estado actual
        selectedDetails.value = [];
        await fetchDetails();

    } catch (err: any) {
        deleteError.value = err.response?.data?.error || 'Ocurrió un error al eliminar.';
        if (err.response?.data?.details) {
            deleteError.value += ` Detalles: ${err.response.data.details}`;
        }
    } finally {
        isDeleting.value = false;
    }
};

</script>

<style scoped>
.card-title {
    font-size: 1.1rem;
}

.table-responsive thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: white;
    /* O el color de fondo de tu tabla para que no se vea el texto de abajo al hacer scroll */
    box-shadow: inset 0 -2px 0 #dee2e6;
    /* Línea inferior opcional para separar visualmente */
}
</style>