// Cliente del servicio local de Ollama (modelo corriendo en la misma red; no se envían
// datos a internet). Solo redacta un borrador de justificación; la validación del
// texto vive en domain/purchase-justification.js.
const config = require("../../../config/plan-medios.config");
const { ExternalServiceError } = require("../errors");
const {
  SYSTEM_PROMPT,
  buildAuthorizedSource,
  validateSourceSufficiency,
  validateGeneratedText,
} = require("../domain/purchase-justification");
const { guatemalaIsoNow } = require("../domain/purchase-request");

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
const optionalInt = (value) => (Number.isFinite(Number(value)) && value !== null && value !== undefined ? Math.trunc(Number(value)) : null);

async function requestCompletion({ apiUrl, model, timeoutSeconds, prompt, fetchImpl = fetch }) {
  const payload = {
    model,
    system: SYSTEM_PROMPT,
    prompt,
    stream: false,
    keep_alive: "5m",
    options: { temperature: 0.1, top_p: 0.85, num_ctx: 1024, num_predict: 140 },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  let response;
  try {
    response = await fetchImpl(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ExternalServiceError(
        `La generación con IA superó el tiempo máximo de espera de ${timeoutSeconds} segundos. ` +
          "Puede continuar utilizando la justificación base."
      );
    }
    throw new ExternalServiceError(
      "No fue posible conectar con el servicio local de Ollama. La justificación base sigue disponible."
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 300);
    } catch (error) {
      detail = "";
    }
    throw new ExternalServiceError(`Ollama devolvió un error HTTP ${response.status}.` + (detail ? ` Detalle: ${detail}` : ""));
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ExternalServiceError("Ollama devolvió una respuesta que no pudo interpretarse.");
  }
}

/**
 * Genera un borrador de justificación para una solicitud de compra.
 * Siempre requiere revisión humana (`review_required: true`).
 */
async function generateJustificationDraft({ summary, mediaEntry, overrides = {} }) {
  const source = buildAuthorizedSource({ summary, mediaEntry });
  validateSourceSufficiency(source);

  const settings = { ...config.ollama, ...overrides };
  const prompt = "DATOS:\n" + JSON.stringify(source) + "\nRedacta la justificación.";
  const result = await requestCompletion({ ...settings, prompt });

  const text = normalize(result.response);
  validateGeneratedText({ text, source, mediaEntry });

  const durationNs = optionalInt(result.total_duration);
  return {
    status: "completed",
    justification: text,
    model: settings.model,
    source_data: source,
    review_required: true,
    generated_at: guatemalaIsoNow(),
    performance: {
      total_duration_seconds: durationNs !== null ? Math.round((durationNs / 1e9) * 100) / 100 : null,
      prompt_eval_count: optionalInt(result.prompt_eval_count),
      eval_count: optionalInt(result.eval_count),
    },
    validation: { neutrality: true, numbers_grounded: true, word_count: text.split(/\s+/).filter(Boolean).length },
  };
}

module.exports = { generateJustificationDraft, requestCompletion };
