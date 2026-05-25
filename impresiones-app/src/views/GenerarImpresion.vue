<template>
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

        <!-- COLUMNA IZQUIERDA: Generación de Documentos -->
        <div class="space-y-6">

            <!-- CASO 1: Formulario Original de Impresiones -->
            <template v-if="!isCorrespondencia">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Generar Documento</h1>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form @submit.prevent="handleSubmit" class="space-y-6 w-full">

                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Enviado Por</label>
                                <input type="text" v-model="formDataImpresiones.enviado_por" required
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="Ej. Juan Pérez">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Unidad Remitente</label>
                                <input type="text" v-model="formDataImpresiones.unidad_remitente" required
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="Ej. Dirección de Informática">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Destinatario</label>
                                <input type="text" v-model="formDataImpresiones.destinatario" required
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="Ej. María López">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Unidad Destinatario</label>
                                <input type="text" v-model="formDataImpresiones.unidad_destinatario" required
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="Ej. Recursos Humanos">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Asunto / Descripción</label>
                            <textarea v-model="formDataImpresiones.descripcion" rows="3" required
                                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                                placeholder="Breve descripción del documento"></textarea>
                        </div>

                        <!-- Notificaciones -->
                        <div v-if="errorMsg" class="rounded-md bg-red-50 p-4">
                            <div class="flex">
                                <div class="ml-3 text-sm text-red-700">{{ errorMsg }}</div>
                            </div>
                        </div>

                        <div class="flex justify-end pt-4">
                            <button type="submit" :disabled="loading"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 gap-2">
                                <DownloadIcon v-if="!loading" class="w-4 h-4" />
                                <Loader2Icon v-else class="w-4 h-4 animate-spin" />
                                {{ loading ? 'Generando...' : 'Generar y Descargar' }}
                            </button>
                        </div>

                    </form>
                </div>
            </template>

            <!-- CASO 2: Formulario Nuevo de Correspondencia -->
            <template v-else>
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Generar Correspondencia</h1>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form @submit.prevent="handleSubmit" class="space-y-6 w-full">

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Remitente</label>
                                <input type="text" v-model="formDataCorrespondencia.remitente" required
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="Nombre del remitente">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Destinatario</label>
                                <input type="text" v-model="formDataCorrespondencia.destinatario" required
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="Nombre del destinatario">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">No. Oficio</label>
                                <input type="text" v-model="formDataCorrespondencia.no_oficio" required
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="Ej. OF-SCSCR-001-2026">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Recepción</label>
                                <input type="date" v-model="formDataCorrespondencia.fecha_recepcion" required
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">No. Folios</label>
                                <input type="number" v-model="formDataCorrespondencia.no_folios" required min="1"
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                                <select v-model="formDataCorrespondencia.prioridad" required
                                    class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border bg-white">
                                    <option value="atencion_inmediata">Atención Inmediata</option>
                                    <option value="urgente">Urgente</option>
                                    <option value="normal">Normal</option>
                                    <option value="conocimiento">Conocimiento</option>
                                    <option value="archivo">Archivo</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                            <textarea v-model="formDataCorrespondencia.asunto" rows="3" required
                                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                                placeholder="Asunto o contenido principal..."></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2 font-semibold">Asignado A</label>
                            <div class="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label v-for="opcion in opcionesAsignado" :key="opcion.value"
                                    class="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" :value="opcion.value"
                                        v-model="formDataCorrespondencia.asignado_a"
                                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4">
                                    {{ opcion.label }}
                                </label>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Instrucciones del Despacho
                                Superior</label>
                            <textarea v-model="formDataCorrespondencia.instrucciones_despacho_superior" rows="3"
                                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                                placeholder="Instrucciones del despacho superior..."></textarea>
                        </div>

                        <!-- Notificaciones -->
                        <div v-if="errorMsg" class="rounded-md bg-red-50 p-4">
                            <div class="flex">
                                <div class="ml-3 text-sm text-red-700">{{ errorMsg }}</div>
                            </div>
                        </div>

                        <div class="flex justify-end pt-4">
                            <button type="submit" :disabled="loading"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 gap-2">
                                <DownloadIcon v-if="!loading" class="w-4 h-4" />
                                <Loader2Icon v-else class="w-4 h-4 animate-spin" />
                                {{ loading ? 'Generando...' : 'Generar y Descargar' }}
                            </button>
                        </div>

                    </form>
                </div>
            </template>

        </div>

        <!-- COLUMNA DERECHA: Recepción / Cumplimiento -->
        <div class="space-y-6">
            <div class="flex justify-between items-center mt-8 xl:mt-0">
                <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
                    {{ isCorrespondencia ? 'Registro de Cumplimiento' : 'Registro de Recepción' }}
                </h1>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form @submit.prevent="handleReceiveSubmit" class="space-y-6 w-full">
                    <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                {{ isCorrespondencia ? 'No. Control / Secuencia' : 'Correlativo (Número)' }}
                            </label>
                            <input type="number" v-model="receiveData.secuencia" required min="1"
                                class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                placeholder="Ej. 1">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                {{ isCorrespondencia ? 'Cumplido Por (Nombre Libre)' : 'Recibido Por (Nombre Libre)' }}
                            </label>
                            <input type="text" v-model="receiveData.nombre_recibe" required
                                class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                placeholder="Ej. Oficial de Seguridad">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                {{ isCorrespondencia ? 'Fecha y Hora de Cumplimiento' : 'Fecha y Hora' }}
                            </label>
                            <input type="datetime-local" v-model="receiveData.fecha_recibido" required
                                class="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2 px-3 border">
                        </div>
                    </div>

                    <div v-if="receiveSuccessMsg" class="rounded-md bg-green-50 p-4">
                        <div class="flex">
                            <div class="ml-3 text-sm text-green-700">{{ receiveSuccessMsg }}</div>
                        </div>
                    </div>

                    <div v-if="receiveErrorMsg" class="rounded-md bg-red-50 p-4">
                        <div class="flex">
                            <div class="ml-3 text-sm text-red-700">{{ receiveErrorMsg }}</div>
                        </div>
                    </div>

                    <div class="flex justify-end pt-4">
                        <button type="submit" :disabled="receiveLoading"
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 gap-2">
                            <Loader2Icon v-if="receiveLoading" class="w-4 h-4 animate-spin" />
                            {{ receiveLoading ? 'Guardando...' : (isCorrespondencia ? 'Marcar como Cumplido' : 'Dar por Recibido') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { DownloadIcon, Loader2Icon } from 'lucide-vue-next';
import api from '../services/api';

// Detección de ruta
const isCorrespondencia = computed(() => window.location.pathname.startsWith('/correspondencia'));

const loading = ref(false);
const errorMsg = ref('');

// Formulario 1: Impresiones (Original)
const formDataImpresiones = ref({
    enviado_por: '',
    unidad_remitente: '',
    destinatario: '',
    unidad_destinatario: '',
    descripcion: ''
});

// Formulario 2: Correspondencia (¡NUEVO!)
const formDataCorrespondencia = ref({
    remitente: '',
    destinatario: '',
    no_oficio: '',
    fecha_recepcion: '',
    no_folios: 1,
    prioridad: 'normal', // Valor por defecto
    asunto: '',
    asignado_a: [], // Arreglo para opciones múltiples
    instrucciones_despacho_superior: ''
});

// Opciones fijas para la selección múltiple
const opcionesAsignado = [
    { value: 'subsecretaria', label: 'Subsecretaría' },
    { value: 'direccion_general', label: 'Dirección General' },
    { value: 'unidades_admon', label: 'Unidades Admon.' },
    { value: 'udaf', label: 'UDAF' },
    { value: 'jefa_de_despacho', label: 'Jefa de Despacho' },
    { value: 'asesores', label: 'Asesores' },
    { value: 'unidad_sustantiva', label: 'Unidad Sustantiva' },
    { value: 'medios', label: 'Medios' }
];

// Datos de Recepción / Cumplimiento
const receiveLoading = ref(false);
const receiveErrorMsg = ref('');
const receiveSuccessMsg = ref('');

const receiveData = ref({
    secuencia: '',
    nombre_recibe: '', // Mapeará a "Cumplido Por" en correspondencia
    fecha_recibido: '' // Mapeará a "Fecha de Cumplimiento" en correspondencia
});

const handleSubmit = async () => {
    if (!confirm("¿Está seguro de que desea generar el documento con estos datos?")) return;

    loading.value = true;
    errorMsg.value = '';

    try {
        // Seleccionar los datos correspondientes según el contexto de la ruta
        const datosFormularioFinal = isCorrespondencia.value
            ? { ...formDataCorrespondencia.value }
            : { ...formDataImpresiones.value };

        // Transformamos "YYYY-MM-DD" a "DD/MM/YYYY" usando split
        if (datosFormularioFinal.fecha_recepcion) {
            const [anio, mes, dia] = datosFormularioFinal.fecha_recepcion.split('-');
            datosFormularioFinal.fecha_recepcion = `${dia}/${mes}/${anio}`;
            // Para "9952-11-11" esto enviará: "11/11/9952"
        }

        const payload = {
            datos_formulario: datosFormularioFinal
        };

        const response = await api.post('/generar', payload, { responseType: 'blob' });

        // Extraer nombre del archivo del header Content-Disposition si es posible
        let filename = isCorrespondencia.value ? 'correspondencia_generada.xlsx' : 'documento_generado.xlsx';
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        // Crear enlace temporal de descarga y forzar clic
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);

        // Reset de campos de texto largo tras generación exitosa
        if (isCorrespondencia.value) {
            formDataCorrespondencia.value.asunto = '';
            formDataCorrespondencia.value.instrucciones_despacho_superior = '';
        } else {
            formDataImpresiones.value.descripcion = '';
        }

    } catch (error) {
        console.error("Error generando documento:", error);
        // Intentar leer el mensaje de error si viene en JSON a pesar de responseType 'blob'
        if (error.response && error.response.data && error.response.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const errData = JSON.parse(reader.result);
                    errorMsg.value = errData.message || "Error al generar el documento.";
                } catch (e) {
                    errorMsg.value = "Error al generar el documento.";
                }
            };
            reader.readAsText(error.response.data);
        } else {
            errorMsg.value = error.response?.data?.message || "Ocurrió un error inesperado al generar el documento.";
        }
    } finally {
        loading.value = false;
    }
};

