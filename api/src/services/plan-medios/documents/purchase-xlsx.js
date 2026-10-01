// Generación de la Solicitud de Compra (Excel) a partir de la plantilla oficial.
//
// Igual que el sistema original, no se usa una librería de Excel: se escribe
// directamente en el XML interno de la hoja, ubicando cada dato en una celda
// predefinida. Así se conservan intactos formatos, combinaciones y estilos de la
// plantilla. El documento resultante nunca menciona al proveedor ni datos de scoring.
const { openPackage, readXml, writeXml, packageToBuffer, elementChildren } = require("./ooxml");
const { DocumentError } = require("../errors");

const MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const XML_NS = "http://www.w3.org/XML/1998/namespace";
const SHEET_PART = "xl/worksheets/sheet1.xml";
const STYLES_PART = "xl/styles.xml";

// Celda de la plantilla donde va cada dato.
const CELL_MAP = {
  requesting_unit_main: "L5",
  request_number_main: "AJ5",
  request_date_main: "L6",
  annex_yes: "AL6",
  purchase_type_services: "AQ8",
  budget_line: "A12",
  supply_code: "H12",
  description: "N12",
  quantity: "AG12",
  unit: "AL12",
  justification: "A22",
  technical_specifications: "AV11",
  requesting_unit_annex: "BF5",
  request_number_annex: "CD5",
  request_date_annex: "BF6",
};

const CHECK_MARK = "✔";

const mainChildren = (node, name) =>
  elementChildren(node).filter((child) => child.localName === name && child.namespaceURI === MAIN_NS);

function columnIndex(reference) {
  const letters = reference.replace(/[^A-Za-z]/g, "").toUpperCase();
  let value = 0;
  for (const char of letters) value = value * 26 + (char.charCodeAt(0) - 64);
  return value;
}

function rowNumber(reference) {
  const match = /(\d+)$/.exec(reference);
  if (!match) throw new DocumentError(`Referencia de celda no válida: ${reference}`);
  return parseInt(match[1], 10);
}

function createMain(doc, name) {
  return doc.createElementNS(MAIN_NS, name);
}

/** Fila existente o nueva, insertada en orden numérico dentro de sheetData. */
function findOrCreateRow(doc, sheetData, number, rowsByNumber) {
  if (rowsByNumber.has(number)) return rowsByNumber.get(number);
  const row = createMain(doc, "row");
  row.setAttribute("r", String(number));
  const next = [...rowsByNumber.entries()].filter(([n]) => n > number).sort((a, b) => a[0] - b[0])[0];
  sheetData.insertBefore(row, next ? next[1] : null);
  rowsByNumber.set(number, row);
  return row;
}

/** Celda existente o nueva, insertada en orden de columna dentro de su fila. */
function findOrCreateCell(doc, row, reference) {
  const cells = mainChildren(row, "c");
  const existing = cells.find((cell) => cell.getAttribute("r") === reference);
  if (existing) return existing;
  const cell = createMain(doc, "c");
  cell.setAttribute("r", reference);
  const target = columnIndex(reference);
  const next = cells.find((candidate) => columnIndex(candidate.getAttribute("r") || "") > target);
  row.insertBefore(cell, next || null);
  return cell;
}

function setInlineString(doc, cell, value) {
  for (const child of mainChildren(cell, "v").concat(mainChildren(cell, "is"), mainChildren(cell, "f"))) {
    cell.removeChild(child);
  }
  cell.setAttribute("t", "inlineStr");
  const inline = createMain(doc, "is");
  const t = createMain(doc, "t");
  if (value.startsWith(" ") || value.endsWith(" ") || value.includes("\n")) {
    t.setAttributeNS(XML_NS, "xml:space", "preserve");
  }
  t.appendChild(doc.createTextNode(value));
  inline.appendChild(t);
  cell.appendChild(inline);
}

/**
 * Clona el estilo de la celda y cambia solo su alineación vertical. Se crea un
 * nuevo cellXf para no alterar un estilo compartido con otras celdas.
 */
