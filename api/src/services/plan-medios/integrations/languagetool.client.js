// Cliente de LanguageTool (revisión ortográfica en línea de cada campo del formulario).
// Es un servicio opcional: si no responde, el formulario sigue funcionando y solo
// muestra un aviso de que el corrector no está disponible.
const config = require("../../../config/plan-medios.config");
const { ExternalServiceError } = require("../errors");

/**
 * @returns {Promise<object[]>} sugerencias con offset/length relativos a `text`
 */
async function checkText(text, language = "es", { fetchImpl = fetch, baseUrl = config.languageTool.baseUrl } = {}) {
  const content = String(text ?? "");
  if (!content.trim()) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.languageTool.timeoutMs);
  let payload;
  try {
    const response = await fetchImpl(`${baseUrl}/v2/check`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ language, text: content }).toString(),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    payload = await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new ExternalServiceError("LanguageTool devolvió una respuesta inválida.");
    throw new ExternalServiceError("No fue posible comunicarse con LanguageTool.");
  } finally {
    clearTimeout(timer);
  }

  if (!payload || !Array.isArray(payload.matches)) {
    throw new ExternalServiceError("LanguageTool devolvió un formato inesperado.");
  }

  return payload.matches
    .filter((match) => match && typeof match === "object")
    .map((match) => {
      const offset = parseInt(match.offset ?? 0, 10) || 0;
      const length = parseInt(match.length ?? 0, 10) || 0;
      const rule = match.rule || {};
      return {
        rule_id: String(rule.id ?? ""),
        message: String(match.message ?? ""),
        short_message: String(match.shortMessage ?? ""),
        offset,
        length,
        original_text: content.slice(offset, offset + length),
        replacements: (match.replacements || [])
          .filter((item) => item && item.value)
          .map((item) => String(item.value)),
        category: String((rule.category || {}).name ?? ""),
        issue_type: String(rule.issueType ?? ""),
      };
    });
}

module.exports = { checkText };
