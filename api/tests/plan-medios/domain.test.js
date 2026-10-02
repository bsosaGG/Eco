// Pruebas unitarias de las reglas de negocio puras del módulo Plan de Medios.
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { SRC } = require("./helpers/golden-paths");

const domain = (p) => require(path.join(SRC, "services/plan-medios/domain", p));
const justification = domain("selection-justification");
const audit = domain("selection-audit");
const { buildCampaignPriorities } = domain("campaign-priorities");
const { applySummaryUpdate } = domain("summary-update");
const { toFixedHalfEven, formatThousands, humanNumber } = domain("scoring/numeric");
const { isSuggestionProtected, filterProtectedSuggestions, normalizeTerm } = domain("spell-check");
const { compactText, validateGeneratedText, buildAuthorizedSource } = domain("purchase-justification");
const { limitWords, validateNeutrality, todayInSpanish } = domain("purchase-request");
const { rankRecommendation } = domain("scoring/engine");

describe("regla de justificación de selección", () => {
  it("solo exime la posición 1 del ranking de catálogo", () => {
    assert.equal(justification.justificationRequired({ selection_source: "catalog_scoring", scoring_position: 1 }), false);
    assert.equal(justification.justificationRequired({ selection_source: "catalog_scoring", scoring_position: "1" }), false);
    assert.equal(justification.justificationRequired({ selection_source: "catalog_scoring", scoring_position: 2 }), true);
    assert.equal(justification.justificationRequired({ selection_source: "manual", scoring_position: 1 }), true);
    assert.equal(justification.justificationRequired({}), true);
    assert.equal(justification.justificationRequired(null), true);
  });

  it("lista todos los medios sin justificar", () => {
    const entries = [
      { medium: "A", selection_source: "manual", selection_justification: "   " },
      { medium: "B", selection_source: "catalog_scoring", scoring_position: 1 },
      { medium: "C", selection_source: "catalog_scoring", scoring_position: 3, selection_justification: "ok" },
      { medium: "D" },
    ];
    assert.throws(() => justification.validateSelectionJustifications(entries), (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /Medio 1: A/);
      assert.match(error.message, /Medio 4: D/);
      assert.doesNotMatch(error.message, /Medio 2|Medio 3/);
      return true;
    });
  });

  it("normaliza posiciones inválidas a null", () => {
    for (const value of [undefined, null, "", "abc", 0, -2, 1.5]) assert.equal(justification.normalizeScoringPosition(value), null);
    assert.equal(justification.normalizeScoringPosition("3"), 3);
  });
});

describe("auditoría de selecciones (diff)", () => {
  const a = { catalog_media_id: 1, medium: "A", selection_justification: "x", profile: "P1" };

  it("sin cambios no genera eventos", () => {
    assert.deepEqual(audit.diffMediaEntries([a], [{ ...a }]), []);
  });

  it("detecta seleccionado, removido y actualizado", () => {
    const b = { catalog_media_id: 2, medium: "B" };
    const events = audit.diffMediaEntries([a], [b]);
    assert.deepEqual(events.map((e) => e.event_type).sort(), ["removed", "selected"]);
    const updated = audit.diffMediaEntries([a], [{ ...a, selection_justification: "y" }]);
    assert.equal(updated[0].event_type, "updated");
    assert.equal(updated[0].previous_entry.selection_justification, "x");
  });

  it("identifica por perfil del Brief cuando no hay medio de catálogo", () => {
    const manual = { medium: "Radio X", profile: "Radio regional" };
    assert.deepEqual(audit.diffMediaEntries([manual], [{ ...manual, medium: "Radio X" }]), []);
    assert.equal(audit.diffMediaEntries([manual], [{ ...manual, medium: "Radio Y" }])[0].event_type, "updated");
  });

  it("reconoce la recomendación #1 y el nombre de campaña", () => {
    assert.equal(audit.matchedTopRecommendation({ selection_source: "catalog_scoring", scoring_position: 1 }), true);
    assert.equal(audit.matchedTopRecommendation({ selection_source: "manual", scoring_position: 1 }), false);
    assert.equal(audit.campaignName({ fields: { "1.1": { value: "Vacunación" } } }), "Vacunación");
    assert.equal(audit.campaignName({}), "");
  });
});

