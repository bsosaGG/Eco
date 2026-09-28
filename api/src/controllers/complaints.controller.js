const complaintsService = require("../services/complaints.service");
const { buildComplaintLinks, buildComplaintCollectionLinks } = require("../utils/hateoas.helper");

/**
 * Controlador RESTful Nivel 3 HATEOAS para Buzón de Denuncias SCSPR
 */

exports.createComplaint = async (req, res) => {
  try {
    const { tipo_denuncia, descripcion } = req.body;
    if (!tipo_denuncia || !descripcion) {
      return res.status(400).json({
        success: false,
        message: "El tipo de denuncia y la descripción de los hechos son campos obligatorios",
      });
    }

    const complaint = await complaintsService.createComplaint(
      req.body,
      req.ip,
      req.headers["user-agent"]
    );

    res.status(201).json({
      success: true,
      message: "Denuncia registrada confidencialmente en el Buzón Institucional SCSPR",
      data: {
        ...complaint,
        _links: buildComplaintLinks(complaint),
      },
      _links: buildComplaintCollectionLinks(),
    });
  } catch (error) {
    req.log?.error?.(error, "Error al registrar denuncia");
    res.status(500).json({
      success: false,
      message: error.message || "Error al procesar la denuncia en el sistema",
    });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const result = await complaintsService.getComplaints(req.query);

    const items = result.items.map((c) => ({
      ...c,
      _links: buildComplaintLinks(c),
    }));

    res.json({
      success: true,
      data: items,
      pagination: result.pagination,
      _links: buildComplaintCollectionLinks(req.query),
    });
  } catch (error) {
    req.log?.error?.(error, "Error al listar denuncias");
    res.status(500).json({
      success: false,
      message: "Error al consultar el buzón de denuncias",
    });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await complaintsService.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Denuncia no encontrada",
      });
    }

    res.json({
      success: true,
      data: {
        ...complaint,
        _links: buildComplaintLinks(complaint),
      },
      _links: buildComplaintCollectionLinks(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al consultar la denuncia",
    });
  }
};

exports.trackComplaint = async (req, res) => {
  try {
    const trackingCode = req.params.trackingCode;
    if (!trackingCode) {
      return res.status(400).json({
        success: false,
        message: "Código de seguimiento no especificado",
      });
    }

    const complaint = await complaintsService.trackComplaint(trackingCode);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "No se encontró ningún expediente con el código de seguimiento indicado. Verifique que los caracteres sean exactos.",
      });
    }

    res.json({
      success: true,
      message: "Estado de la denuncia recuperado confidencialmente",
      data: {
        ...complaint,
        _links: {
          self: { href: `/api/v1/core-humanis/complaints/track/${trackingCode}`, method: "GET" },
          create: { href: "/api/v1/core-humanis/complaints", method: "POST" },
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al rastrear la denuncia",
    });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { estado, resolucion_nota } = req.body;
    if (!estado) {
      return res.status(400).json({
        success: false,
        message: "El estado es un campo requerido",
      });
    }

    const updated = await complaintsService.updateComplaintStatus(
      req.params.id,
      {
        estado,
        resolucion_nota,
        usuario_id: req.user?.id || null,
      },
      req.ip
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Denuncia no encontrada para actualizar",
      });
    }

    res.json({
      success: true,
      message: `Estado de la denuncia actualizado exitosamente a '${estado}'`,
      data: {
        ...updated,
        _links: buildComplaintLinks(updated),
      },
      _links: buildComplaintCollectionLinks(),
    });
  } catch (error) {
    req.log?.error?.(error, "Error al actualizar estado de la denuncia");
    res.status(500).json({
      success: false,
      message: error.message || "Error al actualizar la denuncia",
    });
  }
};
