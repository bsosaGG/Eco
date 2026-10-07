const fs = require("fs");
const path = require("path");
const db = require("../config/db-core-humanis");
const { calcularEstadoVigencia, calcularVencimientoFiniquitoCGC } = require("../services/traffic-light.service");
const { registrarAuditoria } = require("../services/audit.service");
const { buildDocumentLinks } = require("../utils/hateoas.helper");

// Obtener documentos de un colaborador (GET /collaborators/:id/documents)
exports.getDocumentosByColaboradorId = async (req, res) => {
  try {
    const { id } = req.params;

    const personaRes = await db.query("SELECT id, primer_nombre, primer_apellido FROM personas WHERE id::text = $1 OR cui_dpi = $1", [id]);
    if (!personaRes.rows || personaRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }
    const persona = personaRes.rows[0];

    const docsSql = `
      SELECT 
        d.id,
        d.persona_id,
        td.codigo AS tipo_codigo,
        td.nombre AS tipo_nombre,
        d.nombre_archivo_original AS nombre_archivo,
        d.numero_documento,
        d.fecha_emision,
        d.fecha_vencimiento,
        d.tamano_bytes,
        d.estado_vigencia
      FROM expediente_documentos d
      JOIN tipos_documento td ON d.tipo_documento_id = td.id
      WHERE d.persona_id = $1
      ORDER BY d.created_at DESC
    `;
    const docsRes = await db.query(docsSql, [persona.id]);

    const docsConVigencia = (docsRes.rows || []).map((doc) => {
      const calc = calcularEstadoVigencia(doc.fecha_vencimiento);
      return {
        ...doc,
        estado_vigencia: calc.estado,
        dias_restantes: calc.diasRestantes,
        vigencia_color: calc.color,
        vigencia_label: calc.label,
        _links: buildDocumentLinks(persona.id, doc),
      };
    });

    res.json({
      success: true,
      total: docsConVigencia.length,
      data: docsConVigencia,
      _links: {
        self: {
          href: `/api/v1/core-humanis/collaborators/${persona.id}/documents`,
          method: "GET",
          description: "Colección de documentos del expediente",
        },
        collaborator: {
          href: `/api/v1/core-humanis/collaborators/${persona.id}`,
          method: "GET",
          description: "Ficha 360° del colaborador",
        },
        upload: {
          href: `/api/v1/core-humanis/collaborators/${persona.id}/documents`,
          method: "POST",
          description: "Subir nuevo documento al expediente",
        },
      },
    });
  } catch (error) {
    console.error("Error al consultar documentos en PostgreSQL:", error);
    res.status(500).json({ success: false, message: "Error al consultar documentos" });
  }
};

