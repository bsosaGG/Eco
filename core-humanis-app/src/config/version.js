export const APP_VERSION = "5.2.2";
export const APP_STAGE = "Ola 5.2 • Endpoint Inter-modular de Consulta de Colaboradores";
export const APP_TITLE = "Core Humanis";
export const INSTITUTION = "Secretaría de Comunicación Social de la Presidencia (SCSPR)";

// URL pública base para la validación ciudadana de constancias vía QR
export const QR_VALIDATION_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_QR_VALIDATION_BASE_URL) ||
  "https://rrhh.scspr.gob.gt/verificar";

export default {
  version: APP_VERSION,
  stage: APP_STAGE,
  title: APP_TITLE,
  institution: INSTITUTION,
  qrValidationBaseUrl: QR_VALIDATION_BASE_URL,
};
