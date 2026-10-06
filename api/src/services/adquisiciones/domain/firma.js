const crypto = require("crypto");

/**
 * Placeholder de firma electrónica: no hay integración real con FEA/token todavía; solo deja
 * constancia verificable de que la acción ocurrió con estos datos en este momento.
 */
function generarFirmaHash(payload) {
  return crypto.createHash("sha256").update(`${payload}|${Date.now()}`).digest("hex");
}

module.exports = { generarFirmaHash };