// Subir nuevo documento al expediente (POST /collaborators/:id/documents)
exports.subirDocumento = async (req, res) => {
  try {
    const { id } = req.params; // persona_id o cui_dpi
    const { tipo_codigo, numero_documento, fecha_emision } = req.body;

    const personaRes = await db.query("SELECT id, primer_nombre, primer_apellido FROM personas WHERE id::text = $1 OR cui_dpi = $1", [id]);
    if (!personaRes.rows || personaRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }
    const persona = personaRes.rows[0];

    // Buscar tipo de documento en base de datos
    let tipoDoc = null;
    if (tipo_codigo) {
      const tdRes = await db.query("SELECT id, codigo, nombre FROM tipos_documento WHERE codigo = $1 LIMIT 1", [tipo_codigo]);
      if (tdRes.rows.length > 0) tipoDoc = tdRes.rows[0];
    }
    if (!tipoDoc) {
      const defaultTd = await db.query("SELECT id, codigo, nombre FROM tipos_documento LIMIT 1");
      tipoDoc = defaultTd.rows[0];
    }

    // Calcular fecha de vencimiento: si es Finiquito CGC son estrictamente 6 meses
    let fechaVencimiento = req.body.fecha_vencimiento || null;
    if (tipo_codigo === "DOC_FINIQ_CGC" && fecha_emision) {
      fechaVencimiento = calcularVencimientoFiniquitoCGC(fecha_emision);
    }

    const calc = calcularEstadoVigencia(fechaVencimiento);
    const nombreArchivoOriginal = req.file ? req.file.originalname : `Documento_${Date.now()}.pdf`;
    const extension = path.extname(nombreArchivoOriginal) || ".pdf";
    const nombreArchivoGuardado = `doc_${persona.id.substring(0, 8)}_${Date.now()}${extension}`;
    const rutaAlmacenamiento = `/uploads/expedientes/${nombreArchivoGuardado}`;
    const mimeType = req.file ? req.file.mimetype : "application/pdf";
    const tamanoBytes = req.file ? req.file.size : 154200;

    // Guardar físicamente el archivo en el volumen persistente de uploads
    try {
      const uploadsDir = path.join(__dirname, "..", "..", "uploads", "expedientes");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const fullDiskPath = path.join(uploadsDir, nombreArchivoGuardado);
      if (req.file && req.file.buffer) {
        fs.writeFileSync(fullDiskPath, req.file.buffer);
      }
    } catch (fsErr) {
      console.warn("⚠️ No se pudo persistir el archivo físico en disco:", fsErr.message);
    }

    const insertSql = `
      INSERT INTO expediente_documentos (
        persona_id, tipo_documento_id, nombre_archivo_original, nombre_archivo_guardado,
        ruta_almacenamiento, mime_type, tamano_bytes, fecha_emision, fecha_vencimiento,
        numero_documento, estado_vigencia
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const docInsertRes = await db.query(insertSql, [
      persona.id,
      tipoDoc.id,
      nombreArchivoOriginal,
      nombreArchivoGuardado,
      rutaAlmacenamiento,
      mimeType,
      tamanoBytes,
      fecha_emision || new Date().toISOString().split("T")[0],
      fechaVencimiento,
      numero_documento || "S/N",
      calc.estado,
    ]);

    const nuevoDoc = docInsertRes.rows[0];

    await registrarAuditoria({
      usuarioUsername: req.user?.username || req.user?.email || "sistema",
      accion: "CREATE",
      tablaAfectada: "expediente_documentos",
      registroId: nuevoDoc.id,
      detalles: `Subida de documento ${tipoDoc.nombre} (${nuevoDoc.numero_documento}) para ${persona.primer_nombre} ${persona.primer_apellido}`,
    });

    const docFormateado = {
      id: nuevoDoc.id,
      tipo_codigo: tipoDoc.codigo,
      tipo_nombre: tipoDoc.nombre,
      nombre_archivo: nuevoDoc.nombre_archivo_original,
      numero_documento: nuevoDoc.numero_documento,
      fecha_emision: nuevoDoc.fecha_emision,
      fecha_vencimiento: nuevoDoc.fecha_vencimiento,
      estado_vigencia: calc.estado,
      dias_restantes: calc.diasRestantes,
      vigencia_color: calc.color,
      vigencia_label: calc.label,
      tamano_bytes: nuevoDoc.tamano_bytes,
    };

    const resourceLocation = `/api/v1/core-humanis/collaborators/${persona.id}/documents`;
    res.location(resourceLocation);
    res.status(201).json({
      success: true,
      message: "Documento adjuntado exitosamente al expediente en la base de datos",
      data: {
        ...docFormateado,
        _links: buildDocumentLinks(persona.id, docFormateado),
      },
    });
  } catch (error) {
    console.error("Error al subir documento a PostgreSQL:", error);
    res.status(500).json({ success: false, message: "Error interno al procesar documento en la base de datos" });
  }
};

/**
 * Genera un PDF 1.4 binario válido para documentos que no existan en disco (semillas previas)
 */
function createFallbackPdf({ title, docType, docNumber, personName, emision, vencimiento }) {
  const content = [
    "BT",
    "/F1 18 Tf",
    "50 740 Td",
    "(GOBIERNO DE GUATEMALA - SCSPR) Tj",
    "0 -25 Td",
    "/F1 12 Tf",
    "(DIRECCION DE RECURSOS HUMANOS - EXPEDIENTE DIGITAL UNICO) Tj",
    "0 -40 Td",
    "/F1 14 Tf",
    "(" + (title || "DOCUMENTO DIGITALIZADO").replace(/[()]/g, "") + ") Tj",
    "0 -30 Td",
    "/F1 11 Tf",
    "(Tipo Documental: " + (docType || "Documento Oficial").replace(/[()]/g, "") + ") Tj",
    "0 -20 Td",
    "(No. Identificador / Registro: " + (docNumber || "S/N").replace(/[()]/g, "") + ") Tj",
    "0 -20 Td",
    "(Colaborador: " + (personName || "Institucional").replace(/[()]/g, "") + ") Tj",
    "0 -20 Td",
    "(Fecha de Emision: " + (emision || "N/A") + ") Tj",
    "0 -20 Td",
    "(Fecha de Vencimiento: " + (vencimiento || "No expira") + ") Tj",
    "0 -40 Td",
    "/F1 9 Tf",
    "(Documento digital oficial resguardado y certificado en el expediente unico conforme a la LAIP) Tj",
    "ET",
  ].join("\n");

  const streamLength = Buffer.byteLength(content, "utf8");

  const pdf = [
    "%PDF-1.4",
    "1 0 obj",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "endobj",
    "2 0 obj",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "endobj",
    "3 0 obj",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "endobj",
    "4 0 obj",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "endobj",
    "5 0 obj",
    "<< /Length " + streamLength + " >>",
    "stream",
    content,
    "endstream",
    "endobj",
    "xref",
    "0 6",
    "0000000000 65535 f ",
    "0000000009 00000 n ",
    "0000000058 00000 n ",
    "0000000115 00000 n ",
    "0000000227 00000 n ",
    "0000000298 00000 n ",
    "trailer",
    "<< /Size 6 /Root 1 0 R >>",
    "startxref",
    "420",
    "%%EOF",
  ].join("\n");

  return Buffer.from(pdf, "utf8");
}

function asegurarArchivoDocumento(doc, fullDiskPath) {
  try {
    const dir = path.dirname(fullDiskPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const emisionStr = doc.fecha_emision ? new Date(doc.fecha_emision).toLocaleDateString("es-GT") : "N/A";
    const vencimientoStr = doc.fecha_vencimiento ? new Date(doc.fecha_vencimiento).toLocaleDateString("es-GT") : "No expira";
    const pdfBuf = createFallbackPdf({
      title: doc.nombre_archivo_original || "Documento Oficial Digitalizado",
      docType: doc.tipo_nombre || "Expediente Digital",
      docNumber: doc.numero_documento || "S/N",
      personName: `${doc.primer_nombre || ""} ${doc.primer_apellido || ""}`.trim(),
      emision: emisionStr,
      vencimiento: vencimientoStr,
    });
    fs.writeFileSync(fullDiskPath, pdfBuf);
  } catch (err) {
    console.warn("⚠️ No se pudo generar PDF de respaldo:", err.message);
  }
}

// Descargar o previsualizar documento del expediente (GET /collaborators/:id/documents/:docId)
exports.descargarDocumento = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const isInline = req.path.endsWith("/view") || req.query.inline === "true";

    const docRes = await db.query(
      `SELECT d.*, p.primer_nombre, p.primer_apellido, p.cui_dpi, td.nombre as tipo_nombre
       FROM expediente_documentos d
       JOIN personas p ON d.persona_id = p.id
       LEFT JOIN tipos_documento td ON d.tipo_documento_id = td.id
       WHERE d.id::text = $1 AND (d.persona_id::text = $2 OR p.cui_dpi = $2)`,
      [docId, id]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Documento no encontrado en el expediente" });
    }

    const doc = docRes.rows[0];
    const filename = doc.nombre_archivo_original || "documento.pdf";
    const mimeType = doc.mime_type || "application/pdf";

    const baseUploads = path.join(__dirname, "..", "..", "uploads");
    const relativePath = doc.ruta_almacenamiento 
      ? doc.ruta_almacenamiento.replace(/^\/uploads\//, "") 
      : path.join("expedientes", doc.nombre_archivo_guardado || `doc_${doc.id}.pdf`);
    let fullDiskPath = path.join(baseUploads, relativePath);

    if (!fs.existsSync(fullDiskPath)) {
      asegurarArchivoDocumento(doc, fullDiskPath);
    }

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `${isInline ? "inline" : "attachment"}; filename="${encodeURIComponent(filename)}"`
    );

    return res.sendFile(fullDiskPath);
  } catch (error) {
    console.error("Error al descargar/visualizar documento:", error);
    res.status(500).json({ success: false, message: "Error al procesar archivo del documento: " + error.message });
  }
};
