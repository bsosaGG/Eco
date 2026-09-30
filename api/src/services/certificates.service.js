const crypto = require("crypto");
const QRCode = require("qrcode");

let correlativoCounter = 1;

/**
 * Genera el correlativo institucional oficial
 * Formato: SCSPR-URH-CONST-[AÑO]-[NÚMERO_CORRELATIVO]
 */
async function generarCorrelativo(db) {
  const anio = new Date().getFullYear();
  if (db && typeof db.query === "function") {
    try {
      const res = await db.query(
        `SELECT correlativo FROM constancias_emitidas WHERE correlativo LIKE $1 ORDER BY created_at DESC, correlativo DESC LIMIT 1`,
        [`SCSPR-URH-CONST-${anio}-%`]
      );
      if (res && res.rows && res.rows.length > 0) {
        const lastCorrelativo = res.rows[0].correlativo;
        const match = lastCorrelativo.match(/(\d+)$/);
        if (match) {
          const nextNum = parseInt(match[1], 10) + 1;
          return `SCSPR-URH-CONST-${anio}-${String(nextNum).padStart(5, "0")}`;
        }
      }
    } catch (err) {
      console.warn("⚠️ No se pudo obtener el último correlativo de la BD, calculando dinámicamente:", err.message);
    }
  }
  const fallbackNum = Math.floor(1 + Math.random() * 90000);
  return `SCSPR-URH-CONST-${anio}-${String(fallbackNum).padStart(5, "0")}`;
}

/**
 * Genera el hash criptográfico SHA-256 para validación por terceros
 */
function generarHashVerificacion(correlativo, cuiDpi, timestamp) {
  const data = `${correlativo}|${cuiDpi}|${timestamp}|scspr-urh-2026`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Genera la data URL del código QR que apunta a la URL pública de validación
 */
async function generarCodigoQR(hashVerificacion, host = "https://rrhh.scspr.gob.gt") {
  const urlValidacion = `${host}/core-humanis/validar/${hashVerificacion}`;
  return await QRCode.toDataURL(urlValidacion, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 180,
    color: {
      dark: "#0B2545",
      light: "#FFFFFF",
    },
  });
}

/**
 * Construye el cuerpo del documento respetando estrictamente la regla BR-04
 * Prohibición terminológica para 029 / 18:
 * Queda prohibido usar "salario", "sueldo", "empleado", "trabajador", "jornada".
 * Debe usar "honorarios", "prestador de servicios", "servicios técnicos/profesionales".
 */
