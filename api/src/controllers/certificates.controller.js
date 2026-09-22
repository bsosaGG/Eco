const { mockData } = require("../config/mock-store");
const {
  generarCorrelativo,
  generarHashVerificacion,
  generarCodigoQR,
  construirTextoLegalConstancia,
} = require("../services/certificates.service");
const { registrarAuditoria } = require("../services/audit.service");
const {
  buildCertificateLinks,
  buildCertificateCollectionLinks,
  buildVerificationLinks,
} = require("../utils/hateoas.helper");

// Generar nueva constancia oficial con código QR (POST /certificates)
exports.generarConstancia = async (req, res) => {
  try {
    const { persona_id, dirigido_a, incluye_salario } = req.body;

    const colaborador = mockData.personas.find((p) => p.id === persona_id);
    if (!colaborador) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }

    const contrato = colaborador.contrato_actual;
    if (!contrato) {
      return res.status(400).json({ success: false, message: "El colaborador no posee contrato activo vigente" });
    }

    const correlativo = generarCorrelativo();
    const timestamp = Date.now();
    const hash = generarHashVerificacion(correlativo, colaborador.cui_dpi, timestamp);
    const qrCodeDataUrl = await generarCodigoQR(hash);

    const textoLegal = construirTextoLegalConstancia({
      colaborador,
      contrato,
      dirigidoA: dirigido_a || "A QUIEN INTERESE",
      incluyeSalario: incluye_salario !== false,
      fechaEmision: new Date(),
    });

    const constancia = {
      id: `const-${timestamp}`,
      correlativo,
      persona_id,
      colaborador_nombre: `${colaborador.primer_nombre} ${colaborador.primer_apellido}`,
      cui_dpi: colaborador.cui_dpi,
      renglon: contrato.renglon_codigo,
      tipo_constancia: ["011", "021", "022"].includes(contrato.renglon_codigo) ? "LABORAL" : "SERVICIOS",
      dirigido_a: dirigido_a || "A QUIEN INTERESE",
      incluye_salario: incluye_salario !== false,
      hash_verificacion: hash,
      qr_code: qrCodeDataUrl,
      texto_legal: textoLegal,
      fecha_emision: new Date().toISOString(),
      emitido_por: req.user?.nombres || "Licda. María Elena Morales Paz",
      estado: "VALIDA",
    };

    mockData.constancias.unshift(constancia);

    await registrarAuditoria({
      usuarioUsername: req.user?.username || "sistema",
      accion: "EMITIR_CONSTANCIA",
      tablaAfectada: "constancias_emitidas",
      registroId: constancia.id,
      detalles: `Emisión de constancia ${correlativo} para ${constancia.colaborador_nombre}`,
    });

    const resourceLocation = `/api/v1/core-humanis/certificates/${constancia.id}`;
    res.location(resourceLocation);
    res.status(201).json({
      success: true,
      message: "Constancia emitida exitosamente",
      data: {
        ...constancia,
        _links: buildCertificateLinks(constancia),
      },
    });
  } catch (error) {
    console.error("Error al generar constancia:", error);
    res.status(500).json({ success: false, message: "Error interno al generar constancia" });
  }
};

// Listado de constancias emitidas (GET /certificates)
exports.getConstancias = async (req, res) => {
  try {
    const { persona_id } = req.query;
    let list = mockData.constancias;
    if (persona_id) {
      list = list.filter((c) => c.persona_id === persona_id);
    }

    const items = list.map((c) => ({
      ...c,
      _links: buildCertificateLinks(c),
    }));

    res.json({
      success: true,
      total: items.length,
      data: items,
      _links: buildCertificateCollectionLinks(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al consultar constancias" });
  }
};

// Detalle de constancia por ID (GET /certificates/:id)
exports.getConstanciaById = async (req, res) => {
  try {
    const { id } = req.params;
    const constancia = mockData.constancias.find(
      (c) => c.id === id || c.correlativo === id
    );

    if (!constancia) {
      return res.status(404).json({ success: false, message: "Constancia no encontrada" });
    }

    res.json({
      success: true,
      data: {
        ...constancia,
        _links: buildCertificateLinks(constancia),
      },
      _links: {
        self: { href: `/api/v1/core-humanis/certificates/${id}`, method: "GET" },
        collection: { href: "/api/v1/core-humanis/certificates", method: "GET" },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al consultar constancia" });
  }
};

// Verificación pública vía QR (Acceso Libre) (GET /certificates/verifications/:hash)
exports.verificarConstancia = async (req, res) => {
  try {
    const { hash } = req.params;
    const constancia = mockData.constancias.find((c) => c.hash_verificacion === hash);

    if (!constancia) {
      return res.status(404).json({
        success: false,
        valido: false,
        message: "El código o documento no es auténtico o no se encuentra registrado en el sistema institucional de la SCSPR.",
      });
    }

    const cuiMasked = constancia.cui_dpi
      ? constancia.cui_dpi.replace(/(\d{4})\d{5}(\d{4})/, "$1*****$2")
      : "1984*****0101";

    res.json({
      success: true,
      valido: true,
      mensaje: "Documento Institucional Auténtico y Válido",
      data: {
        correlativo: constancia.correlativo,
        colaborador_nombre: constancia.colaborador_nombre,
        cui_dpi_enmascarado: cuiMasked,
        tipo_constancia: constancia.tipo_constancia,
        fecha_emision: constancia.fecha_emision,
        emitido_por: constancia.emitido_por,
        estado: constancia.estado || "VALIDA",
        institucion: "Secretaría de Comunicación Social de la Presidencia de la República (SCSPR)",
      },
      _links: buildVerificationLinks(hash),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al verificar constancia" });
  }
};
