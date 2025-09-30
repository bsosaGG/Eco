const express = require("express");
const router = express.Router();
const { Client } = require("ssh2");
const XLSX = require("xlsx"); // Para convertir CSV a XLSX
const fs = require("fs"); // Para leer la clave privada
const path = require("path");
const {
  verifyToken,
  checkPermission,
} = require("../middleware/auth.middleware");

// --- Configuración del Servidor Remoto (CentOS) ---
const CENTOS_SERVER_CONFIG = {
  host: "209.126.109.93", // Tu IP estática del servidor CentOS
  port: 45,
  username: "root", // O el usuario que configuraste para SSH sin contraseña
  privateKey: fs.readFileSync(
    process.env.SSH_PRIVATE_KEY_PATH || "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
  ), // Clave privada del API server para acceder a CentOS
};
const REMOTE_PYTHON_SCRIPT = "/opt/scripts/export_to_csv.py"; // Ruta al script en CentOS

router.get(
  "/prensa-recursos-mes",
  verifyToken,
  checkPermission("extl-rprts-prensa:read"),
  (req, res) => {
    const desiredFormat = req.query.format || "xlsx";

    // 1. Leer las fechas del request
    const { startDate, endDate } = req.query;

    if (desiredFormat !== "xlsx" && desiredFormat !== "odt") {
      // Corrección: ODS es 'ods', no 'odt'
      return res
        .status(400)
        .json({ error: 'Formato no válido. Usar "xlsx" o "ods".' });
    }

    // 2. Validar que las fechas se hayan proporcionado
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Debe proporcionar una fecha de inicio y una fecha de fin.",
      });
    }

    // Validación simple de formato (YYYY-MM-DD) para seguridad
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res
        .status(400)
        .json({ error: "El formato de las fechas debe ser YYYY-MM-DD." });
    }

    const sshConnection = new Client();
    let csvData = "";
    let errorOutput = "";

    sshConnection
      .on("ready", () => {
        console.log("SSH: Conexión establecida con CentOS.");

        // 3. Modificar el comando para pasar las fechas como argumentos
        // Se usan comillas para manejar los argumentos de forma segura
        const command = `python ${REMOTE_PYTHON_SCRIPT} "${startDate}" "${endDate}"`;
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
            csvData += data.toString("utf8");
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

            if (!csvData.trim()) {
              return res
                .status(500)
                .json({ error: "El script remoto no generó datos CSV." });
            }

            try {
              if (desiredFormat === "xlsx") {
                const workbook = XLSX.read(csvData, {
                  type: "string",
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
                // Corrección: ODS
                const workbook = XLSX.read(csvData, {
                  type: "string",
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
