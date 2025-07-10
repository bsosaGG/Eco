const express = require("express");
const router = express.Router();
const { Client } = require("ssh2");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware"); // Asegúrate de que estas rutas sean correctas

// --- Configuración del Servidor Remoto (Fedora) ---
const FEDORA_SERVER_CONFIG = {
  host: "148.72.177.226", // Tu IP estática del servidor Fedora
  port: 45, // Puerto SSH confirmado
  username: "root", // Usuario SSH confirmado
  privateKey: fs.readFileSync(
    process.env.SSH_PRIVATE_KEY_PATH || "C:\\Users\\adroreyes\\.ssh\\id_ed25519"
  ), // Clave privada del API server
};
const REMOTE_PYTHON_SCRIPT = "/opt/scripts/export_db_cli_data.py"; // ¡Ruta al NUEVO script en Fedora!

// Lista de tablas permitidas (para validación)
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

// --- DELIMITADORES ESPECIALES (deben coincidir con el script Python) ---
const START_DELIMITER_PREFIX = "---START_TABLE:";
const END_DELIMITER_PREFIX = "---END_TABLE:";
const DELIMITER_SUFFIX = "---";

// Nuevo endpoint para reportes de múltiples tablas
router.get("/", verifyToken, isAdmin, (req, res) => {
  const desiredFormat = req.query.format || "xlsx"; // 'xlsx' o 'odt'
  let tablesToExport = req.query.tables; // Recibe nombres de tablas como string separado por comas

  if (desiredFormat !== "xlsx" && desiredFormat !== "odt") {
    return res
      .status(400)
      .json({ error: 'Formato no válido. Usar "xlsx" o "odt".' });
  }

  if (!tablesToExport) {
    return res
      .status(400)
      .json({
        error:
          "Se requiere al menos un nombre de tabla en el parámetro 'tables'.",
      });
  }

  // Convertir el string de tablas a un array y validar
  tablesToExport = tablesToExport
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t); // Eliminar espacios y entradas vacías

  // Validar que todas las tablas solicitadas estén en la lista de permitidas
  const invalidTables = tablesToExport.filter(
    (table) => !ALLOWED_TABLES.includes(table)
  );
  if (invalidTables.length > 0) {
    return res.status(400).json({
      error: "Uno o más nombres de tabla no son válidos o no están permitidos.",
      invalidTables: invalidTables,
    });
  }

  const sshConnection = new Client();
  let pythonOutput = ""; // Aquí capturaremos la salida completa del script Python
  let errorOutput = "";

  sshConnection
    .on("ready", () => {
      console.log("SSH: Conexión establecida con Fedora.");

      // Construir el comando para ejecutar el script Python con las tablas como argumentos
      const pythonCommand = `python ${REMOTE_PYTHON_SCRIPT} ${tablesToExport.join(
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
          pythonOutput += data.toString("utf8"); // Capturar toda la salida
        });

        stream.stderr.on("data", (data) => {
          errorOutput += data.toString("utf8"); // Errores del script Python
          console.error("SSH stderr (Fedora):", data.toString("utf8"));
        });

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

            // --- Lógica para parsear la salida estructurada ---
            // Dividir la salida en segmentos basados en los delimitadores de inicio de tabla
            // Usamos un regex que captura el nombre de la tabla y luego el contenido hasta el siguiente delimitador
            const segments = pythonOutput.split(
              new RegExp(
                `\n?${START_DELIMITER_PREFIX}\\s*(.*?)\\s*${DELIMITER_SUFFIX}\n`
              )
            );

            // El primer elemento de 'segments' estará vacío o contendrá cualquier cosa antes del primer delimitador.
            // Los elementos con índice impar serán los nombres de tabla, los pares siguientes serán el contenido.
            for (let i = 1; i < segments.length; i += 2) {
              const tableName = segments[i].trim(); // El nombre de la tabla
              let csvContent = segments[i + 1]; // El contenido CSV de la tabla

              // Remover el delimitador de fin de tabla del contenido CSV
              // Asegurarse de que el regex para el fin de tabla coincida con el nombre de tabla correcto
              const endDelimiterRegex = new RegExp(
                `\n?${END_DELIMITER_PREFIX}\\s*${tableName}\\s*${DELIMITER_SUFFIX}\n?`
              );
              csvContent = csvContent.replace(endDelimiterRegex, "").trim();

              if (csvContent) {
                try {
                  // XLSX.read puede leer CSV directamente
                  const worksheet = XLSX.read(csvContent, { type: "string" })
                    .Sheets.Sheet1;
                  XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
                } catch (sheetError) {
                  console.warn(
                    `No se pudo procesar la hoja para la tabla ${tableName}. Esto puede ocurrir si la tabla no tiene datos o la consulta falló en el servidor remoto. Error:`,
                    sheetError.message
                  );
                  // No se devuelve un error fatal aquí para permitir que otras tablas se procesen
                }
              } else {
                console.warn(
                  `No se encontraron datos CSV para la tabla ${tableName} después de remover los delimitadores.`
                );
              }
            }

            if (Object.keys(workbook.Sheets).length === 0) {
              return res
                .status(500)
                .json({
                  error:
                    "No se pudieron generar hojas para ninguna tabla. Asegúrate de que las tablas existan y contengan datos accesibles.",
                });
            }

            // --- Generar el archivo final (XLSX o ODS) ---
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
            } else if (desiredFormat === "odt") {
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
});

module.exports = router;
