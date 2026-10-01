// Pruebas de la lógica pura del formulario (sin Vue): reglas de justificación,
// prioridades y modelo de medios seleccionados.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    requiresJustification,
    justificationHelp,
    buildScoringReasoningText,
    HELP_OPTIONAL,
    HELP_REQUIRED,
} from '../src/utils/justification.js';
import { priorityTotal, prioritiesValid, totalMessage, prioritiesFromApi } from '../src/utils/priorities.js';
import {
    createEntry,
    entryFromApi,
    entryToPayload,
    hasContent,
    entriesMissingJustification,
    applyCandidate,
    originLabel,
} from '../src/utils/mediaEntries.js';
import { PRIORITY_PRESETS } from '../src/utils/constants.js';
import { shortDateTime, statusLabel, pluralize } from '../src/utils/format.js';

const candidate = (overrides = {}) => ({
    media_id: 7,
    media_name: 'Radio Uno',
    score: 88.5,
    data_confidence: 90,
    compatibility: 'alta',
    criteria: [{ name: 'Cobertura', score: 20, maximum: 25, explanation: 'Cubre.' }],
    ...overrides,
});

describe('regla de justificación', () => {
    it('solo la opción #1 del ranking de catálogo queda exenta', () => {
        assert.equal(requiresJustification({ selectionSource: 'catalog_scoring', scoringPosition: 1 }), false);
        assert.equal(requiresJustification({ selectionSource: 'catalog_scoring', scoringPosition: '1' }), false);
        assert.equal(requiresJustification({ selectionSource: 'catalog_scoring', scoringPosition: 2 }), true);
        assert.equal(requiresJustification({ selectionSource: 'manual', scoringPosition: 1 }), true);
        assert.equal(requiresJustification({ selectionSource: 'brief_recommendation' }), true);
    });

    it('muestra la ayuda correspondiente', () => {
        assert.equal(justificationHelp({ selectionSource: 'catalog_scoring', scoringPosition: 1 }), HELP_OPTIONAL);
        assert.equal(justificationHelp({ selectionSource: 'manual' }), HELP_REQUIRED);
    });

    it('arma el razonamiento inicial con los criterios del scoring', () => {
        const text = buildScoringReasoningText(candidate(), 2);
        assert.match(text, /posición 2 · puntaje 88.5\/100 · compatibilidad Alta · confianza de datos 90%/);
        assert.match(text, /- Cobertura: 20\/25. Cubre./);
        assert.ok(text.endsWith('Criterio adicional del analista:'));
    });
});

describe('prioridades de campaña', () => {
    it('todos los presets suman 100', () => {
        for (const preset of Object.values(PRIORITY_PRESETS)) assert.equal(priorityTotal(preset.weights), 100);
    });

    it('detecta totales inválidos y los explica', () => {
        const weights = { ...PRIORITY_PRESETS.balanced.weights, cost: 20 };
        assert.equal(prioritiesValid(weights), false);
        assert.match(totalMessage(weights), /Total: 105%/);
        assert.match(totalMessage(PRIORITY_PRESETS.balanced.weights), /100% ✓/);
    });

    it('usa "Equilibrada" cuando no hay prioridades guardadas', () => {
        assert.deepEqual(prioritiesFromApi({}), { preset: 'balanced', weights: PRIORITY_PRESETS.balanced.weights });
        assert.equal(prioritiesFromApi({ preset: 'territorial', weights: PRIORITY_PRESETS.territorial.weights }).preset, 'territorial');
    });
});

describe('medios seleccionados', () => {
    it('un medio en blanco no tiene contenido ni exige justificación', () => {
        const entry = createEntry();
        assert.equal(hasContent(entry), false);
        assert.deepEqual(entriesMissingJustification([entry]), []);
    });

    it('al llevar una recomendación del Brief precarga perfil, categoría y campos 6.x', () => {
        const entry = createEntry({ profile: ' Radio informativa ', category: 'Radio', fields: { '6.1': { value: 'Finalidad' } } });
        assert.equal(entry.medium, 'Radio informativa');
        assert.equal(entry.selectionSource, 'brief_recommendation');
        assert.equal(entry.fields['6.1'].value, 'Finalidad');
        assert.equal(originLabel(entry), 'Origen: recomendación de creatividad extraída del Brief.');
    });

    it('detecta los medios que faltan por justificar', () => {
        const a = createEntry({ profile: 'A', category: 'Radio' });
        const b = createEntry({ profile: 'B', category: 'Radio' });
        b.selectionJustification = 'ok';
        assert.deepEqual(entriesMissingJustification([a, b]), [a.uid]);
    });

    it('seleccionar un candidato pre-llena la justificación solo si cambia el medio', () => {
        const entry = createEntry({ profile: 'Radio informativa', category: 'Radio' });
        applyCandidate(entry, candidate(), { method: 'v1', position: 2 });
        assert.equal(entry.catalogMediaId, 7);
        assert.equal(entry.selectionSource, 'catalog_scoring');
        assert.equal(entry.scoringPosition, 2);
        assert.match(entry.selectionJustification, /Razonamiento del sistema de scoring/);

        entry.selectionJustification = 'Texto editado por el analista';
        applyCandidate(entry, candidate(), { method: 'v1', position: 2 }); // mismo medio
        assert.equal(entry.selectionJustification, 'Texto editado por el analista');

        applyCandidate(entry, candidate({ media_id: 8, media_name: 'Radio Dos' }), { method: 'v1', position: 1 });
        assert.match(entry.selectionJustification, /Razonamiento/); // medio distinto: se reemplaza
        assert.equal(requiresJustification(entry), false);
    });

    it('convierte desde y hacia la API sin perder datos', () => {
        const raw = {
            medium: 'Radio Uno', selection_justification: 'Porque sí', profile: 'Radio', category: 'Radio',
            selection_source: 'catalog_scoring', catalog_media_id: 7, catalog_media_name: 'Radio Uno',
            scoring_method: 'v1', scoring_score: 88.5, scoring_confidence: 90, scoring_compatibility: 'alta', scoring_position: 2,
            fields: { '6.1': { value: 'x', language_review: { ignored_keys: ['k'] } } },
        };
        const payload = entryToPayload(entryFromApi(raw));
        assert.equal(payload.catalog_media_id, 7);
        assert.equal(payload.scoring_position, 2);
        assert.equal(payload.selection_justification, 'Porque sí');
        assert.deepEqual(payload.fields['6.1'], { value: 'x', ignored_keys: ['k'] });
        assert.deepEqual(payload.fields['6.7'], { value: '', ignored_keys: [] });
    });
});

describe('formato', () => {
    it('recorta fechas ISO como las vistas originales', () => {
        assert.equal(shortDateTime('2026-10-01T06:09:12.345Z'), '2026-10-01 06:09');
        assert.equal(shortDateTime('2026-10-01T06:09:12.345Z', true), '2026-10-01 06:09:12');
        assert.equal(shortDateTime(null), '—');
    });
    it('traduce estados y pluraliza', () => {
        assert.equal(statusLabel('plan_medios_generado'), 'Plan de Medios generado');
        assert.equal(statusLabel('otro'), 'otro');
        assert.equal(pluralize(1, 'evento', 'eventos'), 'evento');
        assert.equal(pluralize(2, 'evento', 'eventos'), 'eventos');
    });
});
