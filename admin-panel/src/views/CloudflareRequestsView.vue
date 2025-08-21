<template>
    <div class="container mt-4">
        <div class="card">
            <div class="card-header">
                <h1>Reporte de Peticiones de Cloudflare</h1>
            </div>
            <div class="card-body">
                <p>
                    Introduce uno o más "Zone Tags" de Cloudflare separados por comas. El sistema consultará el
                    tráfico del último año y generará un archivo Excel con el total de peticiones por mes.
                </p>

                <div class="mb-3">
                    <label for="zoneTagsInput" class="form-label"><strong>Zone Tags</strong></label>
                    <textarea id="zoneTagsInput" class="form-control" rows="3" v-model="zoneTagsInput"
                        placeholder="e5404b294aea4e63281f1eccd75f5ec9, another-zone-tag-..."
                        :disabled="isLoading"></textarea>
                </div>

                <button class="btn btn-primary" @click="handleGenerateReport"
                    :disabled="isLoading || !zoneTagsInput.trim()">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"
                        aria-hidden="true"></span>
                    <i v-else class="bi bi-download me-2"></i>
                    {{ isLoading ? 'Generando...' : 'Generar y Descargar Reporte' }}
                </button>

                <div v-if="errorMessage" class="alert alert-danger mt-3" role="alert">
                    <strong>Error:</strong> {{ errorMessage }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import cloudflareService from '@/services/cloudflare.service';

const zoneTagsInput = ref('e5404b294aea4e63281f1eccd75f5ec9'); // Valor de ejemplo
const isLoading = ref(false);
const errorMessage = ref('');

const handleGenerateReport = async () => {
    isLoading.value = true;
    errorMessage.value = '';

    // Limpiar y parsear la entrada: separar por comas y quitar espacios en blanco
    const zoneTags = zoneTagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    if (zoneTags.length === 0) {
        errorMessage.value = 'Por favor, introduce al menos un Zone Tag válido.';
        isLoading.value = false;
        return;
    }

    try {
        const blob = await cloudflareService.generateReport(zoneTags);

        // Lógica para descargar el archivo en el navegador
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-cloudflare-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();

        // Limpieza
        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        errorMessage.value = 'No se pudo generar el reporte. Revisa la consola para más detalles.';
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
.card-header h1 {
    margin-bottom: 0;
}
</style>