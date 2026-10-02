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

    // Default template fallback (Minuta Contrato)
    const xml = `
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0C2340"/></w:rPr><w:t>CONTRATO ADMINISTRATIVO DE SERVICIOS TÉCNICOS Y PROFESIONALES</w:t></w:r></w:p>
      <w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:t>Número de Contrato: {numero_contrato}</w:t></w:r></w:p>
      <w:p><w:r><w:t>En la Ciudad de Guatemala, comparecen por una parte la SCSPR y por la otra el (la) contratista {contratista_nombre}, con CUI {cui_dpi} y NIT {nit}.</w:t></w:r></w:p>
      <w:p><w:r><w:t>Objeto de los Servicios: {objeto_servicios}.</w:t></w:r></w:p>
      <w:p><w:r><w:t>Honorarios pactados: {honorarios_mensuales}. Plazo de vigencia: {plazo_meses} meses.</w:t></w:r></w:p>
      <w:p><w:r><w:t>Ambas partes ratifican, aceptan y firman.</w:t></w:r></w:p>
      <w:p><w:r><w:t> </w:t></w:r></w:p>
      <w:p><w:r><w:t>____________________________          ____________________________</w:t></w:r></w:p>
      <w:p><w:r><w:t>  Por la Autoridad SCSPR                   El (La) Contratista</w:t></w:r></w:p>
    `;
    return await this.buildDocxFromXml(xml);
  }

  /**
   * Retrieves active template buffer from file system (core-humanis-app/template), database, or generates it.
   */
  async getTemplateBuffer(codigo) {
    const fs = require("fs");
    const path = require("path");

    // Mapping of template codes to physical kebab-case files in template directory
    const templateFileMap = {
      "BOLETA_SOLICITUD_VACACIONES": "boleta-solicitud-vacaciones.docx",
      "CONSTANCIA_LABORAL_011_022": "plantilla-constancia-laboral.docx",
      "CONSTANCIA_LABORAL_INGRESOS": "plantilla-constancia-laboral-ingresos.docx",
      "CONSTANCIA_SERVICIOS_029": "plantilla-constancia-029-sg18.docx",
      "CONTRATO_022": "plantilla-contrato-022.docx",
      "CONTRATO_029": "plantilla-contrato-029.docx",
      "CONSTANCIA_CODIGO_ETICA": "constancia-de-codigo-de-etica.docx",
      "CONSTANCIA_ACOSO": "constancia-de-acoso-sexual-y-laboral.docx",
      "SOLICITUD_HORAS_EXTRAS": "3-formato-de-oficio-para-solicitud-de-horas-extras.docx",
      "INFORME_MENSUAL_029": "formato-informe-mensual.docx",
      "INFORME_FINAL_029": "formato-informe-final.docx",
      "FINIQUITO_029": "finiquito-modelo-029.docx",
      "DECLARACION_JURADA_029": "acta-notarial-de-declaracion-jurada-029-final-con-negrita.docx",
    };

    // 1. Prioridad: Verificar si la base de datos ya contiene un archivo modificado por el usuario
    const res = await db.query(
      `SELECT id, codigo, nombre, archivo_contenido FROM plantillas_documentos WHERE codigo = $1 AND activo = true`,
      [codigo]
    );

    if (res.rows.length > 0 && res.rows[0].archivo_contenido) {
      return res.rows[0].archivo_contenido;
    }

    // 2. Fallback: Archivo físico base en el repositorio
    const fileName = templateFileMap[codigo];
    if (fileName) {
      const possiblePaths = [
        path.join("/usr/src/app/template", fileName),
        path.join(__dirname, "../../../core-humanis-app/template", fileName),
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          return fs.readFileSync(p);
        }
      }
    }

    // 3. Generación por defecto si no existe en disco ni en BD
    const buffer = await this.generateDefaultDocx(codigo);
    if (res.rows.length > 0) {
      await db.query(`UPDATE plantillas_documentos SET archivo_contenido = $1, updated_at = CURRENT_TIMESTAMP WHERE codigo = $2`, [buffer, codigo]);
    }
    return buffer;
  }

  /**
   * Renders dynamic data into the template and exports to .docx or .pdf.
   * @param {string} codigo - Template code.
   * @param {Object} data - Key-value map of replacement tags.
   * @param {string} format - 'pdf' or 'docx'.
   */
  async renderDocument(codigo, data = {}, format = "pdf") {
    const templateBuffer = await this.getTemplateBuffer(codigo);
    const docxBuffer = await this.handler.process(templateBuffer, data);

    if (format === "docx") {
      return {
        buffer: docxBuffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        extension: "docx",
      };
    }

    // Convert to PDF via libreoffice-convert
    try {
      const pdfBuffer = await libreConvertAsync(docxBuffer, ".pdf", undefined);
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
        fallbackWarning: "Conversión a PDF no disponible, se entregó formato DOCX",
      };
    }
  }

  /**
   * Updates an existing template with a new .docx buffer.
   */
  async updateTemplateFile(codigo, fileBuffer, fileName) {
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
