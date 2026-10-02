// Lectura del Excel oficial del catálogo de medios (formato "official_2026": una fila
// comercial por opción/producto, en hojas Televisión, Radio, Cable, Exteriores, Impresos
// y Digital). Convierte el libro en registros de medios y productos listos para guardar.
// Es una función pura sobre el archivo: no toca la base de datos.
const XLSX = require("xlsx");
const { DocumentError } = require("../errors");
const { norm } = require("../domain/text-utils");

const OFFICIAL_SHEETS = ["Televisión", "Radio", "Cable", "Exteriores", "Impresos", "Digital"];

// hoja -> [categoría de producto, tipo de medio]
const CATEGORY_MAP = {
  Televisión: ["TV", "tv"],
  Radio: ["Radio", "radio"],
  Cable: ["Cable", "cable"],
  Exteriores: ["Exteriores", "exteriores"],
  Impresos: ["Prensa", "prensa"],
  Digital: ["Digital", "digital"],
};

const MEDIA_COLUMNS = [
  "name", "group_name", "media_type", "coverage", "regions", "languages", "reach", "ages", "predominant_sex",
  "nse", "interests", "peak_hours", "contact_person", "contact_email", "contact_phone", "legal_name", "nit",
  "tax_status", "required_documents", "minimum_investment", "contracting_forms", "discounts", "rate_card_validity",
];
const MERGEABLE_COLUMNS = new Set(["coverage", "regions", "reach", "ages", "nse", "interests", "discounts", "minimum_investment"]);
const MAX_INTEGER = 2147483647;
const LINE_ENDINGS = /\r\n?/g;

const cellText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return String(value).trim();
};
const headerKey = (value) => norm(value).replace(/\s+/g, " ").trim();
const mediaKey = (value) => String(value).toLowerCase().split(/\s+/).filter(Boolean).join(" ");

/** Cantidad a partir de textos como "2.5 millones", "45 mil" o "1,200"; null si no hay número. */
function quantity(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const text = norm(value).replace(/,/g, "");
  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => parseFloat(match[0]));
  if (!numbers.length) return null;
  const base = numbers.length > 1 ? Math.max(...numbers) : numbers[0];
  if (text.includes("millon")) return base * 1_000_000;
  if (/\bmil\b/.test(text) && base < 1000) return base * 1000;
  return base;
}

// ---------------------------------------------------------------------------
// Lectura del libro
// ---------------------------------------------------------------------------

function readWorkbook(filePath) {
  let workbook;
  try {
    workbook = XLSX.readFile(filePath, { cellDates: false });
  } catch (error) {
    throw new DocumentError(`No fue posible leer el archivo de medios (${error.message}).`);
  }
  const sheets = {};
  for (const name of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "", raw: true, blankrows: true });
    // Excel guarda los saltos de línea como CRLF; se normalizan a LF (como hace un lector XML).
    sheets[name] = rows.map((row) => row.map((value) => (typeof value === "string" ? value.replace(LINE_ENDINGS, "\n") : value)));
  }
  return sheets;
}

function findHeaderRow(rows) {
  for (let index = 0; index < Math.min(rows.length, 10); index += 1) {
    const keys = new Set(rows[index].filter((value) => cellText(value)).map(headerKey));
    if (keys.has("nombre del medio")) return index;
  }
  return null;
}

function parseSheetRows(sheetName, rows) {
  if (rows.length < 3) return [];
  const headerIndex = findHeaderRow(rows);
  if (headerIndex === null) return [];

  const headers = rows[headerIndex].map(headerKey);
  const output = [];
  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const details = {};
    headers.forEach((header, column) => {
      if (header) details[header] = row[column] === undefined || row[column] === null ? "" : row[column];
    });
    const mediumName = cellText(details["nombre del medio"]);
    if (!mediumName) return;
    output.push({ medium_name: mediumName, source_sheet: sheetName, source_row: headerIndex + 2 + offset, details });
  });
  return output;
}

// ---------------------------------------------------------------------------
// Reglas de columnas de cada hoja
// ---------------------------------------------------------------------------

const REACH_KEY = {
  Televisión: "alcance prom. mensual", Radio: "alcance prom.", Cable: "alcance",
  Exteriores: "alcance promedio", Impresos: "circulacion prom.", Digital: "alcance prom.",
};
const COST_KEY = {
  Televisión: "costo x seg.", Radio: "costo x seg. con imps.", Cable: "costo x seg.",
  Exteriores: "costo x catorcena con imps.", Impresos: "costo:", Digital: "costo por mil con imps.",
};

const reachRaw = (sheet, details) => cellText(details[REACH_KEY[sheet]]);
const costRaw = (sheet, details) => cellText(details[COST_KEY[sheet]]);

function unitCost(sheet, raw) {
  if (!raw) return null;
  const normalized = norm(raw);
  // Sin conversión de monedas: una tarifa digital en dólares no se compara contra quetzales.
  if (sheet === "Digital" && ["usd", "us$", "$"].some((token) => normalized.includes(token))) {
    if (!normalized.includes("q") && !normalized.includes("gtq")) return null;
  }
  return quantity(raw);
}