const handleReceiveSubmit = async () => {
    const confirmMessage = isCorrespondencia.value
        ? "¿Confirma que este documento ha sido cumplido y los datos son correctos?"
        : "¿Confirma que este documento ha sido recibido físicamente y los datos son correctos?";

    if (!confirm(confirmMessage)) return;

    receiveLoading.value = true;
    receiveErrorMsg.value = '';
    receiveSuccessMsg.value = '';

    try {
        const payload = {
            secuencia: receiveData.value.secuencia,
            nombre_recibe: receiveData.value.nombre_recibe,
            fecha_recibido: receiveData.value.fecha_recibido
        };

        const response = await api.patch('/recibido', payload);

        receiveSuccessMsg.value = response.data.message || (isCorrespondencia.value
            ? "Documento marcado como cumplido exitosamente."
            : "Documento marcado como recibido exitosamente.");

        // Limpiar formulario
        receiveData.value.secuencia = '';
        receiveData.value.nombre_recibe = '';
        receiveData.value.fecha_recibido = '';

        setTimeout(() => { receiveSuccessMsg.value = ''; }, 5000);
    } catch (error) {
        console.error("Error al registrar recepción/cumplimiento:", error);
        receiveErrorMsg.value = error.response?.data?.message || (isCorrespondencia.value
            ? "Ocurrió un error al registrar el cumplimiento del documento."
            : "Ocurrió un error al registrar la recepción.");
    } finally {
        receiveLoading.value = false;
    }
};
</script>
