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
    const nombreArchivoGuardado = `doc_${persona.id.substring(0, 8)}_${Date.now()}.pdf`;
    const rutaAlmacenamiento = `/uploads/expedientes/${nombreArchivoGuardado}`;
    const mimeType = req.file ? req.file.mimetype : "application/pdf";
    const tamanoBytes = req.file ? req.file.size : 154200;

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
