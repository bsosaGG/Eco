/**
 * Templates Service (Core Humanis SCSPR)
 * Modifiable document generation engine using easy-template-x (.docx)
 * and headless PDF rendering using libreoffice-convert.
 */

const JSZip = require("jszip");
const { TemplateHandler } = require("easy-template-x");
const libre = require("libreoffice-convert");
const util = require("util");
const db = require("../config/db-core-humanis");

const libreConvertAsync = util.promisify(libre.convert);

class TemplatesService {
  constructor() {
    this.handler = new TemplateHandler();
  }

  /**
   * Builds a valid OpenXML Word (.docx) document with XML namespaces and formatting.
   * @param {string} bodyXml - Internal WordprocessingML XML body.
   * @returns {Promise<Buffer>} Generated .docx buffer.
   */
  async buildDocxFromXml(bodyXml) {
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        "</Types>"
    );

    zip.file(
      "_rels/.rels",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        "</Relationships>"
    );

    const docXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "<w:body>" +
      bodyXml +
      '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
      "</w:body>" +
      "</w:document>";

    zip.file("word/document.xml", docXml);
    return await zip.generateAsync({ type: "nodebuffer" });
  }

  /**
   * Generates default institutional Word templates with tags.
   */
  async generateDefaultDocx(codigo) {
    if (codigo === "BOLETA_SOLICITUD_VACACIONES") {
      const xml = `
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0C2340"/></w:rPr><w:t>SECRETARÍA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="C5A059"/></w:rPr><w:t>DIRECCIÓN DE RECURSOS HUMANOS - CONTROL DE VACACIONES</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>BOLETA OFICIAL DE SOLICITUD DE VACACIONES</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Correlativo: {correlativo}  |  Fecha Solicitud: {fecha_solicitud}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>1. DATOS DEL COLABORADOR</w:t></w:r></w:p>
        <w:p><w:r><w:t>Nombre Completo: {colaborador_nombre}</w:t></w:r></w:p>
        <w:p><w:r><w:t>CUI / DPI: {cui_dpi}  |  Renglón Presupuestario: {renglon_codigo}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Puesto Funcional: {puesto_funcional}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Dirección / Unidad: {unidad_administrativa}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>2. PERÍODO SOLICITADO Y DÍAS HÁBILES</w:t></w:r></w:p>
        <w:p><w:r><w:t>Fecha Inicio: {fecha_inicio}  |  Fecha Finalización: {fecha_fin}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Total Días Hábiles Solicitados (excluye asuetos y fines de semana): {dias_solicitados} días</w:t></w:r></w:p>
        <w:p><w:r><w:t>Motivo / Justificación: {motivo}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>3. ESTADO DEL KARDEX OFICIAL</w:t></w:r></w:p>
        <w:p><w:r><w:t>Saldo Previo: {saldo_previo} días  |  Días Solicitados: {dias_solicitados} días  |  Saldo Remanente: {saldo_remanente} días</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:r><w:t>_________________________             _________________________             _________________________</w:t></w:r></w:p>
        <w:p><w:r><w:t>      Firma Colaborador                     Visto Bueno Jefe Inmediato            Aprobación Recursos Humanos</w:t></w:r></w:p>
        <w:p><w:r><w:t>                                             ({jefe_nombre})</w:t></w:r></w:p>
      `;
      return await this.buildDocxFromXml(xml);
    }

    if (codigo === "CONSTANCIA_LABORAL_011_022") {
      const xml = `
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0C2340"/></w:rPr><w:t>SECRETARÍA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>CONSTANCIA LABORAL</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Correlativo: {correlativo}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>A QUIEN INTERESE:</w:t></w:r></w:p>
        <w:p><w:r><w:t>La infrascrita Directora de Recursos Humanos de la Secretaría de Comunicación Social de la Presidencia de la República de Guatemala, HACE CONSTAR que:</w:t></w:r></w:p>
        <w:p><w:r><w:t>El (la) servidor(a) público(a) {colaborador_nombre}, quien se identifica con el Código Único de Identificación (CUI) número {cui_dpi}, presta sus servicios laborales para esta institución gubernamental en el puesto de {puesto_funcional}, habiendo ingresado el {fecha_ingreso}.</w:t></w:r></w:p>
        <w:p><w:r><w:t>Actualmente devenga un salario nominal mensual de {salario_letras} (Q.{salario_numero}), gozando de las prestaciones de ley correspondientes.</w:t></w:r></w:p>
        <w:p><w:r><w:t>Y para los usos legales que al (a la) interesado(a) convengan, se extiende, firma y sella la presente constancia en la Ciudad de Guatemala, el {fecha_emision}.</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>_____________________________________________</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Directora de Recursos Humanos - SCSPR</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="555555"/></w:rPr><w:t>Hash de Validación Criptográfica SHA-256: {hash_verificacion}</w:t></w:r></w:p>
      `;
      return await this.buildDocxFromXml(xml);
    }

    if (codigo === "CONSTANCIA_SERVICIOS_029") {
      const xml = `
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0C2340"/></w:rPr><w:t>SECRETARÍA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>CONSTANCIA DE PRESTACIÓN DE SERVICIOS TÉCNICOS Y PROFESIONALES</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Correlativo: {correlativo}</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>A QUIEN INTERESE:</w:t></w:r></w:p>
        <w:p><w:r><w:t>La infrascrita Directora de Recursos Humanos de la Secretaría de Comunicación Social de la Presidencia de la República, HACE CONSTAR que:</w:t></w:r></w:p>
        <w:p><w:r><w:t>El (la) profesional {colaborador_nombre}, con CUI número {cui_dpi}, presta servicios técnicos y/o profesionales bajo el Renglón Presupuestario 029 (sin relación de dependencia ni subordinación laboral), prestando los servicios de: {objeto_contrato}.</w:t></w:r></w:p>
        <w:p><w:r><w:t>Percibe honorarios mensuales por la cantidad de {honorarios_letras} (Q.{honorarios_numero}), sujetos a retenciones tributarias de ley y contra entrega de Informe Mensual de Actividades y Factura Electrónica FEL.</w:t></w:r></w:p>
        <w:p><w:r><w:t>Vigencia Contractual: {vigencia_contrato}. Se extiende la presente constancia el {fecha_emision}.</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>_____________________________________________</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Directora de Recursos Humanos - SCSPR</w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="555555"/></w:rPr><w:t>Hash de Validación Criptográfica SHA-256: {hash_verificacion}</w:t></w:r></w:p>
      `;
      return await this.buildDocxFromXml(xml);
    }

    // Formato dinámico según el nombre del documento oficial
    const docTitle = (nombre || codigo.replace(/_/g, " ")).toUpperCase();
    const xml = `
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0C2340"/></w:rPr><w:t>SECRETARÍA DE COMUNICACIÓN SOCIAL DE LA PRESIDENCIA</w:t></w:r></w:p>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="C5A059"/></w:rPr><w:t>DIRECCIÓN DE RECURSOS HUMANOS - SCSPR</w:t></w:r></w:p>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>${docTitle}</w:t></w:r></w:p>
      <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Referencia / Correlativo: {correlativo}</w:t></w:r></w:p>
      <w:p><w:r><w:t>En la Ciudad de Guatemala, a los {fecha_emision}, se suscribe el presente documento formal para los registros institucionales correspondientes.</w:t></w:r></w:p>
      <w:p><w:r><w:t>Colaborador / Interesado: {colaborador_nombre}  |  CUI/DPI: {cui_dpi}  |  NIT: {nit}</w:t></w:r></w:p>
      <w:p><w:r><w:t>Puesto Institucional: {puesto_funcional}  |  Unidad Administrativa: {unidad_administrativa}</w:t></w:r></w:p>
      <w:p><w:r><w:t>Período / Vigencia: {vigencia_contrato}</w:t></w:r></w:p>
      <w:p><w:r><w:t> </w:t></w:r></w:p>
      <w:p><w:r><w:t>____________________________          ____________________________</w:t></w:r></w:p>
      <w:p><w:r><w:t>  Por la Autoridad SCSPR                  Colaborador / Interesado</w:t></w:r></w:p>
    `;
    return await this.buildDocxFromXml(xml);
  }

  /**
   * Retrieves active template buffer from database, local institutional folder, or generates it.
   */
  async getTemplateBuffer(codigo) {
    const fs = require("fs");
    const path = require("path");

    // 1. Prioridad: Verificar si la base de datos contiene un archivo personalizado subido por el usuario
    const res = await db.query(
      `SELECT id, codigo, nombre, archivo_contenido, archivo_nombre, LENGTH(archivo_contenido) as bytes 
       FROM plantillas_documentos 
       WHERE codigo = $1 AND activo = true`,
      [codigo]
    );

    // Ignorar si no existe o si es un blob residual de pruebas corrupto (<= 3000 bytes)
    if (res.rows.length > 0 && res.rows[0].archivo_contenido && Number(res.rows[0].bytes) > 3000) {
      return res.rows[0].archivo_contenido;
    }

    // 2. Mapeo exhaustivo a las plantillas oficiales físicas en api/src/templates/core-humanis/
    const templateFileMap = {
      INFORME_MENSUAL_029: "Formatos 029/Formato Informe Mensual.docx",
      INFORME_FINAL_029: "Formatos 029/Formato Informe Final.docx",
      FINIQUITO_029: "Formatos 029/FINIQUITO MODELO 029.docx",
      DECLARACION_JURADA_029: "Formatos 029/ACTA NOTARIAL DE DECLARACIÓN JURADA 029 final con negrita.docx",
      CONSTANCIA_LABORAL_011_022: "Formatos Monitoreo/Plantilla-Constancia-Laboral.docx",
      CONSTANCIA_LABORAL_INGRESOS: "Formatos Monitoreo/Plantilla Constancia Laboral-Ingresos.docx",
      CONSTANCIA_SERVICIOS_029: "Formatos Monitoreo/Plantilla Constancia 029-SG18.docx",
      CONTRATO_022: "Formatos Acciones de puestos/PLANTILLA CONTRATO 022.docx",
      CONTRATO_029: "Formatos Acciones de puestos/Plantilla Contrato 029.docx",
      TOMA_POSESION_021: "Formatos Acciones de puestos/PLANTILLA TOMA DE POSESIÓN RENGLÓN 021.docx",
      ACTA_ENTREGA_011: "Formatos Acciones de puestos/0. FORMATO 011 ACTA ENTREGA.docx",
      SOLICITUD_HORAS_EXTRAS: "Formatos Horas Extra/3. FORMATO DE OFICIO PARA SOLICITUD DE HORAS EXTRAS.docx",
      ASIGNACION_TURNOS_HORIZONTAL: "Formatos Horas Extra/Formato Asignacion Turnos SCSP - Horizontal.docx",
      ASIGNACION_TURNOS_VERTICAL: "Formatos Horas Extra/Formato Asignacion Turnos SCSP - Vertical.docx",
      CONSTANCIA_CODIGO_ETICA: "Formatos Desarrollo/CONSTANCIA DE CODIGO DE ETICA.docx",
      CONSTANCIA_ACOSO: "Formatos Desarrollo/CONSTANCIA DE ACOSO SEXUAL Y LABORAL.docx",
      BOLETA_SOLICITUD_VACACIONES: null // Se genera dinámicamente con diseño específico
    };

    const relFile = templateFileMap[codigo];
    if (relFile) {
      const candidatePaths = [
        path.join(__dirname, "../templates/core-humanis", relFile),
        path.join("/usr/src/app/src/templates/core-humanis", relFile),
        path.join("/usr/src/app/plantillas", relFile),
        path.join(process.cwd(), "src/templates/core-humanis", relFile),
        path.join(process.cwd(), "api/src/templates/core-humanis", relFile)
      ];
      for (const p of candidatePaths) {
        if (p && fs.existsSync(p)) {
          return fs.readFileSync(p);
        }
      }
    }

    // Búsqueda secundaria por archivo_nombre registrado en base de datos
    if (res.rows.length > 0 && res.rows[0].archivo_nombre) {
      const dbFileName = res.rows[0].archivo_nombre;
      const flatCandidates = [
        path.join(__dirname, "../templates/core-humanis", dbFileName),
        path.join(__dirname, "../../../core-humanis-app/template", dbFileName),
        path.join("/usr/src/app/template", dbFileName),
        path.join(process.cwd(), "core-humanis-app/template", dbFileName)
      ];
      for (const p of flatCandidates) {
        if (p && fs.existsSync(p)) {
          return fs.readFileSync(p);
        }
      }
    }

    // 3. Fallback limpio generado dinámicamente (sin sobreescribir la BD para no persistir dummies)
    const docName = res.rows.length > 0 ? res.rows[0].nombre : null;
    return await this.generateDefaultDocx(codigo, docName);
  }

  /**
   * Renders dynamic data into the template and exports to .docx or .pdf.
   * @param {string} codigo - Template code.
   * @param {Object} data - Key-value map of replacement tags.
   * @param {string} format - 'pdf' or 'docx'.
   */
  async renderDocument(codigo, data = {}, format = "pdf") {
    const templateBuffer = await this.getTemplateBuffer(codigo);
    let docxBuffer;
    try {
      docxBuffer = await this.handler.process(templateBuffer, data);
    } catch (parseErr) {
      console.warn(`[TemplatesService] Advertencia al procesar etiquetas en plantilla ${codigo}: ${parseErr.message}. Se entrega plantilla base.`);
      docxBuffer = templateBuffer;
    }

    if (format === "docx") {
      return {
        buffer: docxBuffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extension: "docx",
      };
    }

    // Convert to PDF via libreoffice-convert wrapped in Promise
    try {
      const pdfBuffer = await new Promise((resolve, reject) => {
        libre.convert(docxBuffer, ".pdf", undefined, (err, done) => {
          if (err) return reject(err);
          resolve(done);
        });
      });
      return {
        buffer: pdfBuffer,
        contentType: "application/pdf",
        extension: "pdf",
      };
    } catch (err) {
      // If LibreOffice conversion fails, fallback to docx gracefully
      return {
        buffer: docxBuffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extension: "docx",
        fallbackWarning: "Conversión a PDF no disponible, se entregó formato DOCX: " + err.message,
      };
    }
  }

  /**
   * Updates an existing template with a new .docx buffer.
   * Validates DOCX OpenXML structure before storing.
   */
  async updateTemplateFile(codigo, fileBuffer, fileName) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("El archivo subido está vacío");
    }

    // Límite de tamaño máximo: 15 MB
    if (fileBuffer.length > 15 * 1024 * 1024) {
      throw new Error("El archivo excede el tamaño máximo permitido de 15 MB");
    }

    // Validación de integridad OpenXML / DOCX
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(fileBuffer);
      if (!loadedZip.file("word/document.xml")) {
        throw new Error("El archivo no contiene la estructura word/document.xml de Microsoft Word");
      }
    } catch (zipErr) {
      throw new Error("El archivo no es un documento Word (.docx) válido o está dañado: " + zipErr.message);
    }

    const updateRes = await db.query(
      `UPDATE plantillas_documentos SET archivo_contenido = $1, archivo_nombre = COALESCE($2, archivo_nombre), updated_at = CURRENT_TIMESTAMP WHERE codigo = $3 RETURNING id, codigo, nombre, archivo_nombre`,
      [fileBuffer, fileName, codigo]
    );
    if (updateRes.rows.length === 0) {
      throw new Error(`Plantilla con código ${codigo} no encontrada`);
    }
    return updateRes.rows[0];
  }
}

module.exports = new TemplatesService();
