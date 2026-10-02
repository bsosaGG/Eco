// Revisión ortográfica en línea de un campo de texto (LanguageTool vía el API del core).
//
// - Revisa 900 ms después de que el usuario deja de escribir, y al salir del campo.
// - Descarta respuestas atrasadas si ya hubo una petición más reciente.
// - Las sugerencias "ignoradas" se guardan junto con el campo (ignoredKeys).
// - El corrector es opcional: si no está disponible solo se muestra un aviso.
import { computed, onBeforeUnmount, ref } from 'vue';
import service from '../services/planMedios.service';
import { REVIEW_DELAY_MS } from '../utils/constants';

export const suggestionKey = (s) => [s.rule_id, s.offset, s.length, s.original_text].join(':');

export function useLanguageReview({ getText, setText, ignoredKeys }) {
    const status = ref('pending'); // pending | empty | checking | clean | warning | error
    const message = ref('Revisión ortográfica pendiente.');
    const suggestions = ref([]);
    const dictionaryMessage = ref('');

    let timer = null;
    let requestNumber = 0;
    let programmaticChange = false;

    const visible = computed(() => suggestions.value.filter((s) => !ignoredKeys.value.includes(suggestionKey(s))));

    function describe() {
        const count = visible.value.length;
        if (count === 0) {
            status.value = 'clean';
            message.value = 'No se encontraron observaciones ortográficas.';
        } else {
            status.value = 'warning';
            message.value =
                count === 1
                    ? 'Se encontró 1 sugerencia para revisión humana.'
                    : `Se encontraron ${count} sugerencias para revisión humana.`;
        }
    }

    async function review() {
        const text = getText();
        if (!text.trim()) {
            suggestions.value = [];
            status.value = 'empty';
            message.value = 'El campo está vacío.';
            return;
        }
        const current = ++requestNumber;
        status.value = 'checking';
        message.value = 'Revisando ortografía…';
        try {
            const result = await service.revisarTexto(text, 'es');
            if (current !== requestNumber) return; // llegó una respuesta más reciente
            if (result.status !== 'completed') {
                suggestions.value = [];
                status.value = 'error';
                message.value = result.message || 'El corrector no está disponible.';
                return;
            }
            suggestions.value = result.suggestions || [];
            describe();
        } catch (error) {
            if (current !== requestNumber) return;
            suggestions.value = [];
            status.value = 'error';
            message.value = 'No fue posible realizar la revisión ortográfica.';
        }
    }

    function schedule(immediate = false) {
        clearTimeout(timer);
        timer = setTimeout(review, immediate ? 0 : REVIEW_DELAY_MS);
    }

    /** Llamar cuando el usuario edita el campo. */
    function onInput() {
        if (programmaticChange) programmaticChange = false;
        else ignoredKeys.value = []; // un texto nuevo invalida lo que se había ignorado
        schedule();
    }

    const onBlur = () => schedule(true);

    function accept(suggestion, replacement) {
        const text = getText();
        const end = suggestion.offset + suggestion.length;
        programmaticChange = true;
        setText(text.slice(0, suggestion.offset) + replacement + text.slice(end));
        schedule(true);
    }

    function ignore(suggestion) {
        ignoredKeys.value = [...ignoredKeys.value, suggestionKey(suggestion)];
        if (visible.value.length === 0) {
            status.value = 'clean';
            message.value = 'No quedan sugerencias pendientes.';
        }
    }

    async function addToDictionary(suggestion, selectedText = '') {
        const term = window.prompt(
            'Escriba el término o nombre completo que desea agregar al diccionario:',
            selectedText.trim() || suggestion.original_text
        );
        if (!term || !term.trim()) return;
        try {
            const result = await service.agregarTermino(term.trim());
            dictionaryMessage.value = result.message;
            schedule(true);
        } catch (error) {
            status.value = 'error';
            message.value = 'No fue posible agregar el término al diccionario.';
        }
    }

    onBeforeUnmount(() => clearTimeout(timer));

    return { status, message, visible, dictionaryMessage, schedule, onInput, onBlur, accept, ignore, addToDictionary };
}
