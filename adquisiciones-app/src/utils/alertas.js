import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Avisos de la app con SweetAlert2:
//  - confirmar(): pregunta en el centro de la pantalla antes de una acción importante.
//  - notificar: aviso corto en la esquina superior derecha (resultado de una acción, un error, un dato).
const COLOR_ACENTO = '#1e88e5';
const COLOR_PELIGRO = '#dc2626';
const COLOR_CANCELAR = '#6b7280';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
});

export const notificar = {
    exito: (titulo) => Toast.fire({ icon: 'success', title: titulo }),
    error: (titulo) => Toast.fire({ icon: 'error', title: titulo, timer: 6000 }),
    aviso: (titulo) => Toast.fire({ icon: 'warning', title: titulo, timer: 5000 }),
    info: (titulo) => Toast.fire({ icon: 'info', title: titulo }),
};

/**
 * Aviso informativo al centro de la pantalla, con un solo botón (por ejemplo, para comunicar que el expediente
 * ya no está en la bandeja de la persona). Se cierra al aceptar.
 */
export const informar = async ({ titulo, texto = '', icono = 'info', boton = 'Aceptar' }) => {
    await Swal.fire({
        title: titulo,
        text: texto,
        icon: icono,
        confirmButtonText: boton,
        confirmButtonColor: COLOR_ACENTO,
        heightAuto: false,
    });
};

/**
 * Bloquea la pantalla con un indicador mientras corre un proceso largo (generar un PDF, subir un archivo,
 * enviar un formulario). `texto` dice qué se está haciendo. Devuelve lo que devuelva `tarea`; si falla, el
 * indicador se cierra y el error sigue de largo para que quien llama avise.
 * La tarea arranca en el acto (sin esperar a que el aviso termine de abrirse): así, un `window.open` dentro de
 * ella sigue contando como parte del clic de la persona y el navegador no lo bloquea.
 */
export const conCarga = async (texto, tarea) => {
    Swal.fire({
        title: texto,
        text: 'Por favor espere; este proceso puede tardar unos segundos.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        heightAuto: false,
        didOpen: () => Swal.showLoading(),
    });
    try {
        return await tarea();
    } finally {
        Swal.close();
    }
};

/**
 * Pregunta antes de actuar. Devuelve true si la persona confirma.
 * `peligro: true` pinta el botón de rojo y deja el foco en "Cancelar" (para acciones que no se deshacen).
 * El texto se muestra como texto, nunca como HTML.
 */
export const confirmar = async ({ titulo, texto = '', confirmar: etiqueta = 'Sí, continuar', cancelar = 'Cancelar', peligro = false }) => {
    const { isConfirmed } = await Swal.fire({
        title: titulo,
        text: texto,
        icon: peligro ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonText: etiqueta,
        cancelButtonText: cancelar,
        confirmButtonColor: peligro ? COLOR_PELIGRO : COLOR_ACENTO,
        cancelButtonColor: COLOR_CANCELAR,
        reverseButtons: true,
        focusCancel: peligro,
        heightAuto: false,
    });
    return isConfirmed;
};
