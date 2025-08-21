// api/src/controllers/cloudflare.controller.js

const axios = require("axios");
const ExcelJS = require("exceljs");
require("dotenv").config();

// Constantes y configuración desde variables de entorno
const CLOUDFLARE_API_URL = process.env.CLOUDFLARE_API_URL;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/**
 * Función para formatear una fecha a YYYY-MM-DD.
 * @param {Date} date - El objeto de fecha a formatear.
 * @returns {string} - La fecha en formato 'YYYY-MM-DD'.
 */
const formatDate = (date) => date.toISOString().split("T")[0];

/**
 * Controlador principal que genera el reporte de peticiones de Cloudflare.
 */
const generateCloudflareReport = async (req, res) => {
  // 1. Validar la entrada del frontend
  const { zoneTags } = req.body;
  if (!zoneTags || !Array.isArray(zoneTags) || zoneTags.length === 0) {
    return res
      .status(400)
      .json({ message: "Se requiere un array de zoneTags." });
  }

  // Verificar que el API Token está configurado
  if (!CLOUDFLARE_API_TOKEN) {
    console.error("Error: CLOUDFLARE_API_TOKEN no está configurado en .env");
    return res
      .status(500)
      .json({ message: "La configuración del servidor es incorrecta." });
  }

  try {
    // 2. Definir el rango de fechas para el último año
    const endDate = new Date(); // Hoy
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() + 1);

    // 3. Estrategia de iteración: dividimos el año en 6 bloques de 2 meses.
    const dateChunks = [];
    let chunkStart = new Date(startDate);
    for (let i = 0; i < 6; i++) {
      let chunkEnd = new Date(chunkStart);
      chunkEnd.setMonth(chunkEnd.getMonth() + 2);
      // Asegurarnos de no pasarnos de la fecha final total
      if (chunkEnd > endDate) {
        chunkEnd = new Date(endDate);
      }
      dateChunks.push({
        start: formatDate(chunkStart),
        end: formatDate(chunkEnd),
      });
      // Asegurarse de que el siguiente chunk no empiece antes de que el anterior termine
      if (chunkEnd >= endDate) break;
      chunkStart = new Date(chunkEnd);
    }

    // 4. Bucle de peticiones y agregación de datos (MODIFICADO)
    // Ahora guardamos los datos en una estructura anidada: { 'mes': { 'zoneTag': total } }
    const monthlyDataByZone = {};

    for (const zoneTag of zoneTags) {
      const cleanZoneTag = zoneTag.trim();
      for (const chunk of dateChunks) {
        const gqlQuery = `
          query GetMonthlyData($zoneTag: string, $startDate: Date, $endDate: Date) {
            viewer {
              zones(filter: {zoneTag: $zoneTag}) {
                httpRequests1dGroups(
                  filter: { date_geq: $startDate, date_lt: $endDate },
                  limit: 1000,
                  orderBy: [date_ASC]
                ) {
                  dimensions { date }
                  sum { requests }
                }
              }
            }
          }`;

        const response = await axios.post(
          CLOUDFLARE_API_URL,
          {
            query: gqlQuery,
            variables: {
              zoneTag: cleanZoneTag,
              startDate: chunk.start,
              endDate: chunk.end,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.errors) {
          throw new Error(
            `Error de la API de Cloudflare: ${JSON.stringify(
              response.data.errors
            )}`
          );
        }

        const dailyData =
          response.data.data.viewer.zones[0]?.httpRequests1dGroups || [];

        // ===== LÓGICA DE AGREGACIÓN MODIFICADA =====
        dailyData.forEach((item) => {
          const monthKey = item.dimensions.date.substring(0, 7); // Extraer 'YYYY-MM'
          const requests = item.sum.requests;

          // Asegurar que el objeto para el mes exista
          if (!monthlyDataByZone[monthKey]) {
            monthlyDataByZone[monthKey] = {};
          }
          // Asegurar que el contador para esa zona en ese mes exista
          if (!monthlyDataByZone[monthKey][cleanZoneTag]) {
            monthlyDataByZone[monthKey][cleanZoneTag] = 0;
          }
          // Sumar las peticiones a la zona correspondiente en el mes correspondiente
          monthlyDataByZone[monthKey][cleanZoneTag] += requests;
        });
      }
    }

    // 5. Generación del archivo Excel (MODIFICADO)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte Peticiones por Zona");

    // ===== CREACIÓN DE COLUMNAS DINÁMICAS =====
    const columns = [{ header: "Mes", key: "month", width: 15 }];
    zoneTags.forEach((zoneTag) => {
      columns.push({
        // Usamos el mismo zoneTag como 'key' para la fila
        header: `Peticiones ${zoneTag.trim()}`,
        key: zoneTag.trim(),
        width: 25,
      });
    });
    worksheet.columns = columns;

    // ===== CREACIÓN DE FILAS CON DATOS POR ZONA =====
    // Ordenar los meses cronológicamente
    const sortedMonths = Object.keys(monthlyDataByZone).sort();

    sortedMonths.forEach((month) => {
      const rowData = { month: month };

      // Para cada zona, buscamos su total en el mes actual
      zoneTags.forEach((zoneTag) => {
        const cleanZoneTag = zoneTag.trim();
        // Asignamos el valor al rowData usando el zoneTag como key. Si no hay datos, ponemos 0.
        rowData[cleanZoneTag] = monthlyDataByZone[month]?.[cleanZoneTag] || 0;
      });

      worksheet.addRow(rowData);
    });

    // 6. Enviar el archivo al cliente
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte-cloudflare-por-zona-${formatDate(
        new Date()
      )}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al generar el reporte de Cloudflare:", error);
    res.status(500).json({ message: "Error interno al generar el reporte." });
  }
};

module.exports = {
  generateCloudflareReport,
};
