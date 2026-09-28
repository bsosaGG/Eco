const fs = require("fs");

function getSshPrivateKey() {
  try {
    const keyPath = process.env.SSH_PRIVATE_KEY_PATH || "C:\\Users\\adroreyes\\.ssh\\id_ed25519";
    if (fs.existsSync(keyPath) && !fs.statSync(keyPath).isDirectory()) {
      return fs.readFileSync(keyPath);
    }
  } catch (err) {
    console.warn("SSH Helper: No se pudo leer la clave privada:", err.message);
  }
  return null;
}

module.exports = {
  getSshPrivateKey,
};
