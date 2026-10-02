// Generación del Plan de Medios (Word) a partir de la plantilla oficial.
//
// La plantilla original nunca se modifica: se trabaja sobre su contenido en memoria
// y se devuelve un Buffer nuevo. Se llenan los campos de la Etapa 1 y se repite un
// bloque (tablas 6.1–6.4 y 6.5–6.7) por cada medio seleccionado en la Etapa 3,
// incluyendo la justificación de selección (o el texto "no aplica" cuando el medio
// es la opción #1 del ranking, exenta de justificación).
const {
  NS,
  openPackage,
  readXml,
  writeXml,
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
  tableRows,
  tableGridCells,
  rowCells,
  cellText,
} = require("./ooxml");
const { DocumentError } = require("../errors");
const { splitLines, isPlainObject } = require("../domain/text-utils");
const {
  REQUIRED_FIELD_IDS,
  MEDIA_FIELD_IDS,
  AUDIENCE_FIELD_IDS,
} = require("../domain/brief-fields");
const {
  FALLBACK_TEXT,
  justificationRequired,
  normalizeSelectionJustification,
  validateSelectionJustifications,
} = require("../domain/selection-justification");

const OPTIONAL_FIELD_IDS = ["2.1", "2.2", "3.1", "3.2", "3.3", "3.4", "3.5", "5.1", "5.2", "5.3"];
const SUPPORTED_FIELD_IDS = [...REQUIRED_FIELD_IDS, ...OPTIONAL_FIELD_IDS];
const HEADING_FILL = "4B5563";

// ---------------------------------------------------------------------------
// Lectura y validación del resumen
// ---------------------------------------------------------------------------

const stringValue = (value) => (value === null || value === undefined ? "" : String(value).trim());
const normalizeLabelText = (value) => value.replace(/ /g, " ").split(/\s+/).filter(Boolean).join(" ");

function labelStartsWith(label, fieldId) {
  return label === fieldId || label.startsWith(`${fieldId} `) || label.startsWith(`${fieldId}\n`) || label.startsWith(`${fieldId}\t`);
}

function extractFields(summary) {
  if (!isPlainObject(summary)) throw new DocumentError("summary_fields debe ser un objeto tipo diccionario.");
  if (!isPlainObject(summary.fields)) throw new DocumentError("El resumen no contiene un objeto 'fields' válido.");
  return summary.fields;
}

function normalizeValues(fields) {
  const normalized = {};
  const missing = [];
  for (const fieldId of SUPPORTED_FIELD_IDS) {
    const data = fields[fieldId];
    if (!isPlainObject(data)) {
      if (REQUIRED_FIELD_IDS.includes(fieldId)) missing.push(fieldId);
      else normalized[fieldId] = "";
      continue;
    }
    normalized[fieldId] = stringValue(data.value);
  }
  if (missing.length) {
    throw new DocumentError(
      `El resumen no contiene todos los campos obligatorios requeridos. Faltan: ${missing.join(", ")}`
    );
  }
  return normalized;
}

function extractTerritories(fields) {
  const territories = {};
  for (const fieldId of AUDIENCE_FIELD_IDS) {
    const data = fields[fieldId];
    territories[fieldId] = isPlainObject(data) ? stringValue(data.territory) : "";
  }
  return territories;
}