describe("prioridades de campaña", () => {
  const ok = { audience: 25, geography: 25, reach: 20, cost: 15, affinity: 15 };
  it("acepta pesos que suman 100", () => {
    const result = buildCampaignPriorities({ preset: "balanced", weights: ok });
    assert.equal(result.total, 100);
    assert.equal(result.preset, "balanced");
  });
  it("rechaza sumas distintas de 100, valores fuera de rango y no enteros", () => {
    assert.throws(() => buildCampaignPriorities({ weights: { ...ok, cost: 20 } }), /100%/);
    assert.throws(() => buildCampaignPriorities({ weights: { ...ok, cost: 101 } }), /entre 0 y 100/);
    assert.throws(() => buildCampaignPriorities({ weights: { ...ok, cost: "x" } }), /entero/);
    assert.throws(() => buildCampaignPriorities({ weights: { ...ok, cost: 15.5 } }), /entero/);
  });
  it("un preset desconocido pasa a 'custom'", () => {
    assert.equal(buildCampaignPriorities({ preset: "inventado", weights: ok }).preset, "custom");
  });
});

describe("aplicar cambios del formulario", () => {
  const base = () => ({
    fields: { "1.1": { name: "Campaña", value: "Original", status: "completed", source: "structured_brief" } },
    media_entries: [],
  });
  const input = (extra = {}) => ({ planning_action: "draft", ...extra });

  it("no modifica el resumen original y marca el origen como revisión de usuario", () => {
    const original = base();
    const { summary } = applySummaryUpdate({ summary: original, input: input({ fields: { "1.1": { value: "Nueva" } } }) });
    assert.equal(original.fields["1.1"].value, "Original");
    assert.equal(summary.fields["1.1"].value, "Nueva");
    assert.equal(summary.fields["1.1"].source, "user_review");
  });

  it("un campo vacío queda 'not_found' y los contadores se recalculan", () => {
    const { summary } = applySummaryUpdate({ summary: base(), input: input({ fields: { "1.1": { value: "  " } } }) });
    assert.equal(summary.fields["1.1"].status, "not_found");
    assert.equal(summary.completed_count, 0);
    assert.equal(summary.missing_count, 1);
  });

  it("el territorio de un público lo marca como completado aunque no tenga descripción", () => {
    const summary = { fields: { "3.3": { name: "Público primario", value: "", status: "not_found", source: "structured_brief", territory: "" } } };
    const result = applySummaryUpdate({ summary, input: input({ fields: { "3.3": { value: "", territory: "Petén" } } }) }).summary;
    assert.equal(result.fields["3.3"].status, "completed");
    assert.equal(result.fields["3.3"].territory, "Petén");
  });

  it("descarta medios vacíos, normaliza los datos de scoring y limita a 50", () => {
    const entries = [
      { medium: "", fields: {} },
      { medium: " Radio ", catalog_media_id: "7", scoring_score: "88.456", scoring_position: "2", scoring_confidence: "abc", fields: { "6.1": { value: " x " } } },
    ];
    const { summary } = applySummaryUpdate({ summary: base(), input: input({ media_entries: entries }) });
    assert.equal(summary.media_entries.length, 1);
    const [entry] = summary.media_entries;
    assert.equal(entry.medium, "Radio");
    assert.equal(entry.catalog_media_id, 7);
    assert.equal(entry.scoring_score, 88.46);
    assert.equal(entry.scoring_position, 2);
    assert.equal(entry.scoring_confidence, null);
    assert.equal(entry.fields["6.1"].value, "x");
    assert.equal(entry.selection_source, "manual");
    assert.throws(() => applySummaryUpdate({ summary: base(), input: input({ media_entries: new Array(51).fill({ medium: "x" }) }) }), /máximo de 50/);
    assert.throws(() => applySummaryUpdate({ summary: base(), input: input({ media_entries: "no" }) }), /lista/);
  });

  it("borrador permite medios sin justificar; continuar o generar no", () => {
    const entries = [{ medium: "Radio", selection_source: "manual", fields: {} }];
    assert.doesNotThrow(() => applySummaryUpdate({ summary: base(), input: input({ media_entries: entries }) }));
    for (const action of ["continue", "generate"]) {
      assert.throws(() => applySummaryUpdate({ summary: base(), input: input({ planning_action: action, media_entries: entries }) }), /justificar/);
    }
  });

  it("rechaza acciones de planificación desconocidas", () => {
    assert.throws(() => applySummaryUpdate({ summary: base(), input: { planning_action: "borrar" } }), /inválida/);
  });
});

