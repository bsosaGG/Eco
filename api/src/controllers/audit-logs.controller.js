const { mockData } = require("../config/mock-store");
const { buildAuditCollectionLinks } = require("../utils/hateoas.helper");

exports.getLogs = async (req, res) => {
  try {
    const { usuario, accion, tabla } = req.query;

    let items = [...mockData.auditoria];

    if (usuario) {
      items = items.filter((l) => l.usuario.toLowerCase().includes(usuario.toLowerCase()));
    }
    if (accion) {
      items = items.filter((l) => l.accion === accion);
    }
    if (tabla) {
      items = items.filter((l) => l.tabla_afectada === tabla);
    }

    const itemsWithLinks = items.map((l) => ({
      ...l,
      _links: {
        self: {
          href: `/api/v1/core-humanis/audit-logs?tabla=${encodeURIComponent(l.tabla_afectada || "")}`,
          method: "GET",
        },
      },
    }));

    res.json({
      success: true,
      total: itemsWithLinks.length,
      data: itemsWithLinks,
      _links: buildAuditCollectionLinks(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al consultar bitácora de auditoría" });
  }
};
