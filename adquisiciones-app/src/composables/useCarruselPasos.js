import { ref, computed } from 'vue';

/**
 * Carrusel de los pasos del proceso: muestra una tarjeta a la vez (solo los pasos que ya no están
 * pendientes). El estado vive donde se llama este composable, para que sobreviva a que la pantalla
 * recargue el expediente.
 *
 * @param {import('vue').Ref<Array>} pasos pasos del proceso (ver utils/pasos.js)
 */
export function useCarruselPasos(pasos) {
    const carouselIndex = ref(0);
    const pasosVisibles = computed(() => pasos.value.filter((p) => p.status !== 'pendiente'));
    const pasoActual = computed(() => pasosVisibles.value[carouselIndex.value] || null);
    const pasoActualKey = computed(() => pasoActual.value?.key || '');

    const irAPaso = (key) => {
        const idx = pasosVisibles.value.findIndex((p) => p.key === key);
        if (idx !== -1) carouselIndex.value = idx;
    };
    const pasoAnterior = () => {
        if (carouselIndex.value > 0) carouselIndex.value -= 1;
    };
    const pasoSiguiente = () => {
        if (carouselIndex.value < pasosVisibles.value.length - 1) carouselIndex.value += 1;
    };

    /** Tras cargar el expediente: se posiciona en el paso activo (o se ajusta si el índice quedó fuera de rango). */
    const sincronizar = () => {
        const visibles = pasosVisibles.value;
        const idxActivo = visibles.findIndex((p) => p.status === 'activo');
        if (idxActivo !== -1) {
            carouselIndex.value = idxActivo;
        } else if (carouselIndex.value >= visibles.length) {
            carouselIndex.value = Math.max(0, visibles.length - 1);
        }
    };

    return { carouselIndex, pasosVisibles, pasoActual, pasoActualKey, irAPaso, pasoAnterior, pasoSiguiente, sincronizar };
}