describe("formato numérico idéntico a Python", () => {
  it("redondea la mitad al par", () => {
    assert.equal(toFixedHalfEven(2.5, 0), "2");
    assert.equal(toFixedHalfEven(3.5, 0), "4");
    assert.equal(toFixedHalfEven(0.125, 2), "0.12");
    assert.equal(toFixedHalfEven(2.795, 2), "2.79"); // en binario es 2.79499...
    assert.equal(toFixedHalfEven(1.005, 2), "1.00");
  });
  it("formatea miles y números legibles", () => {
    assert.equal(formatThousands(1234567.891, 2), "1,234,567.89");
    assert.equal(humanNumber(2795000), "2.79 M");
    assert.equal(humanNumber(45000), "45 mil");
    assert.equal(humanNumber(800), "800");
  });
});

describe("corrector ortográfico", () => {
  it("protege las sugerencias que se solapan con un término institucional", () => {
    const text = "Viajamos a alta verapaz mañana";
    assert.equal(isSuggestionProtected(text, 11, 4, ["Alta Verapaz"]), true);
    assert.equal(isSuggestionProtected(text, 0, 7, ["Alta Verapaz"]), false);
    assert.equal(isSuggestionProtected(text, 11, 4, ["Petén"]), false);
  });
  it("renumera y limita los reemplazos", () => {
    const suggestions = [
      { offset: 0, length: 3, replacements: ["a", "b", "c", "d", "e", "f", "g"] },
      { offset: 20, length: 3, replacements: [] },
    ];
    const result = filterProtectedSuggestions("x".repeat(30), suggestions, []);
    assert.deepEqual(result.map((s) => s.id), [0, 1]);
    assert.equal(result[0].replacements.length, 5);
  });
  it("normaliza espacios en los términos", () => {
    assert.equal(normalizeTerm("  Alta   Verapaz "), "Alta Verapaz");
  });
});

describe("neutralidad de la solicitud de compra", () => {
  const entry = { medium: "Radio Estrella", catalog_media_name: "Estrella FM" };
  const request = (extra) => ({ description: "D", justification: "J", technical_specifications: "T", ...extra });
  it("bloquea nombres de medio/proveedor y términos internos", () => {
    assert.throws(() => validateNeutrality(request({ justification: "Contratar Radio Estrella" }), entry), /neutralidad/);
    assert.throws(() => validateNeutrality(request({ description: "según el scoring" }), entry), /información interna/);
    assert.doesNotThrow(() => validateNeutrality(request(), entry));
  });
  it("ignora nombres demasiado cortos para evitar falsos positivos", () => {
    assert.doesNotThrow(() => validateNeutrality(request({ justification: "Por la radio" }), { medium: "TV", catalog_media_name: "" }));
  });
  it("da la fecha en español", () => {
    assert.equal(todayInSpanish(new Date("2026-10-01T12:00:00Z")), "1 de octubre de 2026");
  });
  it("limita palabras sin cortar la primera oración", () => {
    assert.equal(limitWords("Uno dos tres. Cuatro cinco seis siete.", 4), "Uno dos tres.");
    assert.equal(limitWords("Esta oración larga no cabe en tres palabras.", 3), "Esta oración larga no cabe en tres palabras.");
  });
});

