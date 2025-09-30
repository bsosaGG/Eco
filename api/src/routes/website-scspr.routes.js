// api/src/routes/website-scspr.routes.js

const express = require("express");
const router = express.Router();
const { Client } = require("ssh2");
const fs = require("fs");
const {
  verifyToken,
  checkPermission,
} = require("../middleware/auth.middleware");

// --- Configuración del Servidor SCSPR ---
const SCSPR_SERVER_CONFIG = {
  host: "209.126.109.99",
  port: 45, // Puerto que indicaste en tu conexión manual
  username: "root",
  privateKey: fs.readFileSync(
    process.env.SSH_PRIVATE_KEY_PATH || "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
  ),
};

/**
 * Escapa un string de forma segura para ser usado como un solo argumento en un shell POSIX.
 * Reemplaza ' por '\'' para que el shell lo interprete correctamente.
 * @param {string} str El string a escapar.
 * @returns {string} El string escapado y envuelto en comillas simples.
 */
const shellQuote = (str) => `'${str.replace(/'/g, "'\\''")}'`;

router.post(
  "/delete-last-detail",
  verifyToken,
  checkPermission("extl-rprts-srvcios-gnrls:delete"), // Permiso ajustado
  (req, res) => {
    const { id_solicitud, descripcion_producto } = req.body;

    if (!id_solicitud || !descripcion_producto) {
      return res.status(400).json({
        error: "Se requieren 'id_solicitud' y 'descripcion_producto'.",
      });
    }

    const sshConnection = new Client();
    let stdoutOutput = "";
    let stderrOutput = "";

    sshConnection
      .on("ready", () => {
        console.log(
          "SSH: Conexión establecida con SCSPR para eliminar detalle de solicitud."
        );

        // Construcción del comando seguro
        const pythonCommand = `LC_ALL=en_US.UTF-8 python3 /opt/scripts/delete_last_detail.py ${id_solicitud} ${shellQuote(
          descripcion_producto
        )}`;
        
        console.log(`SSH: Ejecutando comando remoto: ${pythonCommand}`);

        sshConnection.exec(pythonCommand, (err, stream) => {
          if (err) {
            sshConnection.end();
            console.error("SSH: Error al iniciar ejecución de script:", err);
            return res
              .status(500)
              .json({ error: "Error al ejecutar script remoto." });
          }

          stream.on("data", (data) => (stdoutOutput += data.toString("utf8")));
          stream.stderr.on(
            "data",
            (data) => (stderrOutput += data.toString("utf8"))
          );
          stream.stdin.end();

          stream.on("close", (code) => {
            sshConnection.end();
            console.log(`SSH: Script remoto finalizado con código ${code}.`);

            if (code !== 0) {
              return res.status(500).json({
                error: "Falló la ejecución del script en el servidor remoto.",
                details: stderrOutput.trim(),
              });
            }

            res.status(200).json({
              message: "Acción ejecutada exitosamente.",
              details: stdoutOutput.trim(),
            });
          });
        });
      })
      .on("error", (err) => {
        console.error("SSH: Error de conexión hacia SCSPR:", err);
        res
          .status(500)
          .json({ error: "No se pudo conectar al servidor SCSPR por SSH." });
      })
      .connect(SCSPR_SERVER_CONFIG);
  }
);

module.exports = router;
