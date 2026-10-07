// api/src/config/core-humanis.config.js
const fs = require("fs");
const path = require("path");

/**
 * Configuración centralizada para el módulo Core Humanis (Recursos Humanos) SCSPR
 * URL pública base para la validación de constancias laborales vía código QR.
 * Configurable en archivo de entorno (.env) mediante QR_VALIDATION_BASE_URL.
 */

function sanitizeUrl(raw) {
  if (!raw) return "";
  let clean = String(raw).trim();
  // Quitar comillas iniciales y finales (simples o dobles)
  clean = clean.replace(/^["']|["']$/g, "").trim();
  // Quitar barras diagonales finales
  clean = clean.replace(/\/+$/, "");
  return clean;
}

function resolveBaseUrl(hostOverride) {
  // 1. Intentar leer en caliente desde el archivo .env si existe en las rutas estándar
  const envCandidates = [
    path.join(__dirname, "../../../.env"),
    path.join(__dirname, "../../.env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
    "/usr/src/app/.env",
  ];

  for (const envPath of envCandidates) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        const match = content.match(/^\s*QR_VALIDATION_BASE_URL\s*=\s*(.+)$/m);
        if (match && match[1]) {
          const val = sanitizeUrl(match[1]);
          if (val) {
            process.env.QR_VALIDATION_BASE_URL = val;
            return val;
          }
        }
      }
    } catch (_) {}
  }

  // 2. Si no se encontró en archivo, usar process.env inyectado
  const envVal = process.env.QR_VALIDATION_BASE_URL || process.env.CORE_HUMANIS_QR_VALIDATION_URL;
  if (envVal) {
    return sanitizeUrl(envVal);
  }

  // 3. Host alternativo si no hay configuración explícita
  if (hostOverride) {
    return sanitizeUrl(hostOverride);
  }

  // 4. Fallback canónico institucional
  return "https://rrhh.scspr.gob.gt/verificar";
}

/**
 * Retorna la URL pública completa de validación ciudadana para un hash
 * @param {string} hash - Hash criptográfico SHA-256 de la constancia
 * @param {string} [hostOverride] - Host alternativo opcional
 * @returns {string} URL canónica completa para el código QR
 */
function getQrValidationUrl(hash, hostOverride) {
  const cleanHash = hash || "validar";
  const baseUrl = resolveBaseUrl(hostOverride);

  if (baseUrl.endsWith("/verificar") || baseUrl.endsWith("/validar")) {
    return `${baseUrl}/${cleanHash}`;
  }
  return `${baseUrl}/verificar/${cleanHash}`;
}

module.exports = {
  get qrValidationBaseUrl() {
    return resolveBaseUrl();
  },
  getQrValidationUrl,
};
