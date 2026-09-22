const { mockData } = require("../config/mock-store");
const { calcularEstadoVigencia, calcularVencimientoFiniquitoCGC } = require("../services/traffic-light.service");
const { registrarAuditoria } = require("../services/audit.service");
const { buildDocumentLinks } = require("../utils/hateoas.helper");

// Obtener documentos de un colaborador (GET /collaborators/:id/documents)
exports.getDocumentosByColaboradorId = async (req, res) => {
  try {
    const { id } = req.params;
    const persona = mockData.personas.find((p) => p.id === id);

    if (!persona) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }

    const docsConVigencia = (persona.documentos || []).map((doc) => {
      const calc = calcularEstadoVigencia(doc.fecha_vencimiento);
      return {
        ...doc,
        estado_vigencia: calc.estado,
        dias_restantes: calc.diasRestantes,
        vigencia_color: calc.color,
        vigencia_label: calc.label,
        _links: buildDocumentLinks(id, doc),
      };
    });

    res.json({
      success: true,
      total: docsConVigencia.length,
      data: docsConVigencia,
      _links: {
        self: {
          href: `/api/v1/core-humanis/collaborators/${id}/documents`,
          method: "GET",
          description: "Colección de documentos del expediente",
        },
        collaborator: {
          href: `/api/v1/core-humanis/collaborators/${id}`,
          method: "GET",
          description: "Ficha 360° del colaborador",
        },
        upload: {
          href: `/api/v1/core-humanis/collaborators/${id}/documents`,
          method: "POST",
          description: "Subir nuevo documento al expediente",
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al consultar documentos" });
  }
};

// Subir nuevo documento al expediente (POST /collaborators/:id/documents)
exports.subirDocumento = async (req, res) => {
  try {
    const { id } = req.params; // persona_id
    const { tipo_codigo, numero_documento, fecha_emision } = req.body;

    const persona = mockData.personas.find((p) => p.id === id);
    if (!persona) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }

    const tipoDoc = mockData.tipos_documento.find((t) => t.codigo === tipo_codigo) || {
      nombre: "Documento Adjunto Institucional",
      codigo: tipo_codigo || "DOC_GENERAL",
    };

    // Calcular fecha de vencimiento: si es Finiquito CGC son estrictamente 6 meses
    let fechaVencimiento = req.body.fecha_vencimiento || null;
    if (tipo_codigo === "DOC_FINIQ_CGC" && fecha_emision) {
      fechaVencimiento = calcularVencimientoFiniquitoCGC(fecha_emision);
    }

    const nombreArchivo = req.file ? req.file.originalname : `Documento_${Date.now()}.pdf`;

    const calc = calcularEstadoVigencia(fechaVencimiento);

    const nuevoDoc = {
      id: `doc-${Date.now()}`,
      tipo_codigo: tipoDoc.codigo,
      tipo_nombre: tipoDoc.nombre,
      nombre_archivo: nombreArchivo,
      numero_documento: numero_documento || "S/N",
      fecha_emision: fecha_emision || new Date().toISOString().split("T")[0],
      fecha_vencimiento: fechaVencimiento,
      estado_vigencia: calc.estado,
      dias_restantes: calc.diasRestantes,
      vigencia_color: calc.color,
      vigencia_label: calc.label,
      tamano_bytes: req.file ? req.file.size : 154200,
    };

    persona.documentos = persona.documentos || [];
    persona.documentos.push(nuevoDoc);

    await registrarAuditoria({
      usuarioUsername: req.user?.username || "sistema",
      accion: "CREATE",
      tablaAfectada: "expediente_documentos",
      registroId: nuevoDoc.id,
      detalles: `Subida de documento ${tipoDoc.nombre} (${nuevoDoc.numero_documento}) para ${persona.primer_nombre} ${persona.primer_apellido}`,
    });

    const resourceLocation = `/api/v1/core-humanis/collaborators/${id}/documents`;
    res.location(resourceLocation);
    res.status(201).json({
      success: true,
      message: "Documento adjuntado exitosamente al expediente",
      data: {
        ...nuevoDoc,
        _links: buildDocumentLinks(id, nuevoDoc),
      },
    });
  } catch (error) {
    console.error("Error al subir documento:", error);
    res.status(500).json({ success: false, message: "Error interno al procesar documento" });
  }
};
