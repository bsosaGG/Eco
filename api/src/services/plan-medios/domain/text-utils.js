// Utilidades de texto puras, compartidas por scoring, brief y solicitudes de compra.

/** Convierte cualquier valor a texto recortado ("" para null/undefined). */
function text(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Minúsculas, sin acentos y con espacios colapsados (comparación tolerante). */
function norm(value) {
  const base = String(value || "").toLowerCase().trim();
  return base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

/** Une espacios en blanco: equivalente a " ".join(s.split()). */
function collapseWhitespace(value) {
  return String(value ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/** Número a partir de texto ("1,200.5" -> 1200.5); null si no es numérico. */
function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return null;
  const cleaned = String(value).trim().replace(/,/g, "");
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Primer número que aparece dentro de un texto; null si no hay. */
function firstNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value || "")
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

/** Redondea a `digits` decimales (corrige el error binario típico de Math.round). */
function roundTo(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

const LINE_BREAKS = new RegExp("\r\n|[\n\r\v\f\x1c-\x1e\x85\u2028\u2029]");

/** Equivalente a str.splitlines() de Python. */
function splitLines(value) {
  const lines = String(value ?? "").split(LINE_BREAKS);
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

module.exports = { splitLines, text, norm, collapseWhitespace, parseNumber, firstNumber, roundTo, isPlainObject };
