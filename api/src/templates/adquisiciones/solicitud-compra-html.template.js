"use strict";

/**
 * Plantilla HTML de la "Solicitud de Compra" (FOR-DG-UA-00-01), renderizada a PDF
 * con Chromium headless (puppeteer-core) en vez de un DOCX con easy-template-x.
 *
 * Se abandonó el enfoque de plantilla DOCX porque el formulario oficial real
 * (el .docx que usa la Unidad) está construido como una cuadrícula de celdas de
 * una tabla enorme con una letra por celda -- típico de formularios diseñados a
 * mano en Word -- lo que hace imposible insertar ahí tags de texto variable sin
 * romper la cuadrícula. Replicar el diseño visualmente en HTML/CSS da control
 * total y es mucho más mantenible.
 *
 * Este archivo NO depende de ningún motor de templating adicional: son simples
 * funciones de JS que arman el HTML con template literals.
 */

const fs = require("fs");
const path = require("path");

const LOGO_PATH = path.join(__dirname, "logo-scspr.png");
let LOGO_DATA_URI = null;
function getLogoDataUri() {
  if (!LOGO_DATA_URI) {
    const buf = fs.readFileSync(LOGO_PATH);
    LOGO_DATA_URI = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return LOGO_DATA_URI;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(value) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

/**
 * Formatea la descripción de un renglón para el PDF: si el texto trae dos puntos
 * (p. ej. "Computadora portátil: Capacidad de disco duro..." como lo arma el
 * autocompletado de MAGA/SIGES en el formulario), todo lo que va ANTES de los
 * primeros dos puntos -- el nombre del insumo, dos puntos incluidos -- se muestra
 * en negrita, igual que en el formulario original en Word. Si no hay dos puntos,
 * se muestra tal cual.
 */
function formatDescripcionItem(value) {
  const texto = value || "";
  const match = texto.match(/^([^:\n]*:)([\s\S]*)$/);
  if (!match) {
    return nl2br(texto);
  }
  const [, prefijo, resto] = match;
  return `<strong>${escapeHtml(prefijo)}</strong>${nl2br(resto)}`;
}

const BASE_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Liberation Sans', Arial, sans-serif;
    color: #1a1a1a;
    font-size: 9.5pt;
    margin: 0;
    padding: 0;
  }
  .page {
    width: 100%;
    padding: 14mm 12mm 10mm 12mm;
  }
  .page + .page {
    page-break-before: always;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }
  td, th {
    vertical-align: middle;
    padding: 4px 6px;
  }
  .bordered td, .bordered th {
    border: 1px solid #000;
  }
  .label {
    font-weight: bold;
    font-size: 8.5pt;
  }
  .value {
    font-size: 9.5pt;
  }
  .header-table td {
    padding: 6px 10px;
    height: 68px;
  }
  .logo-cell {
    border: none;
  }
  .framed-cell {
    border-top: 1.5px solid #000;
    border-bottom: 1.5px solid #000;
    border-right: 1.5px solid #000;
  }
  .framed-cell.framed-first {
    border-left: 1.5px solid #000;
  }
  .logo-cell img {
    height: 56px;
    display: block;
    margin: 0 auto;
  }
  .title-box {
    text-align: center;
    font-weight: bold;
    font-size: 15pt;
  }
  .code-box {
    text-align: center;
    font-weight: bold;
    font-size: 10.5pt;
    white-space: nowrap;
  }
  .anexo-title-box {
    text-align: center;
    font-weight: bold;
    font-size: 15pt;
    letter-spacing: 1px;
  }
  .checkbox {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1.2px solid #000;
    text-align: center;
    line-height: 11px;
    font-weight: bold;
    font-size: 9pt;
    margin-left: 4px;
    vertical-align: middle;
  }
  .categorias td {
    text-align: center;
  }
  .items-table th {
    background: #000;
    color: #fff;
    font-size: 8.5pt;
    text-align: center;
  }
  .items-table td {
    font-size: 9pt;
  }
  .justificacion-box {
    border: 1px solid #000;
    margin-top: 6px;
    overflow: hidden;
  }
  .justificacion-box .label {
    display: block;
    background: #000;
    color: #fff;
    text-align: center;
    padding: 4px 8px;
  }
  .justificacion-box .value {
    padding: 8px;
  }
  .autorizacion {
    text-align: center;
    font-size: 8.5pt;
    margin: 28px 0 22px 0;
    padding: 0 10px;
  }
  .firmas-table td {
    border: none;
    text-align: center;
    vertical-align: top;
    width: 50%;
  }
  .firma-linea {
    border-top: 1px solid #000;
    width: 70%;
    margin: 0 auto 6px auto;
  }
  .firma-nombre {
    font-weight: bold;
    font-size: 9.5pt;
  }
  .firma-cargo {
    font-size: 8.5pt;
  }
  .firma-institucion {
    font-size: 8pt;
    color: #333;
  }
  .sello-box {
    width: 45%;
    margin: 26px auto 0 auto;
    padding: 18px 8px 6px 8px;
    text-align: center;
    font-size: 8.5pt;
    color: #444;
  }
  .anexo-lista {
    margin: 6px 0 0 0;
    padding-left: 22px;
  }
  .anexo-lista li {
    margin-bottom: 4px;
    font-size: 9.5pt;
  }
  .anexo-check-list {
    list-style: none;
    margin: 6px 0 0 0;
    padding-left: 4px;
  }
  .anexo-check-list li {
    margin-bottom: 4px;
    font-size: 9.5pt;
  }
  .section-label {
    font-weight: bold;
    font-size: 10pt;
    margin-top: 14px;
    display: block;
  }
`;

function buildHeader(data) {
  return `
    <table class="header-table">
      <tr>
        <td class="logo-cell" style="width: 28%;">
          <img src="${getLogoDataUri()}" alt="Logo SCSPR" />
        </td>
        <td class="framed-cell framed-first" style="width: 50%;">
          <div class="title-box">SOLICITUD DE COMPRA</div>
        </td>
        <td class="framed-cell" style="width: 22%;">
          <div class="code-box">${escapeHtml(data.codigo_formulario)}</div>
        </td>
      </tr>
    </table>
  `;
}

function buildAnexoHeader(data) {
  return `
    <table class="header-table">
      <tr>
        <td class="logo-cell" style="width: 28%;">
          <img src="${getLogoDataUri()}" alt="Logo SCSPR" />
        </td>
        <td class="framed-cell framed-first" style="width: 50%;">
          <div class="anexo-title-box">ANEXO</div>
        </td>
        <td class="framed-cell" style="width: 22%;">
          <div class="code-box">Solicitud de Compra<br/>${escapeHtml(data.codigo_formulario)}</div>
        </td>
      </tr>
    </table>
  `;
}

function checkbox(marked) {
  return `<span class="checkbox">${marked ? "X" : ""}</span>`;
}

function buildItemsRows(items) {
  if (!items.length) {
    return `<tr><td colspan="5" style="text-align:center; color:#888;">Sin renglones registrados</td></tr>`;
  }
  return items
    .map(
      (item) => `
      <tr>
        <td style="text-align:center; width: 14%;">${escapeHtml(item.item_renglon)}</td>
        <td style="text-align:center; width: 14%;">${escapeHtml(item.item_codigo_insumo)}</td>
        <td>${formatDescripcionItem(item.item_descripcion)}</td>
        <td style="text-align:center; width: 10%;">${escapeHtml(item.item_cantidad)}</td>
        <td style="text-align:center; width: 14%;">${escapeHtml(item.item_unidad)}</td>
      </tr>`
    )
    .join("");
}

function buildFirmasBlock(data) {
  return `
    <table class="firmas-table">
      <tr>
        <td>
          <div class="firma-linea"></div>
          <div class="firma-nombre">${escapeHtml(data.firma1_nombre) || "&nbsp;"}</div>
          <div class="firma-cargo">${escapeHtml(data.firma1_cargo)}</div>
          <div class="firma-institucion">Secretaría de Comunicación Social de la Presidencia</div>
        </td>
        <td>
          <div class="firma-linea"></div>
          <div class="firma-nombre">${escapeHtml(data.firma2_nombre) || "&nbsp;"}</div>
          <div class="firma-cargo">${escapeHtml(data.firma2_cargo)}</div>
          <div class="firma-institucion">Secretaría de Comunicación Social de la Presidencia</div>
        </td>
      </tr>
    </table>
  `;
}

function buildPage1(data) {
  const tipos = ["Suministros", "Equipo", "Materiales", "Servicios"];
  return `
    <div class="page">
      ${buildHeader(data)}
      <table class="bordered" style="margin-top: 18px;">
        <tr>
          <td style="width: 25%;"><span class="label">Dirección / Unidad solicitante:</span></td>
          <td style="width: 35%;" class="value">${escapeHtml(data.unidad_solicitante)}</td>
          <td style="width: 22%;"><span class="label">No. De correlativo de Solicitud:</span></td>
          <td style="width: 18%;" class="value">${escapeHtml(data.codigo_expediente)}</td>
        </tr>
        <tr>
          <td><span class="label">Fecha de solicitud:</span></td>
          <td class="value">${escapeHtml(data.fecha_solicitud)}</td>
          <td><span class="label">Anexo:</span></td>
          <td class="value">
            Sí ${checkbox(data.tiene_anexo)} &nbsp;&nbsp; No ${checkbox(!data.tiene_anexo)}
          </td>
        </tr>
      </table>

      <table class="bordered categorias" style="margin-top: 18px;">
        <tr>
          ${tipos
            .map(
              (t) => `
            <td>
              <span class="label">${t.toUpperCase()}</span>
              ${checkbox(data.tipo_compra === t)}
            </td>`
            )
            .join("")}
        </tr>
      </table>

      <table class="bordered items-table" style="margin-top: 32px;">
        <thead>
          <tr>
            <th>Renglón Presupuestario</th>
            <th>Código de Insumo</th>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Unidad de medida</th>
          </tr>
        </thead>
        <tbody>
          ${buildItemsRows(data.items)}
        </tbody>
      </table>

      <div class="justificacion-box">
        <span class="label">Justificación</span>
        <div class="value">${nl2br(data.justificacion)}</div>
      </div>

      <p class="autorizacion">
        Se autoriza el traslado de la presente solicitud a la Unidad de Adquisiciones, para que se
        realice el proceso de compra de conformidad con la Ley de Contrataciones del Estado y su
        reglamento.
      </p>

      ${buildFirmasBlock(data)}

      <div class="sello-box">(Sello de Centro de Costos)</div>
    </div>
  `;
}

function buildPage2Anexo(data) {
  return `
    <div class="page">
      ${buildAnexoHeader(data)}
      <table class="bordered" style="margin-top: 8px;">
        <tr>
          <td style="width: 30%;"><span class="label">Dirección / Unidad solicitante:</span></td>
          <td style="width: 40%;" class="value">${escapeHtml(data.unidad_solicitante)}</td>
          <td style="width: 15%;"><span class="label">No. Correlativo de Solicitud:</span></td>
          <td style="width: 15%;" class="value">${escapeHtml(data.codigo_expediente)}</td>
        </tr>
        <tr>
          <td><span class="label">Fecha de solicitud:</span></td>
          <td colspan="3" class="value">${escapeHtml(data.fecha_solicitud)}</td>
        </tr>
      </table>

      <span class="section-label">Características Técnicas</span>
      ${
        data.caracteristicasLineas.length
          ? `<ol class="anexo-lista">${data.caracteristicasLineas
              .map((l) => `<li>${escapeHtml(l)}</li>`)
              .join("")}</ol>`
          : `<p class="value">—</p>`
      }

      <span class="section-label">Especificaciones Especiales:</span>
      ${
        data.especificacionesLineas.length
          ? `<ul class="anexo-check-list">${data.especificacionesLineas
              .map((l) => `<li>&#10003; ${escapeHtml(l)}</li>`)
              .join("")}</ul>`
          : `<p class="value">—</p>`
      }

      <div style="margin-top: 40px;">
        ${buildFirmasBlock(data)}
      </div>
    </div>
  `;
}

/**
 * @param {object} data - ver services/adquisiciones/domain/solicitud-compra.js (construirDatosSolicitudCompra)
 * @returns {string} HTML completo listo para imprimir a PDF con Chromium.
 */
function buildSolicitudCompraHtml(data) {
  const paginas = [buildPage1(data)];
  if (data.tiene_anexo) {
    paginas.push(buildPage2Anexo(data));
  }
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<style>${BASE_STYLES}</style>
</head>
<body>
${paginas.join("\n")}
</body>
</html>`;
}

module.exports = { buildSolicitudCompraHtml };
