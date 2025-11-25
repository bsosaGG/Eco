import apiClient from '@/services/api.service';

export function useFileDownloader() {
    /**
     * Descarga un archivo protegido y lo abre en una nueva pestaña.
     * @param url URL completa o relativa del archivo.
     * @param filename Nombre opcional para el archivo (si se fuera a forzar descarga).
     */
    const downloadFile = async (url: string, filename?: string) => {
        if (!url) return;

        try {
            const response = await apiClient.get(url, {
                responseType: 'blob', // Importante: esperar un binario
            });

            // Crear un objeto URL local para el blob recibido
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const objectUrl = window.URL.createObjectURL(blob);

            // Abrir en nueva pestaña para visualización (comportamiento 'inline')
            window.open(objectUrl, '_blank');

            // Nota: Para forzar descarga en lugar de abrir, se usaría un anchor hidden:
            /*
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename || 'archivo';
            link.click();
            */

            // Limpieza: Revocar el objeto URL después de un tiempo prudencial
            // para liberar memoria, aunque al abrir en nueva pestaña el ciclo de vida es distinto.
            // Si se abre en nueva pestaña, el blob debe persistir un momento.
            setTimeout(() => {
                window.URL.revokeObjectURL(objectUrl);
            }, 10000); // 10 segundos

        } catch (error) {
            console.error('Error al descargar archivo:', error);
            alert('No se pudo abrir el archivo. Verifique sus permisos o intente nuevamente.');
        }
    };

    return {
        downloadFile
    };
}
