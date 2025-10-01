const express = require("express");
const router = express.Router();
const { Client } = require("ssh2");
const fs = require("fs");
const {
  verifyToken,
  checkPermission,
} = require("../middleware/auth.middleware");

const SCSPR_SERVER_CONFIG = {
  host: "209.126.109.99",
  port: 45,
  username: "root",
  privateKey: fs.readFileSync(
    process.env.SSH_PRIVATE_KEY_PATH || "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
  ),
};

const GET_DETAILS_SCRIPT = "/opt/scripts/get_request_details.py";
const DELETE_DETAILS_SCRIPT = "/opt/scripts/delete_request_details.py";

// --- Endpoint: Obtener detalles de una solicitud ---
router.get(
  "/details/:id_solicitud",
  verifyToken,
  checkPermission("extl-rprts-srvcios-gnrls:delete"),
  (req, res) => {
    const { id_solicitud } = req.params;

    if (!/^\d+$/.test(id_solicitud)) {
      return res
        .status(400)
        .json({ error: "El ID de la solicitud debe ser numérico." });
    }

    const sshConnection = new Client();
    let stdoutData = "";
    let stderrData = "";

    sshConnection
      .on("ready", () => {
        const command = `PYTHONIOENCODING=utf-8 python3 ${GET_DETAILS_SCRIPT} ${id_solicitud}`;
        sshConnection.exec(command, (err, stream) => {
          if (err) {
            sshConnection.end();
            return res
              .status(500)
              .json({
                error: "Fallo al iniciar el comando remoto.",
                details: err.message,
              });
          }
          stream.on("data", (data) => {
            stdoutData += data.toString("utf8");
          });
          stream.stderr.on("data", (data) => {
            stderrData += data.toString("utf8");
          });
          stream.on("close", (code) => {
            sshConnection.end();
            if (code !== 0) {
              return res
                .status(500)
                .json({
                  error: "El script remoto falló.",
                  details: stderrData,
                });
            }
            try {
              const details = JSON.parse(stdoutData);
              res.status(200).json(details);
            } catch (parseError) {
              res
                .status(500)
                .json({
                  error: "Error al procesar la respuesta del servidor.",
                  details: parseError.message,
                  raw_output: stdoutData,
                });
            }
          });
        });
      })
      .on("error", (err) => {
        res
          .status(500)
          .json({
            error: "No se pudo conectar al servidor SCSPR por SSH.",
            details: err.message,
          });
      })
      .connect(SCSPR_SERVER_CONFIG);
  }
);

// --- Endpoint: Eliminar detalles específicos ---
router.post(
  "/delete-details",
  verifyToken,
  checkPermission("extl-rprts-srvcios-gnrls:delete"),
  (req, res) => {
    const { detail_ids } = req.body;

    if (!Array.isArray(detail_ids) || detail_ids.length === 0) {
      return res
        .status(400)
        .json({ error: "Se requiere un array de IDs de detalle." });
    }

    const sanitizedIds = detail_ids.filter((id) => Number.isInteger(id));
    if (sanitizedIds.length !== detail_ids.length) {
      return res
        .status(400)
        .json({ error: "Todos los IDs deben ser números enteros." });
    }

    const sshConnection = new Client();
    let stderrData = "";

    sshConnection
      .on("ready", () => {
        const idsString = sanitizedIds.join(",");
        const command = `PYTHONIOENCODING=utf-8 python3 ${DELETE_DETAILS_SCRIPT} "${idsString}"`;

        sshConnection.exec(command, (err, stream) => {
          if (err) {
            sshConnection.end();
            return res
              .status(500)
              .json({
                error: "Fallo al iniciar el comando de eliminación.",
                details: err.message,
              });
          }
          // Consumir stdout para asegurar que el stream se cierre
          stream.on("data", (data) => {
            /* No hacer nada, solo consumir */
          });
          stream.stderr.on("data", (data) => {
            stderrData += data.toString("utf8");
          });
          stream.on("close", (code) => {
            sshConnection.end();
            if (code !== 0) {
              return res
                .status(500)
                .json({
                  error: "Falló la ejecución del script de eliminación.",
                  details: stderrData,
                });
            }
            res
              .status(200)
              .json({
                message: "Los detalles seleccionados han sido eliminados.",
              });
          });
        });
      })
      .on("error", (err) => {
        res
          .status(500)
          .json({
            error: "No se pudo conectar al servidor SCSPR por SSH.",
            details: err.message,
          });
      })
      .connect(SCSPR_SERVER_CONFIG);
  }
);

module.exports = router;
