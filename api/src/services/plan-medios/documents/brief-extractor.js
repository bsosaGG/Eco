// Extracción determinista de los campos de un Brief en formato DOCX estructurado
// (campos numerados 1.1, 1.2, ...). Sin IA: ubica cada campo por su numeración en
// las tablas del documento y copia las recomendaciones de medios de la sección 7.
const {
  openPackage,
  readXml,
  bodyTables,
  bodyParagraphs,
  tableRows,
  tableGridCells,
  rowCells,
  cellText,
  paragraphText,
  readParagraphStyles,
  paragraphStyleName,
} = require("./ooxml");
const { splitLines } = require("../domain/text-utils");
const {
  FIELD_NAMES,
  SUMMARY_FIELD_IDS,
  MEDIA_FIELD_NAMES,
  AUDIENCE_FIELD_IDS,
  fieldSortKey,
} = require("../domain/brief-fields");
const { DocumentError } = require("../errors");

const MEDIA_MAIN_LABELS = {
  "finalidad del medio en la campana": "6.1",
  "publico objetivo al que contribuye": "6.2",
  "especificaciones tecnicas del medio": "6.3",
  "indicador principal del medio": "6.4",
};

const MEDIA_MATERIAL_LABELS = {
  "formato del material": "6.5",
  "periodo y presion": "6.6",
  "cantidad de materiales": "6.7",
};

const FIELD_PATTERN = /^\s*((?:1\.[1-7])|(?:2\.[1-2])|(?:3\.[1-2])|(?:5\.[1-3]))\s+([\s\S]+)$/;
const AUDIENCE_SOURCE_PATTERN = /^\s*(4\.[1-3])\s+([\s\S]+)$/;
const AUDIENCE_FIELD_MAP = { "4.1": "3.3", "4.2": "3.4", "4.3": "3.5" };
const AUDIENCE_SOURCE_NAMES = { "4.1": "Primario", "4.2": "Secundario", "4.3": "Intermediarios" };

const CAMPAIGN_PIECES_HEADERS = ["pieza", "medio", "publicacion", "pauta"];
const MEDIA_RECOMMENDATION_HEADERS = ["campo", "contenido"];
const MEDIA_MATERIAL_HEADERS = ["dato", "detalle"];
const SECTION_7_TITLE = "recomendaciones de seleccion de medios";
const PURCHASE_MAPPING_PREFIXES = ["texto en azul:", "texto en verde:", "texto en naranja:"];

const ACCENTS = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n" };

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

function cleanText(value) {
  return splitLines(String(value).replace(/\r/g, "\n"))
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

/** Minúsculas sin acentos básicos y con espacios colapsados. */
function normalizeLabel(value) {
  const replaced = String(value)
    .replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, (char) => ACCENTS[char.toLowerCase()])
    .toLowerCase();
  return replaced.split(/\s+/).filter(Boolean).join(" ");
}

function stripProfilePrefix(value) {
  return value.replace(/^\s*Medio\s+\d+\s*:\s*/i, "").trim();
}

function inferMediaCategory(profile) {
  const normalized = normalizeLabel(profile);
  if (normalized.includes("television") || normalized === "tv") return "TV";
  if (normalized.includes("radio")) return "Radio";
  if (normalized.includes("rrss") || normalized.includes("redes sociales") || normalized.includes("digital")) {
    return "Digital";
  }
  if (normalized.includes("prensa") || normalized.includes("impreso") || normalized.includes("insertos")) {
    return "Prensa";
  }
  if (normalized.includes("valla") || normalized.includes("exterior")) return "Exterior";
  return "Otro";
}

// ---------------------------------------------------------------------------
// Vista de tablas: [{ rows: string[][] }] con el texto de cada celda de la cuadrícula
// ---------------------------------------------------------------------------

function readTables(doc) {
  return bodyTables(doc).map((tbl) => {
    const grid = tableGridCells(tbl);
    const rows = tableRows(tbl).map((_, index) => rowCells(tbl, index, grid).map(cellText));
    return { rows };
  });
}

function tableHasHeaders(table, expected) {
  if (!table.rows.length) return false;
  const headers = table.rows[0].slice(0, expected.length).map(normalizeLabel);
  return headers.length === expected.length && headers.every((header, index) => header === expected[index]);
}

// ---------------------------------------------------------------------------
// Campos numerados
// ---------------------------------------------------------------------------

function parseFieldCell(rawText) {
  const normalized = cleanText(rawText);
  const match = FIELD_PATTERN.exec(normalized);
  if (!match) return null;
  const fieldId = match[1];
  const remainder = match[2].trim();
  const expectedName = FIELD_NAMES[fieldId];
  if (remainder.toLowerCase().startsWith(expectedName.toLowerCase())) {
    return [fieldId, expectedName, remainder.slice(expectedName.length).trim()];
  }
  return [fieldId, expectedName, ""];
}