function formatText(sheet, details) {
  if (sheet === "Cable") return cellText(details["programacion"]);
  if (sheet === "Exteriores") return [cellText(details["medio"]), cellText(details["medida"])].filter(Boolean).join(" ");
  return cellText(details["formato"]);
}

const regionsOf = (sheet, details, coverage) =>
  sheet === "Exteriores" ? cellText(details["ubicacion / vialidad"]) || coverage : coverage;

function mediaRecord(sheet, row) {
  const { details } = row;
  const [, mediaType] = CATEGORY_MAP[sheet];
  const coverage = cellText(details["cobertura"]);
  const record = Object.fromEntries(MEDIA_COLUMNS.map((column) => [column, ""]));
  return Object.assign(record, {
    name: row.medium_name,
    media_type: mediaType,
    coverage,
    regions: regionsOf(sheet, details, coverage),
    reach: reachRaw(sheet, details),
    ages: cellText(details["grupo objetivo"]),
    nse: cellText(details["nse"]),
    interests: formatText(sheet, details),
    legal_name: cellText(details["razon social"]),
    nit: cellText(details["nit"]),
    minimum_investment: costRaw(sheet, details),
    discounts: cellText(details["bonificaciones"] || details["bonificacion"]),
  });
}

function productRecord(sheet, row) {
  const { details } = row;
  const [category, mediaType] = CATEGORY_MAP[sheet];
  const cost = costRaw(sheet, details);
  const reach = reachRaw(sheet, details);

  let productName = "";
  let productFormat = formatText(sheet, details);
  let schedule = "";
  if (sheet === "Cable") {
    productName = cellText(details["canal / no."]) || "Pauta de cable";
    productFormat = cellText(details["programacion"]);
  } else if (sheet === "Exteriores") {
    productName = cellText(details["medio"]) || "Publicidad exterior";
    productFormat = cellText(details["medida"]);
    schedule = "Catorcena";
  } else if (sheet === "Impresos") productName = "Espacio impreso";
  else if (sheet === "Digital") productName = cellText(details["formato"]) || "Pauta digital";
  else if (sheet === "Radio") productName = "Pauta radial";
  else if (sheet === "Televisión") productName = "Pauta televisiva";

  return {
    medium_name: row.medium_name,
    category,
    media_type: mediaType,
    product_name: productName,
    format: productFormat,
    schedule,
    prime_time: "",
    rating: null,
    estimated_audience: quantity(reach),
    unit_cost: unitCost(sheet, cost),
    details: { ...details, __source_sheet: row.source_sheet, __source_row: row.source_row, __raw_cost: cost, __raw_reach: reach },
  };
}

/** Une dos registros del mismo medio (aparece en varias filas/hojas): conserva y concatena datos distintos. */
function mergeMedia(current, incoming) {
  const merged = { ...current };
  for (const column of MEDIA_COLUMNS) {
    const old = cellText(merged[column]);
    const next = cellText(incoming[column]);
    if (!old && next) merged[column] = next;
    else if (old && next && old !== next && MERGEABLE_COLUMNS.has(column)) {
      merged[column] = [...new Set([old, next])].join(" | ");
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * @param {string} filePath ruta del .xlsx
 * @returns {{ media: object[], products: object[], sheetStats: object, warnings: string[] }}
 */
function parseCatalogWorkbook(filePath) {
  const sheets = readWorkbook(filePath);
  const available = OFFICIAL_SHEETS.filter((name) => name in sheets);
  if (!available.length) {
    throw new DocumentError(
      `El archivo no corresponde al catálogo oficial. Se esperaba alguna de las hojas: ${OFFICIAL_SHEETS.join(", ")}.`
    );
  }

  const mediaByKey = new Map();
  const products = [];
  const sheetStats = {};
  const warnings = [];

  for (const sheetName of available) {
    const rows = parseSheetRows(sheetName, sheets[sheetName]);
    sheetStats[sheetName] = { source_rows: rows.length, unique_media: new Set(rows.map((row) => mediaKey(row.medium_name))).size };
    const [, mediaType] = CATEGORY_MAP[sheetName];

    for (const row of rows) {
      const key = `${mediaKey(row.medium_name)}\u0000${mediaType}`;
      const record = mediaRecord(sheetName, row);
      mediaByKey.set(key, mediaByKey.has(key) ? mergeMedia(mediaByKey.get(key), record) : record);
      products.push(productRecord(sheetName, row));
    }
  }

  if (!mediaByKey.size) throw new DocumentError("El catálogo oficial no contiene registros importables.");

  for (const product of products) {
    if (product.estimated_audience !== null && product.estimated_audience > MAX_INTEGER) {
      warnings.push(`Alcance fuera de rango para ${product.medium_name} (${product.category}): se guardó sin alcance.`);
      product.estimated_audience = null;
    }
  }

  return { media: [...mediaByKey.values()], products, sheetStats, warnings };
}

module.exports = { parseCatalogWorkbook, OFFICIAL_SHEETS, CATEGORY_MAP, MEDIA_COLUMNS, quantity, mediaKey };
