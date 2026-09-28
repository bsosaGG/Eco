const db = require("../config/db-core-humanis");
const { mockData } = require("../config/mock-store");
const { buildCatalogLinks } = require("../utils/hateoas.helper");

exports.getCatalogos = async (req, res) => {
  try {
    let renglones = mockData.renglones;
    try {
      const dbRenglones = await db.query(
        "SELECT id, codigo, nombre, tipo, tiene_relacion_dependencia, requiere_fianza, requiere_colegiado_activo FROM renglones_presupuestarios ORDER BY codigo"
      );
      if (dbRenglones && dbRenglones.rows && dbRenglones.rows.length > 0) {
        renglones = dbRenglones.rows;
      }
    } catch (dbErr) {
      // Resilient fallback to mock-store
    }

    res.json({
      success: true,
      data: {
        roles: mockData.roles,
        renglones,
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
