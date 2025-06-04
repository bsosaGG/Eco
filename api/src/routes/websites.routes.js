const express = require("express");
const router = express.Router();
const { Client } = require("ssh2");
const XLSX = require("xlsx"); // Para convertir CSV a XLSX
const fs = require("fs"); // Para leer la clave privada
const path = require("path");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// --- Configuración del Servidor Remoto (CentOS) ---
const CENTOS_SERVER_CONFIG = {
  host: "148.72.155.141", // Tu IP estática del servidor CentOS
  port: 45,
  username: "root", // O el usuario que configuraste para SSH sin contraseña
  privateKey: fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH || '/run/secrets/id_ed25519_conn'), // Clave privada del API server para acceder a CentOS
};
const REMOTE_PYTHON_SCRIPT = "/opt/scripts/export_to_csv.py"; // Ruta al script en CentOS

router.get("/prensa-recursos-mes", verifyToken, isAdmin, (req, res) => {
  const desiredFormat = req.query.format || "xlsx"; // 'xlsx' o 'ods'

  if (desiredFormat !== "xlsx" && desiredFormat !== "odt") {
    // .odt es la extensión para ODS
    return res
      .status(400)
      .json({ error: 'Formato no válido. Usar "xlsx" o "odt".' });
  }

  const sshConnection = new Client();
  let csvData = "";
  let errorOutput = "";

  sshConnection
    .on("ready", () => {
      console.log("SSH: Conexión establecida con CentOS.");
      // Ejecutamos el script Python 2.7 en CentOS
      sshConnection.exec(`python ${REMOTE_PYTHON_SCRIPT}`, (err, stream) => {
        if (err) {
          sshConnection.end();
          console.error("SSH: Error al iniciar ejecución de script:", err);
          return res
            .status(500)
            .json({ error: "Error al ejecutar script remoto." });
        }

        stream.on("data", (data) => {
          csvData += data.toString("utf8"); // El CSV vendrá por stdout
        });

        stream.stderr.on("data", (data) => {
          errorOutput += data.toString("utf8"); // Errores del script Python
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
            // Convertir CSV a XLSX
            if (desiredFormat === "xlsx") {
              const workbook = XLSX.read(csvData, {
                type: "string",
                raw: true,
              }); // 'raw: true' para mejor manejo de fechas si están como strings ISO
              const xlsxBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "buffer",
              });

              res.setHeader(
                "Content-Disposition",
                'attachment; filename="report.xlsx"'
              );
              res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              );
              res.send(xlsxBuffer);
            } else if (desiredFormat === "odt") {
              // Generar ODS es más complejo directamente en Node.js sin librerías específicas
              // o herramientas como LibreOffice headless.
              // Para una "simple hoja de cálculo", la librería 'xlsx' también puede generar ODS:
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
                'attachment; filename="report.ods"'
              );
              res.setHeader(
                "Content-Type",
                "application/vnd.oasis.opendocument.spreadsheet"
              );
              res.send(odsBuffer);
            }
          } catch (conversionError) {
            console.error("Error convirtiendo CSV:", conversionError);
            res
              .status(500)
              .json({
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
});

module.exports = router;