function construirTextoLegalConstancia({
  colaborador,
  contrato,
  tipoConstancia,
  dirigidoA = "A QUIEN INTERESE",
  incluyeSalario = true,
  fechaEmision = new Date(),
}) {
  const renglon = contrato.renglon_codigo || "011";
  const esRelacionDependencia = ["011", "021", "022", "031"].includes(renglon);

  const nombreCompleto = `${colaborador.primer_nombre} ${colaborador.segundo_nombre || ""} ${colaborador.primer_apellido} ${colaborador.segundo_apellido || ""}`.replace(/\s+/g, " ").trim();
  const fechaIngresoFormatted = new Date(contrato.fecha_inicio).toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fechaHoyFormatted = fechaEmision.toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const montoFormatted = incluyeSalario
    ? `Q ${Number(contrato.salario_honorarios || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
    : null;

  let cuerpoTexto = "";

  if (esRelacionDependencia) {
    // Renglones 011 / 022
    cuerpoTexto = `La infrascrita Jefa de la Unidad de Recursos Humanos de la Secretaría de Comunicación Social de la Presidencia de la República (SCSPR), HACE CONSTAR que el señor(a):

${nombreCompleto}, quien se identifica con el Documento Personal de Identificación (DPI) con Código Único de Identificación (CUI) número ${colaborador.cui_dpi}, labora para esta Institución bajo el renglón presupuestario ${renglon} (${contrato.renglon_nombre}), desempeñando el puesto funcional de "${contrato.puesto_funcional}" en la dependencia "${contrato.unidad_admin}", desde el ${fechaIngresoFormatted} a la presente fecha, manteniendo un desempeño y conducta intachables.${
      montoFormatted
        ? `\n\nDevengando un salario mensual nominal de ${montoFormatted}, afecto a los descuentos de ley correspondientes.`
        : ""
    }`;
  } else {
    // Renglones 029 / 183 / 189 (BR-04 Estricto: Sin relación de dependencia)
    cuerpoTexto = `La infrascrita Jefa de la Unidad de Recursos Humanos de la Secretaría de Comunicación Social de la Presidencia de la República (SCSPR), HACE CONSTAR que el señor(a):

${nombreCompleto}, quien se identifica con el Documento Personal de Identificación (DPI) con Código Único de Identificación (CUI) número ${colaborador.cui_dpi}, presta sus servicios técnicos y profesionales para esta Secretaría bajo el renglón presupuestario ${renglon} (${contrato.renglon_nombre}), según Contrato Administrativo número ${contrato.numero_acuerdo_contrato || "S/N"}, asignado a la unidad "${contrato.unidad_admin}", prestando sus servicios a partir del ${fechaIngresoFormatted}.${
      montoFormatted
        ? `\n\nPercibiendo por concepto de honorarios mensuales la cantidad de ${montoFormatted}, sujeto a retención tributaria según las leyes vigentes de la SAT.`
        : ""
    }\n\nSe hace constar expresamente que la presente vinculación se rige por la Ley de Contrataciones del Estado y disposiciones civiles aplicables, por lo que NO genera relación laboral de dependencia ni prestaciones de carácter laboral.`;
  }

  return {
    titulo: esRelacionDependencia
      ? "CONSTANCIA DE TRABAJO"
      : "CONSTANCIA DE PRESTACIÓN DE SERVICIOS TÉCNICOS Y PROFESIONALES",
    dirigidoA,
    nombreCompleto,
    cuiDpi: colaborador.cui_dpi,
    nit: colaborador.nit,
    renglon,
    cuerpoTexto,
    fechaEmisionTexto: `Guatemala, ${fechaHoyFormatted}.`,
    firmante: "Licda. María Elena Morales Paz\nJefa de la Unidad de Recursos Humanos\nSecretaría de Comunicación Social de la Presidencia",
  };
}

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const libre = require("libreoffice-convert");
const util = require("util");
const libreConvertAsync = util.promisify(libre.convert);

function numeroALetras(num) {
  const unidades = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
  const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const cientos = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecentos"];

  num = Math.floor(Math.abs(num));
  if (num === 0) return "cero";
  if (num === 100) return "cien";
  if (num < 30) return unidades[num] || String(num);
  if (num < 100) {
    const d = Math.floor(num / 10);
    const u = num % 10;
    return u === 0 ? decenas[d] : `${decenas[d]} y ${unidades[u] || u}`;
  }
  if (num < 1000) {
    const c = Math.floor(num / 100);
    const r = num % 100;
    return r === 0 ? cientos[c] : `${cientos[c]} ${numeroALetras(r)}`;
  }
  if (num < 1000000) {
    const m = Math.floor(num / 1000);
    const r = num % 1000;
    const prefijo = m === 1 ? "mil" : `${numeroALetras(m)} mil`;
    return r === 0 ? prefijo : `${prefijo} ${numeroALetras(r)}`;
  }
  return String(num);
}

/**
 * Genera el archivo PDF o Word (.docx) oficial inyectando datos en la plantilla Word real de la SCSPR
 */
async function generarConstanciaOficialFile(constancia, contrato, colaborador, format = "pdf") {
  // Regla Legal Estricta BR-04 / Contraloría General de Cuentas (SCSPR):
  // Renglones 011, 021, 022, 031 (Relación de Dependencia / Guatenóminas) -> plantilla-constancia-laboral.docx
  // Renglones 029, 183, 189 (Servicios Técnicos y Profesionales / Sin Relación Laboral) -> plantilla-constancia-029-sg18.docx
  const renglon = (contrato.renglon_codigo || "011").toString().trim();
  const isLaboral = ["011", "021", "022", "031"].includes(renglon);
  const fileNames = isLaboral
    ? ["plantilla-constancia-laboral.docx", "Plantilla-Constancia-Laboral.docx"]
    : ["plantilla-constancia-029-sg18.docx", "Plantilla Constancia 029-SG18.docx"];

  const posiblesRutas = [];
  for (const fn of fileNames) {
    posiblesRutas.push(path.join("/usr/src/app/template", fn));
    posiblesRutas.push(path.join(__dirname, "../../../core-humanis-app/template", fn));
    posiblesRutas.push(path.join("/usr/src/app/plantillas/Formatos Monitoreo", fn));
    posiblesRutas.push(path.join(__dirname, "../../../core-humanis-app/docs/plantillas/Formatos Monitoreo", fn));
  }

  const templatePath = posiblesRutas.find((p) => fs.existsSync(p));
  if (!templatePath) {
    throw new Error(`No se encontró el archivo de plantilla oficial para ${isLaboral ? 'Laboral' : '029'}`);
  }

  const fileBuffer = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  let documentXml = await zip.file("word/document.xml").async("string");

  // Limpiar etiquetas proofErr de MS Word que cortan placeholders
  documentXml = documentXml.replace(/<w:proofErr[^>]*\/>/g, "");

  const nombreCompleto = `${colaborador.primer_nombre} ${colaborador.segundo_nombre || ""} ${colaborador.primer_apellido} ${colaborador.segundo_apellido || ""}`.replace(/\s+/g, " ").trim().toUpperCase();
  const esFemenino = (colaborador.genero || "").toLowerCase().startsWith("f");

  const fechaInicioObj = new Date(contrato.fecha_inicio || Date.now());
  const diaInicioNum = fechaInicioObj.getDate();
  const mesInicioTexto = fechaInicioObj.toLocaleDateString("es-GT", { month: "long" });
  const anioInicioNum = fechaInicioObj.getFullYear();

  const fechaEmisionObj = new Date(constancia.created_at || Date.now());
  const diaEmisionNum = fechaEmisionObj.getDate();
  const mesEmisionTexto = fechaEmisionObj.toLocaleDateString("es-GT", { month: "long" });
  const anioEmisionNum = fechaEmisionObj.getFullYear();

  const montoVal = Number(contrato.salario_honorarios || 0);
  const montoFormatted = montoVal.toLocaleString("es-GT", { minimumFractionDigits: 2 });
  const montoEnLetrasTexto = `${numeroALetras(montoVal).toUpperCase()} QUETZALES EXACTOS`;

  if (isLaboral) {
    // Reemplazos para Plantilla Constancia Laboral.docx
    documentXml = documentXml
      .replace(/\[CORRELATIVO\]/g, constancia.correlativo || "SCSPR-URH-CONST-2026-00001")
      .replace(/\[AÑO\]/g, String(anioEmisionNum))
      .replace(/\[INICIALES\]/g, "IR-jpcp")
      .replace(/\[señor\/señora\]/g, esFemenino ? "señora" : "señor")
      .replace(/\[El\/La\]/g, esFemenino ? "La" : "El")
      .replace(/\[señor\/señora\/Licenciado\/Licenciada\]/g, esFemenino ? "señora" : "señor")
      .replace(/\[NOMBRE COMPLETO\]/g, nombreCompleto)
      .replace(/\[CUI\]/g, colaborador.cui_dpi || "2345 67890 0101")
      .replace(/\[PUESTO NOMINAL\]/g, (contrato.puesto_nominal || contrato.puesto_funcional || "COLABORADOR").toUpperCase())
      .replace(/\[RENGLÓN\]/g, contrato.renglon_codigo || "011")
      .replace(/\[NOMBRE DEL RENGLÓN\]/g, (contrato.renglon_nombre || "PERSONAL PERMANENTE").toUpperCase())
      .replace(/\[SALARIO EN LETRAS\]/g, montoEnLetrasTexto)
      .replace(/\[SALARIO EN NÚMEROS\]/g, montoFormatted);

    // Reemplazos ordinales para fechas (inicio vs emisión)
    let idxFecha = 0;
    documentXml = documentXml.replace(/\[DÍA EN LETRAS\]/g, () => (idxFecha++ === 0 ? numeroALetras(diaInicioNum) : numeroALetras(diaEmisionNum)));
    idxFecha = 0;
    documentXml = documentXml.replace(/\[DD\]/g, () => (idxFecha++ === 0 ? String(diaInicioNum) : String(diaEmisionNum)));
    idxFecha = 0;
    documentXml = documentXml.replace(/\[MES\]/g, () => (idxFecha++ === 0 ? mesInicioTexto : mesEmisionTexto));
    idxFecha = 0;
    documentXml = documentXml.replace(/\[AÑO EN LETRAS\]/g, () => (idxFecha++ === 0 ? numeroALetras(anioInicioNum) : numeroALetras(anioEmisionNum)));
    idxFecha = 0;
    documentXml = documentXml.replace(/\[AAAA\]/g, () => (idxFecha++ === 0 ? String(anioInicioNum) : String(anioEmisionNum)));
  } else {
    // Reemplazos para Plantilla Constancia 029-SG18.docx
    const fechaFinObj = new Date(contrato.fecha_fin || `${anioEmisionNum}-12-31`);
    const diaFinNum = fechaFinObj.getDate();
    const mesFinTexto = fechaFinObj.toLocaleDateString("es-GT", { month: "long" });
    const anioFinNum = fechaFinObj.getFullYear();

    const fInicioStr = `${String(diaInicioNum).padStart(2, "0")}/${String(fechaInicioObj.getMonth() + 1).padStart(2, "0")}/${anioInicioNum}`;
    const fFinStr = `${String(diaFinNum).padStart(2, "0")}/${String(fechaFinObj.getMonth() + 1).padStart(2, "0")}/${anioFinNum}`;

    documentXml = documentXml
      .replace(/\[No\. CORRELATIVO\]/g, constancia.correlativo || "SCSPR-URH-CONST-2026-00001")
      .replace(/\[CORRELATIVO\]/g, constancia.correlativo || "SCSPR-URH-CONST-2026-00001")
      .replace(/\[AÑO\]/g, String(anioEmisionNum))
      .replace(/\[INICIALES\]/g, "IR-jpcp")
      .replace(/\[el\/la\]/g, esFemenino ? "la" : "el")
      .replace(/\[licenciado\(a\)\/señor\(a\)\]/g, esFemenino ? "señora" : "señor")
      .replace(/\[NOMBRE COMPLETO\]/g, nombreCompleto)
      .replace(/\[CUI\]/g, colaborador.cui_dpi || "2345 67890 0101")
      .replace(/\[No\. Acta\/Contrato 1\]/g, contrato.numero_acuerdo_contrato || "029-001-2026")
      .replace(/\[No\. Contrato 2\]/g, "-")
      .replace(/\[No\. Contrato 3\]/g, "-")
      .replace(/\[dd\/mm\/aaaa\]/g, fInicioStr)
      .replace(/\[No\. de pagos\]/g, "12")
      .replace(/\[monto\]/g, montoFormatted)
      .replace(/\[Renglón\]/g, contrato.renglon_codigo || "029")
      .replace(/\[número\]/g, "una (1)")
      .replace(/\[día en letras\]/g, numeroALetras(diaEmisionNum))
      .replace(/\[dd\]/g, String(diaEmisionNum))
      .replace(/\[mes en letras\]/g, mesEmisionTexto)
      .replace(/\[mm\]/g, String(fechaEmisionObj.getMonth() + 1).padStart(2, "0"))
      .replace(/\[año en letras\]/g, numeroALetras(anioEmisionNum))
      .replace(/\[aaaa\]/g, String(anioEmisionNum));
  }

  // Generar e insertar código QR oficial de validación en la estructura Word (.docx)
  try {
    const qrBuffer = await QRCode.toBuffer(
      `https://rrhh.scspr.gob.gt/core-humanis/validar/${constancia.hash_verificacion || "validar"}`,
      { width: 140, margin: 1 }
    );
    zip.file("word/media/qr_validation.png", qrBuffer);

    let rels = await zip.file("word/_rels/document.xml.rels").async("string");
    if (!rels.includes("rIdQRVal")) {
      rels = rels.replace("</Relationships>", `<Relationship Id="rIdQRVal" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/qr_validation.png"/></Relationships>`);
      zip.file("word/_rels/document.xml.rels", rels);
    }

    let contentTypes = await zip.file("[Content_Types].xml").async("string");
    if (!contentTypes.includes('Extension="png"')) {
      contentTypes = contentTypes.replace("</Types>", `<Default Extension="png" ContentType="image/png"/></Types>`);
      zip.file("[Content_Types].xml", contentTypes);
    }

    const qrXml = `
      <w:p>
        <w:pPr><w:jc w:val="center"/></w:pPr>
        <w:r>
          <w:drawing>
            <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
              <wp:extent cx="950000" cy="950000"/>
              <wp:effectExtent l="0" t="0" r="0" b="0"/>
              <wp:docPr id="999" name="QR Code"/>
              <wp:cNvGraphicFramePr>
                <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
              </wp:cNvGraphicFramePr>
              <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/image">
                  <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:nvPicPr>
                      <pic:cNvPr id="999" name="qr.png"/>
                      <pic:cNvPicPr/>
                    </pic:nvPicPr>
                    <pic:blipFill>
                      <a:blip r:embed="rIdQRVal" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                      <a:stretch><a:fillRect/></a:stretch>
                    </pic:blipFill>
                    <pic:spPr>
                      <a:xfrm><a:off x="0" y="0"/><a:ext cx="950000" cy="950000"/></a:xfrm>
                      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                    </pic:spPr>
                  </pic:pic>
                </a:graphicData>
              </a:graphic>
            </wp:inline>
          </w:drawing>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="center"/></w:pPr>
        <w:r>
          <w:rPr><w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="14"/><w:color w:val="666666"/></w:rPr>
          <w:t>Código de Validación Criptográfica SHA-256: ${constancia.hash_verificacion || ''}</w:t>
        </w:r>
      </w:p>
    `;
    documentXml = documentXml.replace("</w:body>", qrXml + "</w:body>");
  } catch (errQR) {
    console.warn("⚠️ No se pudo inyectar el código QR en la plantilla:", errQR.message);
  }

  zip.file("word/document.xml", documentXml);
  const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

  if (format === "docx") {
    return {
      buffer: docxBuffer,
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: "docx",
    };
  }

  // Convertir a PDF preservando membretes y logos oficiales con LibreOffice
  const pdfBuffer = await libreConvertAsync(docxBuffer, ".pdf", undefined);
  return {
    buffer: pdfBuffer,
    contentType: "application/pdf",
    extension: "pdf",
  };
}

module.exports = {
  generarCorrelativo,
  generarHashVerificacion,
  generarCodigoQR,
  construirTextoLegalConstancia,
  generarConstanciaOficialFile,
};
