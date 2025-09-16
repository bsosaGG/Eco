const express = require("express");
const router = express.Router();
const { Client } = require("ssh2");
const XLSX = require("xlsx");
const fs = require("fs");
const crypto = require("crypto");
const {
  verifyToken,
  checkPermission,
} = require("../middleware/auth.middleware");

// --- Configuración del Servidor Fedora ---
const FEDORA_SERVER_CONFIG = {
  host: "209.126.109.104",
  port: 45,
  username: "root",
  privateKey: fs.readFileSync(
    process.env.SSH_PRIVATE_KEY_PATH || "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
  ),
};

// --- Credenciales de la Base de Datos ---
const DB_CONFIG = {
  DB_NAME: "planific_planificacion",
  DB_USER: "planific_usuari",
  DB_PASS: "tSnNYhZjAMi3tSnNYhZjAMi3",
  DB_HOST: "localhost",
};

// Helper function para crear un hash MD5
function md5(string) {
  return crypto.createHash("md5").update(string).digest("hex");
}

// --- Rutas de Reportes (EXISTENTE) ---
const REMOTE_PYTHON_REPORT_SCRIPT = "/opt/scripts/export_db_cli_data.py";
const START_DELIMITER_PREFIX = "---START_TABLE:";
const END_DELIMITER_PREFIX = "---END_TABLE:";
const DELIMITER_SUFFIX = "---";

const ALLOWED_TABLES = [
  "AA",
  "B21",
  "B22",
  "B23",
  "B24",
  "B25",
  "B27",
  "B28",
  "B29",
  "B261",
  "B262",
  "B263",
  "C31",
  "C32",
  "C33",
  "C34",
  "C35",
  "C36",
  "C37",
  "C38",
  "C39",
  "C40",
  "CS01",
  "D41",
  "D42",
  "D43",
  "E51",
  "E53",
  "E54",
  "E55",
  "E521",
  "E522",
  "F61",
  "F62",
  "G1",
  "J1",
  "J2",
  "J4",
];

