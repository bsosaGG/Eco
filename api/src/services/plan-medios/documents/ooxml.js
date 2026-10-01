// Utilidades OOXML (Word/Excel): lectura de paquetes .docx/.xlsx y un pequeño modelo
// de tablas que replica cómo `python-docx` expone celdas, filas y texto. El parser
// del Brief y el generador del Plan de Medios dependen de esa semántica (p. ej. las
// celdas combinadas se repiten por columna de la cuadrícula), así que se conserva.
const JSZip = require("jszip");
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const { DocumentError } = require("../errors");

const NS = {
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  w14: "http://schemas.microsoft.com/office/word/2010/wordml",
  xml: "http://www.w3.org/XML/1998/namespace",
};

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

// ---------------------------------------------------------------------------
// Paquete ZIP y XML
// ---------------------------------------------------------------------------

async function openPackage(buffer, label = "documento") {
  try {
    return await JSZip.loadAsync(buffer);
  } catch (error) {
    throw new DocumentError(`El archivo ${label} no es un paquete Office válido.`);
  }
}

async function readXml(zip, partName, { optional = false } = {}) {
  const file = zip.file(partName);
  if (!file) {
    if (optional) return null;
    throw new DocumentError(`El documento no contiene la parte esperada: ${partName}`);
  }
  const content = await file.async("string");
  try {
    return new DOMParser({ onError: (level, message) => { if (level === "fatalError") throw new Error(message); } })
      .parseFromString(content, "text/xml");
  } catch (error) {
    throw new DocumentError(`No fue posible interpretar ${partName}: ${error.message}`);
  }
}

function serializeXml(doc) {
  const body = new XMLSerializer().serializeToString(doc);
  return body.startsWith("<?xml") ? body : XML_DECLARATION + body;
}

function writeXml(zip, partName, doc) {
  zip.file(partName, serializeXml(doc));
}

async function packageToBuffer(zip) {
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// ---------------------------------------------------------------------------
// Navegación del DOM
// ---------------------------------------------------------------------------

/** Hijos directos que son elementos (no texto ni comentarios). */
function elementChildren(node) {
  const result = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 1) result.push(child);
  }
  return result;
}

/** Hijos directos con el nombre local dado en el espacio de nombres `w`. */
function wChildren(node, localName) {
  return elementChildren(node).filter((child) => child.localName === localName && child.namespaceURI === NS.w);
}

function wChild(node, localName) {
  return wChildren(node, localName)[0] || null;
}

function wAttr(node, localName) {
  const value = node.getAttributeNS(NS.w, localName);
  return value === "" ? null : value;
}

function insertAfter(parent, node, reference) {
  parent.insertBefore(node, reference.nextSibling);
}

function nextElementSibling(node) {
  for (let sibling = node.nextSibling; sibling; sibling = sibling.nextSibling) {
    if (sibling.nodeType === 1) return sibling;
  }
  return null;
}

function createW(doc, localName, attributes = {}) {
  const element = doc.createElementNS(NS.w, `w:${localName}`);
  for (const [name, value] of Object.entries(attributes)) element.setAttributeNS(NS.w, `w:${name}`, String(value));
  return element;
}

/**
 * Inserta `child` dentro de `parent` respetando el orden de esquema indicado
 * (lista de nombres locales). Word es estricto con el orden de tcPr/rPr.
 */
function insertInSchemaOrder(parent, child, order) {
  const rank = order.indexOf(child.localName);
  for (const sibling of elementChildren(parent)) {
    const siblingRank = order.indexOf(sibling.localName);
    if (siblingRank > rank) {
      parent.insertBefore(child, sibling);
      return child;
    }
  }
  parent.appendChild(child);
  return child;
}

const TC_PR_ORDER = [
  "cnfStyle", "tcW", "gridSpan", "hMerge", "vMerge", "tcBorders", "shd", "noWrap",
  "tcMar", "textDirection", "tcFitText", "vAlign", "hideMark",
];
const R_PR_ORDER = [
  "rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps", "strike", "dstrike",
  "outline", "shadow", "emboss", "imprint", "noProof", "snapToGrid", "vanish", "webHidden",
  "color", "spacing", "w", "kern", "position", "sz", "szCs", "highlight", "u", "effect",
  "bdr", "shd", "fitText", "vertAlign", "rtl", "cs", "em", "lang", "eastAsianLayout", "specVanish", "oMath",
];

// ---------------------------------------------------------------------------
// Modelo de tablas al estilo python-docx
// ---------------------------------------------------------------------------

/** Tablas que son hijas directas del cuerpo del documento (como `document.tables`). */
function bodyTables(doc) {
  const body = wChild(doc.documentElement, "body");
  return body ? wChildren(body, "tbl") : [];
}

/** Párrafos hijos directos del cuerpo (como `document.paragraphs`). */
function bodyParagraphs(doc) {
  const body = wChild(doc.documentElement, "body");
  return body ? wChildren(body, "p") : [];
}

