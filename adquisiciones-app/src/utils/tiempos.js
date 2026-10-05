// Cuánto tiempo lleva un expediente en un estado, y cuándo preocupa la espera.

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

// A partir de cuántos días en el mismo estado se marca atención y alerta (días corridos). Si el
// proceso necesita otros plazos, se cambian aquí.
export const DIAS_ATENCION = 2;
export const DIAS_ALERTA = 5;

/** Milisegundos entre dos instantes (texto ISO o fecha); nunca negativo. null si falta alguno. */
export const duracionMs = (desde, hasta) => {
    if (!desde || !hasta) return null;
    const ms = new Date(hasta).getTime() - new Date(desde).getTime();
    return Number.isNaN(ms) ? null : Math.max(0, ms);
};

/** "menos de 1 min", "35 min", "5 h 20 min", "3 d 4 h". */
export const formatDuracion = (ms) => {
    if (ms == null) return '—';
    if (ms < MINUTO) return 'menos de 1 min';
    if (ms < HORA) return `${Math.floor(ms / MINUTO)} min`;
    if (ms < DIA) {
        const horas = Math.floor(ms / HORA);
        const minutos = Math.floor((ms % HORA) / MINUTO);
        return minutos ? `${horas} h ${minutos} min` : `${horas} h`;
    }
    const dias = Math.floor(ms / DIA);
    const horas = Math.floor((ms % DIA) / HORA);
    return horas ? `${dias} d ${horas} h` : `${dias} d`;
};

/** 'normal', 'atencion' o 'alerta' según los días que lleva en el estado. */
export const nivelDeEspera = (ms) => {
    if (ms == null) return 'normal';
    if (ms >= DIAS_ALERTA * DIA) return 'alerta';
    if (ms >= DIAS_ATENCION * DIA) return 'atencion';
    return 'normal';
};

/** Clases del indicador según el nivel de espera. */
export const CLASES_NIVEL = {
    normal: 'bg-green-50 text-green-700 border-green-200',
    atencion: 'bg-amber-50 text-amber-700 border-amber-300',
    alerta: 'bg-red-50 text-red-700 border-red-300 font-semibold',
};
