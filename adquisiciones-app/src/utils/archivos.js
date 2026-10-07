// Ver y descargar archivos que el API entrega como blob (el token viaja en la petición, así que no
// se puede abrir la URL directamente en el navegador).

const conTipo = (blob, nombre) => {
    if (blob.type || !/\.pdf$/i.test(nombre || '')) return blob;
    return new Blob([blob], { type: 'application/pdf' });
};

/**
 * Abre el archivo en otra pestaña. La pestaña se abre antes de pedir el archivo, en el mismo clic,
 * porque los navegadores bloquean las ventanas que se abren después de una espera.
 * @param {() => Promise<Blob>} obtenerBlob
 */
export const verArchivo = async (obtenerBlob, nombre = '') => {
    const ventana = window.open('', '_blank');
    try {
        const url = window.URL.createObjectURL(conTipo(await obtenerBlob(), nombre));
        if (ventana) ventana.location.href = url;
        else window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
        if (ventana) ventana.close();
        throw error;
    }
};

/** Descarga el archivo con el nombre indicado. */
export const guardarArchivo = async (obtenerBlob, nombre) => {
    const url = window.URL.createObjectURL(conTipo(await obtenerBlob(), nombre));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.setAttribute('download', nombre);
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.URL.revokeObjectURL(url);
};