function tableRows(tbl) {
  return wChildren(tbl, "tr");
}

function gridSpan(tc) {
  const tcPr = wChild(tc, "tcPr");
  const span = tcPr ? wChild(tcPr, "gridSpan") : null;
  const value = span ? parseInt(wAttr(span, "val"), 10) : 1;
  return Number.isInteger(value) && value > 0 ? value : 1;
}

function isVerticalContinuation(tc) {
  const tcPr = wChild(tc, "tcPr");
  const merge = tcPr ? wChild(tcPr, "vMerge") : null;
  return Boolean(merge) && wAttr(merge, "val") !== "restart";
}

/**
 * Celdas de la cuadrícula en orden de lectura, igual que `Table._cells` de
 * python-docx: una entrada por columna de la cuadrícula; las celdas combinadas
 * (horizontal o verticalmente) se repiten.
 */
function tableGridCells(tbl) {
  const grid = wChild(tbl, "tblGrid");
  const columnCount = grid ? wChildren(grid, "gridCol").length : 0;
  const cells = [];
  for (const tr of tableRows(tbl)) {
    for (const tc of wChildren(tr, "tc")) {
      const span = gridSpan(tc);
      for (let index = 0; index < span; index += 1) {
        if (isVerticalContinuation(tc)) cells.push(cells[cells.length - columnCount]);
        else if (index > 0) cells.push(cells[cells.length - 1]);
        else cells.push(tc);
      }
    }
  }
  return { cells, columnCount };
}

/** Celdas de la fila `rowIndex` (como `row.cells`). */
function rowCells(tbl, rowIndex, gridCache) {
  const { cells, columnCount } = gridCache || tableGridCells(tbl);
  return cells.slice(rowIndex * columnCount, (rowIndex + 1) * columnCount);
}

function runText(run) {
  let result = "";
  for (const child of elementChildren(run)) {
    if (child.namespaceURI !== NS.w) continue;
    switch (child.localName) {
      case "t":
        result += child.textContent;
        break;
      case "tab":
      case "ptab":
        result += "\t";
        break;
      case "br": {
        const type = wAttr(child, "type");
        if (type === null || type === "textWrapping") result += "\n";
        break;
      }
      case "cr":
        result += "\n";
        break;
      case "noBreakHyphen":
        result += "-";
        break;
      default:
        break;
    }
  }
  return result;
}

function paragraphText(p) {
  let result = "";
  for (const child of elementChildren(p)) {
    if (child.namespaceURI !== NS.w) continue;
    if (child.localName === "r") result += runText(child);
    else if (child.localName === "hyperlink") {
      for (const run of wChildren(child, "r")) result += runText(run);
    }
  }
  return result;
}

function cellParagraphs(tc) {
  return wChildren(tc, "p");
}

/** Texto de una celda: párrafos unidos por salto de línea (como `cell.text`). */
function cellText(tc) {
  return cellParagraphs(tc).map(paragraphText).join("\n");
}

/** Tabla -> matriz de textos (útil para pruebas y diagnóstico). */
function tableTexts(tbl) {
  const grid = tableGridCells(tbl);
  return tableRows(tbl).map((_, index) => rowCells(tbl, index, grid).map(cellText));
}

// ---------------------------------------------------------------------------
// Estilos de párrafo
// ---------------------------------------------------------------------------

/** Mapa id -> nombre de estilo de párrafo, y el id del estilo por defecto. */
function readParagraphStyles(stylesDoc) {
  const names = new Map();
  let defaultId = null;
  if (!stylesDoc) return { names, defaultId };
  for (const style of wChildren(stylesDoc.documentElement, "style")) {
    if (wAttr(style, "type") !== "paragraph") continue;
    const id = wAttr(style, "styleId");
    const nameElement = wChild(style, "name");
    names.set(id, nameElement ? wAttr(nameElement, "val") || "" : "");
    if (wAttr(style, "default") === "1" || wAttr(style, "default") === "true") defaultId = id;
  }
  return { names, defaultId };
}

function paragraphStyleName(p, styles) {
  const pPr = wChild(p, "pPr");
  const pStyle = pPr ? wChild(pPr, "pStyle") : null;
  const id = pStyle ? wAttr(pStyle, "val") : null;
  if (id !== null && styles.names.has(id)) return styles.names.get(id);
  return styles.defaultId !== null ? styles.names.get(styles.defaultId) || "" : "";
}

module.exports = {
  NS,
  openPackage,
  readXml,
  writeXml,
  serializeXml,
  packageToBuffer,
  elementChildren,
  wChildren,
  wChild,
  wAttr,
  insertAfter,
  nextElementSibling,
  createW,
  insertInSchemaOrder,
  TC_PR_ORDER,
  R_PR_ORDER,
  bodyTables,
  bodyParagraphs,
  tableRows,
  tableGridCells,
  rowCells,
  gridSpan,
  runText,
  paragraphText,
  cellParagraphs,
  cellText,
  tableTexts,
  readParagraphStyles,
  paragraphStyleName,
};
