// Prioridades de campaña (Etapa 2). Se guardan en el expediente; todavía no
// modifican el scoring (el motor usa pesos fijos, igual que el sistema original).
const { ValidationError } = require("../errors");

const PRIORITY_KEYS = ["audience", "geography", "reach", "cost", "affinity"];
const PRESETS = {
  balanced: { audience: 25, geography: 25, reach: 20, cost: 15, affinity: 15 },
  territorial: { audience: 20, geography: 40, reach: 10, cost: 15, affinity: 15 },
  audience: { audience: 40, geography: 20, reach: 15, cost: 10, affinity: 15 },
  efficiency: { audience: 20, geography: 20, reach: 15, cost: 35, affinity: 10 },
};
const ALLOWED_PRESETS = new Set([...Object.keys(PRESETS), "custom"]);
const DEFAULT_WEIGHTS = PRESETS.balanced;

/**
 * Valida los pesos (enteros 0-100 que suman exactamente 100) y arma el bloque
 * `campaign_priorities` del resumen.
 */
function buildCampaignPriorities({ preset, weights }, now = new Date()) {
  const clean = {};
  for (const key of PRIORITY_KEYS) {
    const raw = weights ? weights[key] : undefined;
    const asText = String(raw ?? "").trim();
    if (!/^[+-]?\d+$/.test(asText)) {
      throw new ValidationError(`La prioridad ${key} debe ser un número entero.`);
    }
    const value = parseInt(asText, 10);
    if (value < 0 || value > 100) {
      throw new ValidationError(`La prioridad ${key} debe estar entre 0 y 100.`);
    }
    clean[key] = value;
  }

  const total = PRIORITY_KEYS.reduce((sum, key) => sum + clean[key], 0);
  if (total !== 100) {
    throw new ValidationError("Las prioridades de campaña deben sumar exactamente 100%.");
  }

  let normalizedPreset = String(preset || "balanced").trim();
  if (!ALLOWED_PRESETS.has(normalizedPreset)) normalizedPreset = "custom";

  return {
    version: "1.0",
    preset: normalizedPreset,
    weights: clean,
    total,
    source: "user",
    updated_at: now.toISOString(),
  };
}

module.exports = { PRIORITY_KEYS, PRESETS, DEFAULT_WEIGHTS, buildCampaignPriorities };
