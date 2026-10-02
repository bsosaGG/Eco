// Estado de edición de un expediente (las 4 etapas comparten un único formulario).
//
// Flujo (igual que el sistema original): el analista edita las Etapas 1 a 3; avanzar de
// etapa guarda; las Solicitudes de Compra (Etapa 4) y el Word usan lo ÚLTIMO guardado.
import { defineStore } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import service from '../services/planMedios.service';
import { errorMessage, errorMessageFromBlob } from '../services/api';
import { saveBlob } from '../utils/format';
import { MAX_STAGE, MIN_STAGE, PRIORITY_PRESETS } from '../utils/constants';
import { prioritiesFromApi, prioritiesValid } from '../utils/priorities';
import {
    applyCandidate,
    createEntry,
    entriesMissingJustification,
    entryFromApi,
    entryToPayload,
    hasContent,
} from '../utils/mediaEntries';

const byFieldId = ([a], [b]) => {
    const [aMajor, aMinor] = a.split('.').map(Number);
    const [bMajor, bMinor] = b.split('.').map(Number);
    return aMajor - bMajor || aMinor - bMinor;
};

export const useExpedienteStore = defineStore('expediente', () => {
    // --- Datos del servidor ---
    const id = ref('');
    const loading = ref(false);
    const loadError = ref('');
    const meta = reactive({
        status: '',
        version: 0,
        createdAt: '',
        originalFilename: '',
        wordGenerated: false,
        recommendations: [],
        strategy: {},
        pieces: [],
        purchaseRequests: [],
    });

    // --- Formulario editable ---
    const fields = ref({});
    const priorities = reactive({ preset: 'balanced', weights: { ...PRIORITY_PRESETS.balanced.weights } });
    const mediaEntries = ref([]);

    // --- Ranking del catálogo ---
    const rankings = ref([]);
    const rankingMethod = ref('');
    const rankingState = ref('idle'); // idle | loading | ready | error

    // --- Estado de la interfaz ---
    const stage = ref(MIN_STAGE);
    const saving = ref(false);
    const generating = ref(false);
    const saved = ref(false); // true desde el último guardado hasta la siguiente edición
    const notice = ref({ type: '', text: '' });
    const hydrating = ref(false);

    const setNotice = (type, text) => { notice.value = { type, text }; };
    const clearNotice = () => { notice.value = { type: '', text: '' }; };

    // Cualquier edición posterior invalida el estado "guardado".
    watch([fields, priorities, mediaEntries], () => { if (!hydrating.value) saved.value = false; }, { deep: true });

    const missingJustification = computed(() => new Set(entriesMissingJustification(mediaEntries.value)));
    const prioritiesAreValid = computed(() => prioritiesValid(priorities.weights));
    const hasSelectedMedia = computed(() => mediaEntries.value.some(hasContent));

    // ------------------------------------------------------------------
    // Carga y guardado
    // ------------------------------------------------------------------

    function hydrate(detail) {
        hydrating.value = true;
        id.value = detail.expediente_id;
        meta.status = detail.status;
        meta.version = detail.version;
        meta.createdAt = detail.created_at;
        meta.originalFilename = detail.original_filename || '';
        meta.wordGenerated = Boolean(detail.word_generated);
        meta.recommendations = detail.media_recommendations || [];
        meta.strategy = detail.media_strategy || {};
        meta.pieces = detail.campaign_pieces || [];
        meta.purchaseRequests = detail.purchase_requests || [];

        const nextFields = {};
        for (const [fieldId, field] of Object.entries(detail.summary_fields || {}).sort(byFieldId)) {
            nextFields[fieldId] = {
                name: field.name,
                value: field.value || '',
                territory: field.territory || '',
                ignoredKeys: [...(field.language_review?.ignored_keys || [])],
            };
        }
        fields.value = nextFields;

        const loaded = prioritiesFromApi(detail.campaign_priorities);
        priorities.preset = loaded.preset;
        Object.assign(priorities.weights, loaded.weights);

        const entries = (detail.media_entries || []).map(entryFromApi);
        mediaEntries.value = entries.length ? entries : [createEntry()];
        hydrating.value = false;
    }

    async function load(expedienteId) {
        loading.value = true;
        loadError.value = '';
        rankings.value = [];
        rankingState.value = 'idle';
        clearNotice();
        saved.value = false;
        try {
            hydrate(await service.getExpediente(expedienteId));
        } catch (error) {
            id.value = expedienteId;
            loadError.value = errorMessage(error, 'No fue posible cargar el expediente.');
            return false;
        } finally {
            loading.value = false;
        }
        loadRankings();
        return true;
    }

    function buildPayload(planningAction) {
        const payloadFields = {};
        for (const [fieldId, field] of Object.entries(fields.value)) {
            payloadFields[fieldId] = { value: field.value, ignored_keys: field.ignoredKeys };
            if ('territory' in field && ['3.3', '3.4', '3.5'].includes(fieldId)) payloadFields[fieldId].territory = field.territory;
        }
        return {
            version: meta.version,
            planning_action: planningAction,
            fields: payloadFields,
            priorities: { preset: priorities.preset, weights: { ...priorities.weights } },
            media_entries: mediaEntries.value.filter(hasContent).map(entryToPayload),
        };
    }

    /**
     * Guarda el formulario. `action`: "draft" (borrador, no exige justificaciones),
     * "continue" (avanzar a solicitudes) o "generate" (antes de generar el Word).
     * @returns {Promise<{ok: boolean, stage?: number}>}
     */
    async function save(action = 'draft') {
        clearNotice();
        if (!prioritiesAreValid.value) {
            setNotice('error', 'Las prioridades de campaña deben sumar exactamente 100%.');
            return { ok: false, stage: 2 };
        }
        if (action !== 'draft' && missingJustification.value.size) {
            setNotice('error', 'Debes justificar la selección de los medios marcados antes de continuar.');
            return { ok: false, stage: 3 };
        }

        saving.value = true;
        try {
            const result = await service.saveResumen(id.value, buildPayload(action));
            meta.version = result.version;
            meta.status = result.status;
            meta.wordGenerated = Boolean(result.word_generated);
            saved.value = true;
            return { ok: true };
        } catch (error) {
            setNotice('error', errorMessage(error, 'No fue posible guardar los cambios.'));
            return { ok: false };
        } finally {
            saving.value = false;
        }
    }

    async function generatePlan() {
        const result = await save('generate');
        if (!result.ok) return result;
        generating.value = true;
        try {
            const generated = await service.generarPlanMedios(id.value);
            meta.status = generated.status;
            meta.version = generated.version;
            meta.wordGenerated = true;
            setNotice('success', 'El Plan de Medios fue generado. Ya puede descargarlo.');
            return { ok: true };
        } catch (error) {
            setNotice('error', `No fue posible generar el documento Word: ${errorMessage(error, 'error desconocido')}`);
            return { ok: false };
        } finally {
            generating.value = false;
        }
    }

    async function downloadPlan() {
        try {
            const response = await service.descargarPlanMedios(id.value);
            saveBlob(response.data, `plan_medios_${id.value}.docx`);
        } catch (error) {
            setNotice('error', await errorMessageFromBlob(error, 'No fue posible descargar el Plan de Medios.'));
        }
    }

    // ------------------------------------------------------------------
    // Ranking del catálogo
    // ------------------------------------------------------------------

    async function loadRankings() {
        if (!meta.recommendations.length) return;
        rankingState.value = 'loading';
        try {
            const result = await service.getRanking(id.value, 3);
            rankings.value = result.rankings || [];
            rankingMethod.value = result.method || '';
            rankingState.value = 'ready';
        } catch (error) {
            rankingState.value = 'error';
        }
    }

    // ------------------------------------------------------------------
    // Medios seleccionados
    // ------------------------------------------------------------------

    const profileOf = (recommendation) => (recommendation?.profile || '').trim();
    const entryForProfile = (profile) => mediaEntries.value.find((entry) => entry.profile.trim() === profile);
    const isBlank = (entry) => !hasContent(entry);

    /** Quita el medio en blanco que el formulario trae por defecto antes de agregar uno real. */
    function dropBlankEntry() {
        const index = mediaEntries.value.findIndex(isBlank);
        if (index >= 0) mediaEntries.value.splice(index, 1);
    }

    function addEntry() {
        const entry = createEntry();
        mediaEntries.value.push(entry);
        return entry;
    }

    function removeEntry(uid) {
        mediaEntries.value = mediaEntries.value.filter((entry) => entry.uid !== uid);
    }

    function profileAlreadySelected(recommendation) {
        const profile = profileOf(recommendation);
        return Boolean(profile) && Boolean(entryForProfile(profile));
    }

    function useRecommendation(recommendation) {
        if (profileAlreadySelected(recommendation)) return null;
        dropBlankEntry();
        const entry = createEntry(recommendation);
        mediaEntries.value.push(entry);
        return entry;
    }

    /** Selecciona un candidato del catálogo para el perfil de una recomendación del Brief. */
    function selectCandidate(recommendation, candidate, position) {
        let entry = entryForProfile(profileOf(recommendation));
        if (!entry) {
            dropBlankEntry();
            entry = createEntry(recommendation);
            mediaEntries.value.push(entry);
        }
        // Se trabaja sobre el objeto reactivo del arreglo para que la interfaz reaccione.
        const reactiveEntry = mediaEntries.value.find((item) => item.uid === entry.uid);
        applyCandidate(reactiveEntry, candidate, { method: rankingMethod.value, position });
        return reactiveEntry;
    }

    function selectedCatalogIdFor(recommendation) {
        const entry = entryForProfile(profileOf(recommendation));
        return entry ? entry.catalogMediaId : null;
    }

    function setStage(next) {
        stage.value = Math.max(MIN_STAGE, Math.min(MAX_STAGE, Number(next) || MIN_STAGE));
    }

    return {
        id, loading, loadError, meta, fields, priorities, mediaEntries,
        rankings, rankingState, stage, saving, generating, saved, notice,
        missingJustification, prioritiesAreValid, hasSelectedMedia,
        setNotice, clearNotice, setStage,
        load, save, generatePlan, downloadPlan, loadRankings,
        addEntry, removeEntry, useRecommendation, profileAlreadySelected, selectCandidate, selectedCatalogIdFor,
    };
});
