const { mockData } = require("../config/mock-store");
const { buildCatalogLinks } = require("../utils/hateoas.helper");

exports.getCatalogos = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        roles: mockData.roles,
        renglones: mockData.renglones,
        unidades: mockData.unidades,
        puestos_nominales: mockData.puestos_nominales,
        puestos_funcionales: mockData.puestos_funcionales,
        tipos_documento: mockData.tipos_documento,
      },
      _links: buildCatalogLinks(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al consultar catálogos" });
  }
};