function extractMediaEntries(summary) {
  const rawEntries = summary.media_entries ?? [];
  if (!Array.isArray(rawEntries)) {
    throw new DocumentError("El resumen contiene 'media_entries' con un formato inválido.");
  }
  validateSelectionJustifications(rawEntries);

  const entries = [];
  for (const raw of rawEntries) {
    if (!isPlainObject(raw)) continue;
    const medium = stringValue(raw.medium);
    const rawFields = isPlainObject(raw.fields) ? raw.fields : {};
    const fields = {};
    for (const fieldId of MEDIA_FIELD_IDS) {
      const data = rawFields[fieldId];
      fields[fieldId] = isPlainObject(data) ? stringValue(data.value) : "";
    }
    if (!medium && !Object.values(fields).some(Boolean)) continue;

    let justification = normalizeSelectionJustification(raw.selection_justification);
    if (!justification.trim() && !justificationRequired(raw)) justification = FALLBACK_TEXT;
    entries.push({ medium, selection_justification: justification, fields });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Edición de celdas
// ---------------------------------------------------------------------------

/** Añade texto a un <w:r> con la misma semántica que python-docx (tab -> w:tab, \n -> w:br). */
function appendTextToRun(doc, run, content) {
  let buffer = "";
  const flush = () => {
    if (!buffer) return;
    const t = createW(doc, "t");
    t.appendChild(doc.createTextNode(buffer));
    if (buffer.trim().length < buffer.length) t.setAttributeNS(NS.xml, "xml:space", "preserve");
    run.appendChild(t);
    buffer = "";
  };
  for (const char of content) {
    if (char === "\t") {
      flush();
      run.appendChild(createW(doc, "tab"));
    } else if (char === "\n" || char === "\r") {
      flush();
      run.appendChild(createW(doc, "br"));
    } else {
      buffer += char;
    }
  }
  flush();
}

function setBold(doc, run) {
  let rPr = wChild(run, "rPr");
  if (!rPr) {
    rPr = createW(doc, "rPr");
    run.insertBefore(rPr, run.firstChild);
  }
  let bold = wChild(rPr, "b");
  if (!bold) bold = insertInSchemaOrder(rPr, createW(doc, "b"), R_PR_ORDER);
  bold.removeAttributeNS(NS.w, "val");
}

function firstParagraph(doc, tc) {
  const existing = wChild(tc, "p");
  if (existing) return existing;
  const p = createW(doc, "p");
  tc.appendChild(p);
  return p;
}

function firstNonEmptyRun(p) {
  const runs = wChildren(p, "r");
  return runs.find((run) => elementChildren(run).some((child) => child.localName === "t" && child.textContent)) || runs[0] || null;
}

/**
 * Sustituye el texto de la celda conservando las propiedades de la celda, de la
 * tabla, del primer párrafo y del primer run. Los saltos de línea del valor se
 * insertan como <w:br> dentro del mismo párrafo para no alterar la estructura.
 */
function replaceCellContent(doc, tc, value) {
  const paragraph = firstParagraph(doc, tc);
  const sourceRun = firstNonEmptyRun(paragraph);
  const pPr = wChild(paragraph, "pPr");
  const rPr = sourceRun ? wChild(sourceRun, "rPr") : null;
  const paragraphProps = pPr ? pPr.cloneNode(true) : null;
  const runProps = rPr ? rPr.cloneNode(true) : null;

  for (const p of wChildren(tc, "p")) tc.removeChild(p);
  const newParagraph = createW(doc, "p");
  const firstTable = wChild(tc, "tbl");
  tc.insertBefore(newParagraph, firstTable);

  if (paragraphProps) newParagraph.insertBefore(paragraphProps, newParagraph.firstChild);

  const run = createW(doc, "r");
  newParagraph.appendChild(run);
  if (runProps) run.insertBefore(runProps, run.firstChild);

  const lines = splitLines(value);
  (lines.length ? lines : [""]).forEach((line, index) => {
    if (index > 0) run.appendChild(createW(doc, "br"));
    appendTextToRun(doc, run, line);
  });
  return newParagraph;
}

function applyMediaHeadingStyle(doc, tc) {
  let tcPr = wChild(tc, "tcPr");
  if (!tcPr) {
    tcPr = createW(doc, "tcPr");
    tc.insertBefore(tcPr, tc.firstChild);
  }
  for (const shading of wChildren(tcPr, "shd")) tcPr.removeChild(shading);
  insertInSchemaOrder(tcPr, createW(doc, "shd", { val: "clear", color: "auto", fill: HEADING_FILL }), TC_PR_ORDER);

  const paragraph = wChild(tc, "p");
  if (!paragraph) return;
  for (const run of wChildren(paragraph, "r")) {
    setBold(doc, run);
    const rPr = wChild(run, "rPr");
    for (const color of wChildren(rPr, "color")) rPr.removeChild(color);
    insertInSchemaOrder(rPr, createW(doc, "color", { val: "FFFFFF" }), R_PR_ORDER);
  }
}

// ---------------------------------------------------------------------------
// Localización de celdas objetivo
// ---------------------------------------------------------------------------

/** Para cada fila con >= `minCells` celdas, ofrece (etiqueta normalizada, celdas de la fila). */
function* labeledRows(tbl, minCells) {
  const grid = tableGridCells(tbl);
  const rows = tableRows(tbl);
  for (let index = 0; index < rows.length; index += 1) {
    const cells = rowCells(tbl, index, grid);
    if (cells.length < minCells) continue;
    yield { label: normalizeLabelText(cellText(cells[0])), cells };
  }
}

function locateTargetCells(tables) {
  const located = {};
  for (const tbl of tables) {
    for (const { label, cells } of labeledRows(tbl, 2)) {
      for (const fieldId of SUPPORTED_FIELD_IDS) {
        if (!(fieldId in located) && labelStartsWith(label, fieldId)) {
          located[fieldId] = cells[1];
          break;
        }
      }
    }
  }
  return located;
}

function locateAudienceCells(tables) {
  const aliases = { "3.3": ["3.3"], "3.4": ["3.4"], "3.5": ["3.5", "3,5"] };
  const located = {};
  for (const tbl of tables) {
    for (const { label, cells } of labeledRows(tbl, 3)) {
      for (const [fieldId, identifiers] of Object.entries(aliases)) {
        if (fieldId in located) continue;
        if (identifiers.some((identifier) => labelStartsWith(label, identifier))) {
          located[fieldId] = [cells[1], cells[2]];
        }
      }
    }
  }
  return located;
}

function locateMediaTemplateTables(tables) {
  let top = null;
  let bottom = null;
  for (const tbl of tables) {
    const identifiers = new Set();
    for (const { label } of labeledRows(tbl, 1)) {
      for (const fieldId of MEDIA_FIELD_IDS) if (labelStartsWith(label, fieldId)) identifiers.add(fieldId);
    }
    if (["6.1", "6.2", "6.3", "6.4"].every((id) => identifiers.has(id))) top = tbl;
    if (["6.5", "6.6", "6.7"].every((id) => identifiers.has(id))) bottom = tbl;
  }
  return { top, bottom };
}

function locateMediaCells(topTable, bottomTable) {
  const located = {};
  for (const tbl of [topTable, bottomTable]) {
    for (const { label, cells } of labeledRows(tbl, 2)) {
      for (const fieldId of MEDIA_FIELD_IDS) {
        if (!(fieldId in located) && labelStartsWith(label, fieldId)) {
          located[fieldId] = cells[1];
          break;
        }
      }
    }
  }
  return located;
}

// ---------------------------------------------------------------------------
// Bloque repetible de la sección 6
// ---------------------------------------------------------------------------

function collectBlockElements(top, bottom) {
  const elements = [];
  for (let current = top; current; current = nextElementSibling(current)) {
    elements.push(current);
    if (current === bottom) return elements;
  }
  return [];
}

const REMOVABLE_IN_CLONES = new Set([
  "bookmarkStart",
  "bookmarkEnd",
  "commentRangeStart",
  "commentRangeEnd",
  "commentReference",
]);

/**
 * Limpia identificadores internos que no deben duplicarse al clonar el bloque:
 * bookmarks, referencias de comentarios y w14:paraId / w14:textId.
 */
function sanitizeClonedElements(elements) {
  const visit = (node) => {
    for (const child of elementChildren(node)) {
      if (child.namespaceURI === NS.w && REMOVABLE_IN_CLONES.has(child.localName)) {
        node.removeChild(child);
        continue;
      }
      if (child.namespaceURI === NS.w && child.localName === "p") {
        child.removeAttributeNS(NS.w14, "paraId");
        child.removeAttributeNS(NS.w14, "textId");
      }
      visit(child);
    }
  };
  for (const root of elements) {
    if (root.namespaceURI === NS.w && root.localName === "p") {
      root.removeAttributeNS(NS.w14, "paraId");
      root.removeAttributeNS(NS.w14, "textId");
    }
    visit(root);
  }
}

/** Fila nueva con una sola celda combinada que ocupa todo el ancho de la tabla. */
function buildJustificationRow(doc, tbl, justification) {
  const grid = wChild(tbl, "tblGrid");
  const columns = grid ? wChildren(grid, "gridCol") : [];
  const widths = columns.map((col) => parseInt(wAttr(col, "w"), 10)).filter(Number.isFinite);

  const tr = createW(doc, "tr");
  const tc = createW(doc, "tc");
  const tcPr = createW(doc, "tcPr");
  if (widths.length) {
    tcPr.appendChild(createW(doc, "tcW", { w: widths.reduce((sum, w) => sum + w, 0), type: "dxa" }));
  }
  if (columns.length > 1) tcPr.appendChild(createW(doc, "gridSpan", { val: columns.length }));
  if (elementChildren(tcPr).length) tc.appendChild(tcPr);

  const p = createW(doc, "p");
  const label = createW(doc, "r");
  setBold(doc, label);
  appendTextToRun(doc, label, "Justificación de selección:");
  const body = createW(doc, "r");
  appendTextToRun(doc, body, "\n" + justification);
  p.appendChild(label);
  p.appendChild(body);
  tc.appendChild(p);
  tr.appendChild(tc);
  return tr;
}

function populateMediaBlock(doc, top, bottom, mediaNumber, entry) {
  const firstRow = tableRows(top)[0];
  const headingCell = firstRow && rowCells(top, 0)[0];
  if (!headingCell) throw new DocumentError("La tabla de medios no contiene una cabecera válida.");

  const heading = entry.medium ? `Medio ${mediaNumber}: ${entry.medium}` : `Medio ${mediaNumber}`;
  replaceCellContent(doc, headingCell, heading);
  applyMediaHeadingStyle(doc, headingCell);

  // La justificación va justo debajo de la cabecera del bloque.
  const justificationRow = buildJustificationRow(doc, top, entry.selection_justification);
  insertAfter(top, justificationRow, firstRow);

  const cells = locateMediaCells(top, bottom);
  const missing = MEDIA_FIELD_IDS.filter((fieldId) => !(fieldId in cells));
  if (missing.length) {
    throw new DocumentError(
      `El bloque de medios de la plantilla no contiene todos los campos esperados. Faltan: ${missing.join(", ")}`
    );
  }
  for (const fieldId of MEDIA_FIELD_IDS) replaceCellContent(doc, cells[fieldId], entry.fields[fieldId] || "");
}

function populateMediaEntries(doc, entries) {
  const { top, bottom } = locateMediaTemplateTables(bodyTables(doc));
  if (!top || !bottom) {
    throw new DocumentError("La plantilla no contiene el bloque esperado para los campos 6.1–6.7.");
  }
  const block = collectBlockElements(top, bottom);
  if (!block.length) throw new DocumentError("No fue posible identificar el bloque repetible de la Sección 6.");

  // Copia limpia del bloque ANTES de tocar el original: los medios siguientes se clonan de ella.
  const pristine = block.map((element) => element.cloneNode(true));

  populateMediaBlock(doc, top, bottom, 1, entries[0]);

  const parent = top.parentNode;
  let anchor = block[block.length - 1];
  entries.slice(1).forEach((entry, offset) => {
    const clones = pristine.map((element) => element.cloneNode(true));
    sanitizeClonedElements(clones);
    let current = anchor;
    for (const clone of clones) {
      insertAfter(parent, clone, current);
      current = clone;
    }
    populateMediaBlock(doc, clones[0], clones[clones.length - 1], offset + 2, entry);
    anchor = clones[clones.length - 1];
  });
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * @param {Buffer} templateBuffer contenido de plantilla_plan_de_medios.docx
 * @param {object} summary        resumen del expediente (fields + media_entries)
 * @returns {Promise<Buffer>} documento Word generado
 */
async function generatePlanMediosDocx(templateBuffer, summary) {
  const fields = extractFields(summary);
  const values = normalizeValues(fields);
  const territories = extractTerritories(fields);
  const mediaEntries = extractMediaEntries(summary);

  const zip = await openPackage(templateBuffer, "plantilla del Plan de Medios");
  const doc = await readXml(zip, "word/document.xml");
  const tables = bodyTables(doc);

  const located = locateTargetCells(tables);
  const missing = REQUIRED_FIELD_IDS.filter((fieldId) => !(fieldId in located));
  if (missing.length) {
    throw new DocumentError(
      `La plantilla no contiene todos los campos obligatorios esperados. Faltan: ${missing.join(", ")}`
    );
  }

  for (const fieldId of SUPPORTED_FIELD_IDS) {
    if (AUDIENCE_FIELD_IDS.includes(fieldId) || !located[fieldId]) continue;
    replaceCellContent(doc, located[fieldId], values[fieldId] || "");
  }

  const audienceCells = locateAudienceCells(tables);
  for (const fieldId of AUDIENCE_FIELD_IDS) {
    const pair = audienceCells[fieldId];
    if (!pair) continue;
    replaceCellContent(doc, pair[0], values[fieldId] || "");
    replaceCellContent(doc, pair[1], territories[fieldId] || "");
  }

  if (mediaEntries.length) populateMediaEntries(doc, mediaEntries);

  writeXml(zip, "word/document.xml", doc);
  const output = await packageToBuffer(zip);
  if (!output.length) throw new DocumentError("El documento generado no fue creado correctamente.");
  return output;
}

module.exports = { generatePlanMediosDocx };