router.get(
  "/",
  verifyToken,
  checkPermission("external-reports:read"),
  (req, res) => {
    const desiredFormat = req.query.format || "xlsx";
    let tablesToExport = req.query.tables;

    if (desiredFormat !== "xlsx" && desiredFormat !== "ods") {
      return res
        .status(400)
        .json({ error: 'Formato no válido. Usar "xlsx" o "ods".' });
    }

    if (!tablesToExport) {
      return res.status(400).json({
        error:
          "Se requiere al menos un nombre de tabla en el parámetro 'tables'.",
      });
    }

    tablesToExport = tablesToExport
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const invalidTables = tablesToExport.filter(
      (table) => !ALLOWED_TABLES.includes(table)
    );
    if (invalidTables.length > 0) {
      return res.status(400).json({
        error:
          "Uno o más nombres de tabla no son válidos o no están permitidos.",
        invalidTables: invalidTables,
      });
    }

    const sshConnection = new Client();
    let pythonOutput = "";
    let errorOutput = "";

    sshConnection
      .on("ready", () => {
        console.log("SSH: Conexión establecida con Fedora.");
        const pythonCommand = `python ${REMOTE_PYTHON_REPORT_SCRIPT} ${tablesToExport.join(
          " "
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

          stream.on("data", (data) => {
            pythonOutput += data.toString("utf8");
          });
          stream.stderr.on("data", (data) => {
            errorOutput += data.toString("utf8");
            console.error("SSH stderr (Fedora):", data.toString("utf8"));
          });

          // AÑADIDO: Finalizar el stream de entrada para el comando remoto
          stream.stdin.end();

          stream.on("close", (code) => {
            sshConnection.end();
            console.log(`SSH: Script remoto finalizado con código ${code}.`);

            if (code !== 0 || errorOutput) {
              return res.status(500).json({
                error: "Falló la generación de datos en el servidor remoto.",
                details: errorOutput,
              });
            }
            if (!pythonOutput.trim()) {
              return res
                .status(500)
                .json({ error: "El script remoto no generó datos." });
            }

            try {
              const workbook = XLSX.utils.book_new();
              const segments = pythonOutput.split(
                new RegExp(
                  `\n?${START_DELIMITER_PREFIX}\\s*(.*?)\\s*${DELIMITER_SUFFIX}\n`
                )
              );

              for (let i = 1; i < segments.length; i += 2) {
                const tableName = segments[i].trim();
                let csvContent = segments[i + 1];
                const endDelimiterRegex = new RegExp(
                  `\n?${END_DELIMITER_PREFIX}\\s*${tableName}\\s*${DELIMITER_SUFFIX}\n?`
                );
                csvContent = csvContent.replace(endDelimiterRegex, "").trim();

                if (csvContent) {
                  try {
                    const worksheet = XLSX.read(csvContent, { type: "string" })
                      .Sheets.Sheet1;
                    XLSX.utils.book_append_sheet(
                      workbook,
                      worksheet,
                      tableName
                    );
                  } catch (sheetError) {
                    console.warn(
                      `No se pudo procesar la hoja para la tabla ${tableName}. Error:`,
                      sheetError.message
                    );
                  }
                } else {
                  console.warn(
                    `No se encontraron datos CSV para la tabla ${tableName} después de remover los delimitadores.`
                  );
                }
              }

              if (Object.keys(workbook.Sheets).length === 0) {
                return res.status(500).json({
                  error:
                    "No se pudieron generar hojas para ninguna tabla. Asegúrate de que las tablas existan y contengan datos accesibles.",
                });
              }

              if (desiredFormat === "xlsx") {
                const xlsxBuffer = XLSX.write(workbook, {
                  bookType: "xlsx",
                  type: "buffer",
                });
                res.setHeader(
                  "Content-Disposition",
                  'attachment; filename="reporte_tablas.xlsx"'
                );
                res.setHeader(
                  "Content-Type",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.send(xlsxBuffer);
              } else if (desiredFormat === "ods") {
                const odsBuffer = XLSX.write(workbook, {
                  bookType: "ods",
                  type: "buffer",
                });
                res.setHeader(
                  "Content-Disposition",
                  'attachment; filename="reporte_tablas.ods"'
                );
                res.setHeader(
                  "Content-Type",
                  "application/vnd.oasis.opendocument.spreadsheet"
                );
                res.send(odsBuffer);
              }
            } catch (processingError) {
              console.error(
                "Error procesando los datos de las tablas:",
                processingError
              );
              res.status(500).json({
                error:
                  "Error procesando los datos recibidos o convirtiendo al formato deseado.",
                details: processingError.message,
              });
            }
          });
        });
      })
      .on("error", (err) => {
        console.error("SSH: Error de conexión:", err);
        res
          .status(500)
          .json({ error: "No se pudo conectar al servidor Fedora por SSH." });
      })
      .connect(FEDORA_SERVER_CONFIG);
  }
);

// --- Nuevo Endpoint: Restablecer Contraseña de Usuario ---
const REMOTE_PYTHON_RESET_SCRIPT = "/opt/scripts/reset_password.py";

router.post(
  "/users/reset-password",
  verifyToken,
  checkPermission("external-reports:read"),
  async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        error: "El correo electrónico y la nueva contraseña son obligatorios.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res
        .status(400)
        .json({ error: "Formato de correo electrónico no válido." });
    }

    const hashedNewPassword = md5(newPassword);

    const sshConnection = new Client();
    let errorOutput = ""; // Capturará la salida de stderr del script Python
    let stdoutOutput = ""; // Capturará la salida de stdout del script Python

    sshConnection
      .on("ready", () => {
        console.log(
          "SSH: Conexión establecida con Fedora para restablecimiento de contraseña."
        );

        const pythonCommand = `python ${REMOTE_PYTHON_RESET_SCRIPT} "${email}" "${hashedNewPassword}"`;

        console.log(
          `SSH: Ejecutando comando de restablecimiento de contraseña: ${pythonCommand}`
        );

        sshConnection.exec(pythonCommand, (err, stream) => {
          if (err) {
            sshConnection.end();
            console.error(
              "SSH: Error al iniciar comando de restablecimiento de contraseña:",
              err
            );
            return res
              .status(500)
              .json({ error: "Fallo al iniciar el comando remoto." });
          }

          stream.on("data", (data) => {
            stdoutOutput += data.toString("utf8"); // Capturar stdout del script Python
          });
          stream.stderr.on("data", (data) => {
            errorOutput += data.toString("utf8"); // Capturar stderr del script Python
            console.error(
              "SSH stderr (Fedora - Restablecimiento de Contraseña):",
              data.toString("utf8")
            );
          });

          stream.stdin.end(); // CRUCIAL: Cierra el stream de entrada

          stream.on("close", async (code) => {
            sshConnection.end();
            console.log(`SSH: Comando remoto finalizado con código ${code}.`);

            if (code !== 0) {
              let errorMessage =
                "Fallo al restablecer la contraseña en el servidor remoto.";
              if (errorOutput) {
                errorMessage += ` Detalles: ${errorOutput.trim()}`;
              }
              // Si el script Python imprime algo en stdout antes de salir con error, lo vemos aquí.
              if (stdoutOutput) {
                errorMessage += ` (Salida StdOut: ${stdoutOutput.trim()})`;
              }
              return res.status(500).json({ error: errorMessage });
            }

            console.log(
              "Comando de restablecimiento de contraseña ejecutado con éxito."
            );
            // Aquí puedes opcionalmente parsear `stdoutOutput` si el script Python envía algún mensaje de éxito específico.
            res
              .status(200)
              .json({ message: "Contraseña restablecida con éxito." });
          });
        });
      })
      .on("error", (err) => {
        console.error(
          "SSH: Error de conexión para restablecimiento de contraseña:",
          err
        );
        res
          .status(500)
          .json({ error: "No se pudo conectar al servidor Fedora por SSH." });
      })
      .connect(FEDORA_SERVER_CONFIG);
  }
);

module.exports = router;