describe("borrador de justificación con IA", () => {
  const long = ("palabra ".repeat(60)).trim() + ".";
  const source = { campaign: "X", service_profile: "Radio", communication_objective: "alcanzar 18 años" };
  it("recorta el texto en un límite natural", () => {
    assert.equal(compactText("Primera frase. Segunda frase larga que no cabe", 20), "Primera frase.");
  });
  it("solo envía al modelo datos autorizados", () => {
    const authorized = buildAuthorizedSource({
      summary: { fields: { "1.1": { value: "Campaña" }, "3.1": { value: "Objetivo" } } },
      mediaEntry: { medium: "Radio Estrella", profile: "Radio informativa", catalog_media_name: "Estrella FM", scoring_score: 90, fields: {} },
    });
    assert.deepEqual(Object.keys(authorized).sort(), ["campaign", "communication_objective", "service_profile"]);
    assert.doesNotMatch(JSON.stringify(authorized), /Estrella|90/);
  });
  it("bloquea textos vacíos, fuera de rango, con info interna o con cifras inventadas", () => {
    const entry = { medium: "Radio Estrella" };
    assert.throws(() => validateGeneratedText({ text: "", source, mediaEntry: entry }), /vacío/);
    assert.throws(() => validateGeneratedText({ text: "muy corto", source, mediaEntry: entry }), /longitud/);
    assert.throws(() => validateGeneratedText({ text: `${long} Radio Estrella`, source, mediaEntry: entry }), /nombre del medio/);
    assert.throws(() => validateGeneratedText({ text: `${long} según el ranking`, source, mediaEntry: entry }), /información interna/);
    assert.throws(() => validateGeneratedText({ text: `${long} 2500 personas`, source, mediaEntry: entry }), /cifras/);
    assert.doesNotThrow(() => validateGeneratedText({ text: `${long} 18 años`, source, mediaEntry: entry }));
  });
});

describe("scoring: casos límite", () => {
  const summary = { fields: {} };
  it("exige perfil y categoría", () => {
    assert.throws(() => rankRecommendation({ summary, recommendation: { profile: "", category: "Radio" }, catalog: [] }), /profile y category/);
  });
  it("informa categoría no soportada y ausencia de candidatos", () => {
    assert.equal(rankRecommendation({ summary, recommendation: { profile: "X", category: "Otro" }, catalog: [] }).status, "unsupported_category");
    assert.equal(rankRecommendation({ summary, recommendation: { profile: "X", category: "Radio" }, catalog: [] }).status, "no_candidates");
  });
  it("un medio sin datos recibe puntaje conservador, advertencias y confianza baja", () => {
    const media = { id: 1, name: "Vacía", media_type: "radio", coverage: "", regions: "", languages: "", reach: "", ages: "", nse: "", interests: "", products: [] };
    const result = rankRecommendation({ summary, recommendation: { profile: "Radio informativa", category: "Radio" }, catalog: [media] });
    const [item] = result.items;
    assert.ok(item.score > 0 && item.score < 60);
    assert.ok(item.data_confidence < 40);
    assert.ok(item.warnings.length >= 3);
  });
  it("un perfil nacional sin cobertura nacional queda 'condicionada'", () => {
    const media = { id: 1, name: "Local", media_type: "radio", coverage: "Departamental", regions: "Petén", languages: "", reach: "1000", ages: "18-35", nse: "", interests: "noticias", products: [] };
    const result = rankRecommendation({ summary, recommendation: { profile: "Radio informativa nacional", category: "Radio" }, catalog: [media] });
    assert.equal(result.items[0].compatibility, "condicionada");
    assert.equal(result.items[0].critical_requirements_met, false);
    assert.equal(result.items[0].critical_failures[0].key, "coverage");
  });
});
