// Regla de justificación de selección (misma que aplica el servidor).
//
// La justificación es obligatoria SALVO cuando el medio elegido es la opción #1 del
// ranking del motor de scoring. El servidor la vuelve a validar; esta copia solo
// permite avisar al analista mientras escribe.
import { COMPATIBILITY_LABELS } from './constants.js';

export const HELP_REQUIRED =
    'Explique por qué se selecciona este medio. Es obligatoria salvo cuando el medio corresponde a la primera opción recomendada por el sistema de scoring.';
export const HELP_OPTIONAL =
    'Este medio corresponde a la primera opción del ranking de scoring: la justificación es opcional, pero puede agregar sus propios criterios.';
export const ERROR_MESSAGE = 'Debes justificar la selección de este medio antes de continuar.';

export function requiresJustification(entry) {
    return !(entry.selectionSource === 'catalog_scoring' && Number(entry.scoringPosition) === 1);
}

export function justificationHelp(entry) {
    return requiresJustification(entry) ? HELP_REQUIRED : HELP_OPTIONAL;
}

export function compatibilityLabel(value) {
    return COMPATIBILITY_LABELS[value] || value || 'Sin clasificar';
}

/** Texto inicial de la justificación cuando se elige un medio del ranking. */
export function buildScoringReasoningText(candidate, position) {
    const lines = (candidate.criteria || []).map(
        (criterion) => `- ${criterion.name}: ${criterion.score}/${criterion.maximum}. ${criterion.explanation}`
    );
    const header =
        `Razonamiento del sistema de scoring (posición ${position} · puntaje ${candidate.score}/100 · ` +
        `compatibilidad ${compatibilityLabel(candidate.compatibility)} · confianza de datos ${candidate.data_confidence}%):`;
    return [header, ...lines, '', 'Criterio adicional del analista:'].join('\n');
}