/** Detecta un campo numerado en cualquier celda de la fila; el valor son las celdas siguientes. */
function extractFromRow(cells) {
  const cellTexts = cells.map(cleanText);
  for (let index = 0; index < cellTexts.length; index += 1) {
    if (!cellTexts[index]) continue;
    const parsed = parseFieldCell(cellTexts[index]);
    if (!parsed) continue;
    const [fieldId, fieldName, inlineValue] = parsed;
    const parts = [];
    if (inlineValue) parts.push(inlineValue);
    for (const following of cellTexts.slice(index + 1)) if (following) parts.push(following);
    return [fieldId, fieldName, cleanText(parts.join("\n"))];
  }
  return null;
}

/** Públicos del Brief 4.x | descripción | territorio -> campos 3.3–3.5 del formulario. */
function extractAudienceFromRow(cells) {
  const cellTexts = cells.map(cleanText);
  if (!cellTexts.length) return null;
  const match = AUDIENCE_SOURCE_PATTERN.exec(cellTexts[0]);
  if (!match) return null;
  const sourceFieldId = match[1];
  const remainder = match[2].trim();
  if (!remainder.toLowerCase().startsWith(AUDIENCE_SOURCE_NAMES[sourceFieldId].toLowerCase())) return null;
  const targetFieldId = AUDIENCE_FIELD_MAP[sourceFieldId];
  return {
    fieldId: targetFieldId,
    name: FIELD_NAMES[targetFieldId],
    description: cellTexts.length > 1 ? cellTexts[1] : "",
    territory: cellTexts.length > 2 ? cellTexts[2] : "",
    sourceFieldId,
  };
}

function extractFlatSummaryFields(tables) {
  const fields = {};
  for (const table of tables) {
    for (const row of table.rows) {
      const audience = extractAudienceFromRow(row);
      if (audience) {
        if (!(audience.fieldId in fields)) {
          fields[audience.fieldId] = {
            name: audience.name,
            value: audience.description,
            territory: audience.territory,
            status: audience.description || audience.territory ? "completed" : "not_found",
            source: "structured_brief",
            source_field_id: audience.sourceFieldId,
          };
        }
        continue;
      }

      const extracted = extractFromRow(row);
      if (!extracted) continue;
      const [fieldId, fieldName, value] = extracted;
      if (!SUMMARY_FIELD_IDS.includes(fieldId) || fieldId in fields) continue;
      fields[fieldId] = {
        name: fieldName,
        value,
        status: value ? "completed" : "not_found",
        source: "structured_brief",
      };
    }
  }
  return fields;
}

// ---------------------------------------------------------------------------
// Sección 6 (piezas) y sección 7 (estrategia y recomendaciones)
// ---------------------------------------------------------------------------

function extractCampaignPieces(tables) {
  const pieces = [];
  for (const table of tables) {
    if (!tableHasHeaders(table, CAMPAIGN_PIECES_HEADERS)) continue;
    let currentPhase = "";
    for (const row of table.rows.slice(1)) {
      const values = row.map(cleanText);
      if (!values.some(Boolean)) continue;

      const normalizedValues = values.map(normalizeLabel);
      const unique = new Set(normalizedValues);
      if (unique.size === 1 && normalizedValues[0] && normalizedValues[0].includes("fase")) {
        currentPhase = values[0];
        continue;
      }

      while (values.length < 4) values.push("");
      const [piece, medium, publication, pauta] = values;
      if (![piece, medium, publication, pauta].some(Boolean)) continue;
      pieces.push({ phase: currentPhase, piece, medium, publication, pauta, source: "structured_brief_section_6" });
    }
    break; // solo la primera tabla de piezas
  }
  return pieces;
}

function extractMediaStrategy(paragraphs) {
  const overviewParts = [];
  const categoryAnalyses = [];
  let inSection = false;
  let currentCategory = "";
  let currentParts = [];

  const flushCategory = () => {
    if (currentCategory && currentParts.length) {
      categoryAnalyses.push({
        category: currentCategory,
        analysis: cleanText(currentParts.join("\n\n")),
        source: "structured_brief_section_7",
      });
    }
    currentCategory = "";
    currentParts = [];
  };

  for (const { text: rawText, styleName } of paragraphs) {
    const paragraphText = cleanText(rawText);
    if (!paragraphText) continue;
    const normalized = normalizeLabel(paragraphText);

    if (normalized === SECTION_7_TITLE) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;

    if (PURCHASE_MAPPING_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
      flushCategory();
      break;
    }

    if (styleName.toLowerCase().startsWith("heading")) {
      flushCategory();
      currentCategory = paragraphText;
      continue;
    }

    if (currentCategory) {
      if (normalized !== "informacion del material") currentParts.push(paragraphText);
    } else {
      overviewParts.push(paragraphText);
    }
  }
  flushCategory();

  return {
    overview: cleanText(overviewParts.join("\n\n")),
    category_analyses: categoryAnalyses,
    source: "structured_brief_section_7",
  };
}

