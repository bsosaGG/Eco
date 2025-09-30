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
  port: 45,
  username: "root", // Asegúrate de que este es el usuario correcto
  privateKey: fs.readFileSync(
    process.env.SSH_PRIVATE_KEY_PATH || "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
  ),
};

// --- Endpoint: Eliminar Último Detalle de Solicitud de Almacén ---
const REMOTE_PYTHON_DELETE_SCRIPT = "/opt/scripts/delete_last_detail.py";

router.post(
  "/delete-last-detail",
  verifyToken,
  checkPermission("extl-rprts-srvcios-gnrls:delete"),
  async (req, res) => {
    const { id_solicitud, descripcion_producto } = req.body;

    if (!id_solicitud || !descripcion_producto) {
      return res.status(400).json({
        error:
          "El ID de la solicitud y la descripción del producto son obligatorios.",
      });
    }

    const sshConnection = new Client();
    let stdoutOutput = "";
    let errorOutput = "";

    sshConnection
      .on("ready", () => {
        console.log(
          "SSH: Conexión establecida con SCSPR para eliminar detalle de solicitud."
        );

        // Se antepone PYTHONIOENCODING=utf-8. Esto le dice al intérprete de Python
        // que use UTF-8 para stdin, stdout, y stderr, sin importar la
        // configuración 'locale' del servidor. Esto es compatible con Python 3.x.
        const command = `PYTHONIOENCODING=utf-8 python3 ${REMOTE_PYTHON_DELETE_SCRIPT} ${Number(
          id_solicitud
        )} "${String(descripcion_producto).replace(/"/g, '\\"')}"`;

        console.log(`SSH: Ejecutando comando remoto: ${command}`);

        sshConnection.exec(command, (err, stream) => {
          if (err) {
            sshConnection.end();
            console.error(
              "SSH: Error al iniciar la ejecución del script:",
              err
            );
            return res
              .status(500)
              .json({ error: "Fallo al iniciar el comando remoto." });
          }

          stream.on("data", (data) => {
            stdoutOutput += data.toString("utf8");
          });
          stream.stderr.on("data", (data) => {
            errorOutput += data.toString("utf8");
            console.error(
              "SSH stderr (SCSPR - Eliminar Detalle):",
              data.toString("utf8")
            );
          });

          stream.stdin.end(); // Es crucial cerrar el stream de entrada

          stream.on("close", (code) => {
            sshConnection.end();
            console.log(`SSH: Comando remoto finalizado con código ${code}.`);

            if (code !== 0 || errorOutput) {
              return res.status(500).json({
                error: "Falló la ejecución del script remoto.",
                details: errorOutput.trim(),
              });
            }

            res.status(200).json({
              message: "Registro eliminado exitosamente.",
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
