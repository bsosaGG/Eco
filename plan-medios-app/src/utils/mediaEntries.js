// Modelo de los medios seleccionados (Etapa 3): creación, conversión desde/hacia la API
// y reglas de edición. Funciones puras, sin dependencias de Vue.
import { MEDIA_FIELD_NAMES } from './constants.js';
import { requiresJustification, buildScoringReasoningText } from './justification.js';

let counter = 0;
/** Identificador local estable para usar como `key` al listar medios. */
const nextUid = () => `medio-${Date.now().toString(36)}-${++counter}`;

export function emptyMediaFields(source = {}) {
    const fields = {};
    for (const fieldId of Object.keys(MEDIA_FIELD_NAMES)) {
        const raw = source[fieldId] || {};
        fields[fieldId] = {
            value: raw.value || '',
            ignoredKeys: Array.isArray(raw.ignored_keys)
                ? [...raw.ignored_keys]
                : Array.isArray(raw.language_review?.ignored_keys)
                    ? [...raw.language_review.ignored_keys]
                    : [],
        };
    }
    return fields;
}

/** Medio en blanco, o precargado con los datos de una recomendación del Brief. */
export function createEntry(recommendation = null) {
    const profile = (recommendation?.profile || '').trim();
    return {
        uid: nextUid(),
        medium: profile,
        selectionJustification: '',
        profile,
        category: (recommendation?.category || '').trim(),
        selectionSource: recommendation ? 'brief_recommendation' : 'manual',
        catalogMediaId: null,
        catalogMediaName: '',
        scoringMethod: '',
        scoringScore: null,
        scoringConfidence: null,
        scoringCompatibility: '',
        scoringPosition: null,
        fields: emptyMediaFields(recommendation?.fields || {}),
    };
}

/** Medio guardado en el servidor -> modelo de edición. */
export function entryFromApi(raw) {
    return {
        uid: nextUid(),
        medium: raw.medium || '',
        selectionJustification: raw.selection_justification || '',
        profile: raw.profile || '',
        category: raw.category || '',
        selectionSource: raw.selection_source || 'manual',
        catalogMediaId: raw.catalog_media_id ?? null,
        catalogMediaName: raw.catalog_media_name || '',
        scoringMethod: raw.scoring_method || '',
        scoringScore: raw.scoring_score ?? null,
        scoringConfidence: raw.scoring_confidence ?? null,
        scoringCompatibility: raw.scoring_compatibility || '',
        scoringPosition: raw.scoring_position ?? null,
        fields: emptyMediaFields(raw.fields || {}),
    };
}

/** Modelo de edición -> cuerpo que espera la API. */
export function entryToPayload(entry) {
    const fields = {};
    for (const [fieldId, field] of Object.entries(entry.fields)) {
        fields[fieldId] = { value: field.value, ignored_keys: field.ignoredKeys };
    }
    return {
        medium: entry.medium.trim(),
        selection_justification: entry.selectionJustification,
        profile: entry.profile,
        category: entry.category,
        selection_source: entry.selectionSource || 'manual',
        catalog_media_id: entry.catalogMediaId,
        catalog_media_name: entry.catalogMediaName,
        scoring_method: entry.scoringMethod,
        scoring_score: entry.scoringScore,
        scoring_confidence: entry.scoringConfidence,
        scoring_compatibility: entry.scoringCompatibility,
        scoring_position: entry.scoringPosition,
        fields,
    };
}

/** Un medio "tiene contenido" si tiene nombre o algún campo 6.x lleno. */
export function hasContent(entry) {
    return Boolean(entry.medium.trim()) || Object.values(entry.fields).some((field) => field.value.trim());
}

/** Medios para los que falta una justificación obligatoria (devuelve sus `uid`). */
export function entriesMissingJustification(entries) {
    return entries
        .filter((entry) => hasContent(entry) && requiresJustification(entry) && !entry.selectionJustification.trim())
        .map((entry) => entry.uid);
}

/**
 * Aplica al medio un candidato del ranking del catálogo. La justificación se
 * pre-llena con el razonamiento del scoring solo si cambia el medio elegido.
 */
export function applyCandidate(entry, candidate, { method, position }) {
    if (entry.catalogMediaId !== (candidate.media_id ?? null)) {
        entry.selectionJustification = buildScoringReasoningText(candidate, position);
    }
    entry.catalogMediaId = candidate.media_id ?? null;
    entry.catalogMediaName = candidate.media_name || '';
    entry.scoringMethod = method || '';
    entry.scoringScore = candidate.score ?? null;
    entry.scoringConfidence = candidate.data_confidence ?? null;
    entry.scoringCompatibility = candidate.compatibility || '';
    entry.scoringPosition = position || null;
    entry.selectionSource = 'catalog_scoring';
    entry.medium = candidate.media_name || entry.profile || '';
    return entry;
}

export function originLabel(entry) {
    if (entry.selectionSource === 'catalog_scoring') {
        return 'Origen: datos del Brief + selección humana apoyada por el catálogo de medios.';
    }
    if (entry.selectionSource === 'brief_recommendation') {
        return 'Origen: recomendación de creatividad extraída del Brief.';
    }
    return 'Origen: selección manual.';
}