function emptyMediaFields() {
  const fields = {};
  for (const [fieldId, name] of Object.entries(MEDIA_FIELD_NAMES)) {
    fields[fieldId] = { name, value: "", status: "not_found", source: "structured_brief_section_7" };
  }
  return fields;
}

function parseRecommendationTable(table) {
  if (table.rows.length < 3) return null;
  const firstRow = table.rows[0].map(cleanText);
  if (!firstRow.length || !firstRow[0]) return null;

  const secondRow = table.rows[1].map(normalizeLabel);
  if (secondRow[0] !== MEDIA_RECOMMENDATION_HEADERS[0] || secondRow[1] !== MEDIA_RECOMMENDATION_HEADERS[1]) {
    return null;
  }

  const profile = stripProfilePrefix(firstRow[0]);
  const fields = emptyMediaFields();
  for (const row of table.rows.slice(2)) {
    const values = row.map(cleanText);
    if (values.length < 2) continue;
    const fieldId = MEDIA_MAIN_LABELS[normalizeLabel(values[0])];
    if (!fieldId) continue;
    fields[fieldId].value = values[1];
    fields[fieldId].status = values[1] ? "completed" : "not_found";
  }

  return { profile, category: inferMediaCategory(profile), fields, source: "structured_brief_section_7" };
}

function parseMaterialTable(table) {
  if (!tableHasHeaders(table, MEDIA_MATERIAL_HEADERS)) return {};
  const result = {};
  for (const row of table.rows.slice(1)) {
    const values = row.map(cleanText);
    if (values.length < 2) continue;
    const fieldId = MEDIA_MATERIAL_LABELS[normalizeLabel(values[0])];
    if (fieldId) result[fieldId] = values[1];
  }
  return result;
}

function extractMediaRecommendations(tables) {
  const recommendations = [];
  let last = null;
  for (const table of tables) {
    const recommendation = parseRecommendationTable(table);
    if (recommendation) {
      recommendations.push(recommendation);
      last = recommendation;
      continue;
    }
    const material = parseMaterialTable(table);
    if (Object.keys(material).length && last) {
      for (const [fieldId, value] of Object.entries(material)) {
        last.fields[fieldId].value = value;
        last.fields[fieldId].status = value ? "completed" : "not_found";
      }
    }
  }
  return recommendations;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Resumen vacío (17 campos pendientes) para Briefs que no son DOCX estructurados
 * (por ejemplo PDF): el analista los completa manualmente.
 */
function buildEmptySummary(documentName) {
  const fields = {};
  for (const fieldId of SUMMARY_FIELD_IDS) {
    const field = { name: FIELD_NAMES[fieldId], value: "", status: "not_found", source: "user" };
    if (AUDIENCE_FIELD_IDS.includes(fieldId)) field.territory = "";
    fields[fieldId] = field;
  }
  return {
    document: documentName,
    field_count: SUMMARY_FIELD_IDS.length,
    completed_count: 0,
    missing_count: SUMMARY_FIELD_IDS.length,
    fields,
    campaign_pieces: [],
    media_strategy: {},
    media_recommendations: [],
    media_entries: [],
  };
}

/**
 * Extrae los campos admitidos del Brief, las piezas de campaña y las
 * recomendaciones de selección de medios.
 * @param {Buffer} buffer contenido del .docx
 * @param {string} documentName nombre original (solo informativo)
 */
async function extractSummaryFields(buffer, documentName = "brief.docx") {
  const zip = await openPackage(buffer, documentName);
  let doc;
  let stylesDoc;
  try {
    doc = await readXml(zip, "word/document.xml");
    stylesDoc = await readXml(zip, "word/styles.xml", { optional: true });
  } catch (error) {
    throw new DocumentError(`No fue posible abrir el brief ${documentName}: ${error.message}`);
  }

  const tables = readTables(doc);
  const flat = extractFlatSummaryFields(tables);

  const results = {};
  const ordered = [...SUMMARY_FIELD_IDS].sort((a, b) => fieldSortKey(a) - fieldSortKey(b));
  for (const fieldId of ordered) {
    const fallback = { name: FIELD_NAMES[fieldId], value: "", status: "not_found", source: "structured_brief" };
    if (AUDIENCE_FIELD_IDS.includes(fieldId)) fallback.territory = "";
    results[fieldId] = flat[fieldId] || fallback;
  }
  const completed = Object.values(results).filter((field) => field.status === "completed").length;

  const styles = readParagraphStyles(stylesDoc);
  const paragraphs = bodyParagraphs(doc).map((p) => ({
    text: paragraphText(p),
    styleName: paragraphStyleName(p, styles),
  }));

  return {
    document: documentName,
    field_count: ordered.length,
    completed_count: completed,
    missing_count: ordered.length - completed,
    fields: results,
    campaign_pieces: extractCampaignPieces(tables),
    media_strategy: extractMediaStrategy(paragraphs),
    media_recommendations: extractMediaRecommendations(tables),
  };
}

module.exports = { extractSummaryFields, buildEmptySummary, cleanText, normalizeLabel };