function setVerticalAlignment(stylesDoc, cell, vertical) {
  if (!stylesDoc) throw new DocumentError("La plantilla no contiene el archivo de estilos esperado.");
  const [cellXfs] = mainChildren(stylesDoc.documentElement, "cellXfs");
  if (!cellXfs) throw new DocumentError("La plantilla no contiene estilos de celda válidos.");

  const styleIndex = parseInt(cell.getAttribute("s") || "0", 10);
  const styles = mainChildren(cellXfs, "xf");
  if (!Number.isInteger(styleIndex) || styleIndex < 0 || styleIndex >= styles.length) {
    throw new DocumentError("La celda de descripción referencia un estilo inexistente.");
  }

  const cloned = styles[styleIndex].cloneNode(true);
  let alignment = mainChildren(cloned, "alignment")[0];
  if (!alignment) {
    alignment = createMain(stylesDoc, "alignment");
    cloned.insertBefore(alignment, cloned.firstChild);
  }
  alignment.setAttribute("vertical", vertical);
  cloned.setAttribute("applyAlignment", "1");

  cellXfs.appendChild(cloned);
  cellXfs.setAttribute("count", String(styles.length + 1));
  cell.setAttribute("s", String(styles.length));
}

function buildCellValues(request) {
  return {
    [CELL_MAP.requesting_unit_main]: request.requesting_unit,
    [CELL_MAP.request_number_main]: request.request_number,
    [CELL_MAP.request_date_main]: request.request_date,
    [CELL_MAP.annex_yes]: request.annex ? CHECK_MARK : "",
    [CELL_MAP.purchase_type_services]: request.purchase_type === "SERVICIOS" ? CHECK_MARK : "",
    [CELL_MAP.budget_line]: request.budget_line,
    [CELL_MAP.supply_code]: request.supply_code,
    [CELL_MAP.description]: request.description,
    [CELL_MAP.quantity]: request.quantity,
    [CELL_MAP.unit]: request.unit,
    [CELL_MAP.justification]: request.justification,
    [CELL_MAP.technical_specifications]: request.technical_specifications,
    [CELL_MAP.requesting_unit_annex]: request.requesting_unit,
    [CELL_MAP.request_number_annex]: request.request_number,
    [CELL_MAP.request_date_annex]: request.request_date,
  };
}

/**
 * @param {Buffer} templateBuffer contenido de plantilla_solicitud_compra.xlsx
 * @param {object} request        solicitud preparada (ver domain/purchase-request.js)
 * @returns {Promise<Buffer>}
 */
async function generatePurchaseRequestXlsx(templateBuffer, request) {
  const zip = await openPackage(templateBuffer, "plantilla de Solicitud de Compra");
  if (!zip.file(SHEET_PART)) throw new DocumentError("La plantilla no contiene la hoja principal esperada.");

  const sheetDoc = await readXml(zip, SHEET_PART);
  const stylesDoc = await readXml(zip, STYLES_PART, { optional: true });
  const [sheetData] = mainChildren(sheetDoc.documentElement, "sheetData");
  if (!sheetData) throw new DocumentError("La plantilla no contiene datos de hoja válidos.");

  const rowsByNumber = new Map();
  for (const row of mainChildren(sheetData, "row")) {
    const number = parseInt(row.getAttribute("r") || "0", 10);
    if (number) rowsByNumber.set(number, row);
  }

  const cellsByReference = new Map();
  for (const [reference, rawValue] of Object.entries(buildCellValues(request))) {
    const row = findOrCreateRow(sheetDoc, sheetData, rowNumber(reference), rowsByNumber);
    const cell = findOrCreateCell(sheetDoc, row, reference);
    cellsByReference.set(reference, cell);
    setInlineString(sheetDoc, cell, String(rawValue ?? ""));
  }

  setVerticalAlignment(stylesDoc, cellsByReference.get(CELL_MAP.description), "center");

  writeXml(zip, SHEET_PART, sheetDoc);
  writeXml(zip, STYLES_PART, stylesDoc);
  const output = await packageToBuffer(zip);
  if (!output.length) throw new DocumentError("El archivo de Solicitud de Compra no fue generado correctamente.");
  return output;
}

module.exports = { generatePurchaseRequestXlsx, CELL_MAP };
