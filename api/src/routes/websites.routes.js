const express = require("express");
const router = express.Router();
const { Client } = require("ssh2");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const {
  verifyToken,
  checkPermission,
} = require("../middleware/auth.middleware");

// --- Configuración del Servidor Remoto (CentOS) ---
const CENTOS_SERVER_CONFIG = {
  host: process.env.CENTOS_SSH_HOST || "209.126.109.93",
  port: parseInt(process.env.CENTOS_SSH_PORT, 10) || 45,
  username: process.env.CENTOS_SSH_USER || "root",
  privateKey: fs.readFileSync(
    process.env.SSH_PRIVATE_KEY_PATH || "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
  ),
};
const REMOTE_PYTHON_SCRIPT = "/opt/scripts/export_to_csv.py";

router.get(
  "/prensa-recursos-mes",
  verifyToken,
  checkPermission("extl-rprts-prensa:read"),
  (req, res) => {
    const desiredFormat = req.query.format || "xlsx";
    const { startDate, endDate, likePattern } = req.query;

    if (desiredFormat !== "xlsx" && desiredFormat !== "ods") {
      return res
        .status(400)
        .json({ error: 'Formato no válido. Usar "xlsx" o "ods".' });
    }

    if (!startDate || !endDate || !likePattern) {
      return res.status(400).json({
        error: "Debe proporcionar una fecha de inicio, una fecha de fin y un patrón de búsqueda.",
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res
        .status(400)
        .json({ error: "El formato de las fechas debe ser YYYY-MM-DD." });
    }

    const sshConnection = new Client();

    // CAMBIO 1: Usamos un array para guardar los buffers crudos, no un string
    let csvChunks = [];
    let errorOutput = "";

    sshConnection
      .on("ready", () => {
        console.log("SSH: Conexión establecida con CentOS.");

        // CAMBIO 2: Forzamos la codificación UTF-8 en el entorno de Python antes de ejecutar
        const command = `export PYTHONIOENCODING=utf-8 && python ${REMOTE_PYTHON_SCRIPT} "${startDate}" "${endDate}" "${likePattern}"`;
        console.log(`Ejecutando comando remoto: ${command}`);

        sshConnection.exec(command, (err, stream) => {
          if (err) {
            sshConnection.end();
            console.error("SSH: Error al iniciar ejecución de script:", err);
            return res
              .status(500)
              .json({ error: "Error al ejecutar script remoto." });
          }

          stream.on("data", (data) => {
            // CAMBIO 3: Guardamos el Buffer directo sin convertir a string todavía
            csvChunks.push(data);
          });

          stream.stderr.on("data", (data) => {
            errorOutput += data.toString("utf8");
            console.error("SSH stderr (CentOS):", data.toString("utf8"));
          });

          stream.on("close", (code) => {
            sshConnection.end();
            console.log(`SSH: Script remoto finalizado con código ${code}.`);

            if (code !== 0 || errorOutput) {
              return res.status(500).json({
                error: "Falló la generación del CSV en el servidor remoto.",
                details: errorOutput,
              });
            }

            // CAMBIO 4: Concatenamos los buffers y validamos longitud
            const finalBuffer = Buffer.concat(csvChunks);

            if (finalBuffer.length === 0) {
              return res
                .status(500)
                .json({ error: "El script remoto no generó datos CSV." });
            }

            try {
              if (desiredFormat === "xlsx") {
                // CAMBIO 5: Leemos 'type: buffer' en lugar de string. XLSX detectará el UTF-8 correctamente.
                const workbook = XLSX.read(finalBuffer, {
                  type: "buffer",
                  raw: true,
                });
                const xlsxBuffer = XLSX.write(workbook, {
                  bookType: "xlsx",
                  type: "buffer",
                });
                res.setHeader(
                  "Content-Disposition",
                  `attachment; filename="reporte_${startDate}_a_${endDate}.xlsx"`
                );
                res.setHeader(
                  "Content-Type",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.send(xlsxBuffer);
              } else if (desiredFormat === "ods") {
                // Mismo cambio para ODS
                const workbook = XLSX.read(finalBuffer, {
                  type: "buffer",
                  raw: true,
                });
                const odsBuffer = XLSX.write(workbook, {
                  bookType: "ods",
                  type: "buffer",
                });
                res.setHeader(
                  "Content-Disposition",
                  `attachment; filename="reporte_${startDate}_a_${endDate}.ods"`
                );
                res.setHeader(
                  "Content-Type",
                  "application/vnd.oasis.opendocument.spreadsheet"
                );
                res.send(odsBuffer);
              }
            } catch (conversionError) {
              console.error("Error convirtiendo CSV:", conversionError);
              res.status(500).json({
                error: "Error convirtiendo los datos CSV al formato deseado.",
              });
            }
          });
        });
      })
      .on("error", (err) => {
        console.error("SSH: Error de conexión:", err);
        res
          .status(500)
          .json({ error: "No se pudo conectar al servidor CentOS por SSH." });
      })
      .connect(CENTOS_SERVER_CONFIG);
  }
);

module.exports = router;
