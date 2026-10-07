// core-humanis-app/src/config/certificates.config.js
/**
 * Configuración para emisión y validación de constancias laborales / Códigos QR
 * Core Humanis - SCSPR
 */
import { QR_VALIDATION_BASE_URL } from "./version";

export const certificatesConfig = {
  qrValidationBaseUrl: QR_VALIDATION_BASE_URL,

  /**
   * Construye la URL pública de validación ciudadana para un hash criptográfico
   * @param {string} hash - Hash SHA-256 de la constancia
   * @returns {string} URL absoluta de verificación
   */
  getVerificationUrl(hash) {
    const cleanHash = hash || "";
    const base = (
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_QR_VALIDATION_BASE_URL) ||
      QR_VALIDATION_BASE_URL
    ).replace(/\/+$/, "");

    if (base.endsWith("/verificar") || base.endsWith("/validar")) {
      return `${base}/${cleanHash}`;
    }
    return `${base}/verificar/${cleanHash}`;
  },
};

export default certificatesConfig;
