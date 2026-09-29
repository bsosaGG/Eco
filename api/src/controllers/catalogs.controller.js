const db = require("../config/db-core-humanis");
const { buildCatalogLinks } = require("../utils/hateoas.helper");

exports.getCatalogos = async (req, res) => {
  try {
    const [renglonesRes, unidadesRes, puestosNomRes, puestosFuncRes, tiposDocRes] = await Promise.all([
      db.query("SELECT id, codigo, nombre, tipo, tiene_relacion_dependencia, requiere_fianza, requiere_colegiado_activo FROM renglones_presupuestarios ORDER BY codigo"),
      db.query("SELECT id, codigo, nombre, dependencia_padre_id FROM unidades_administrativas ORDER BY codigo"),
      db.query("SELECT id, codigo, nombre FROM puestos_nominales ORDER BY codigo"),
      db.query("SELECT id, codigo, nombre FROM puestos_funcionales ORDER BY codigo"),
      db.query("SELECT id, codigo, nombre, es_obligatorio, requiere_vencimiento, meses_vigencia, dias_alerta_anticipada, renglones_aplicables FROM tipos_documento ORDER BY codigo"),
    ]);

    res.json({
      success: true,
      data: {
        roles: [], // Roles y usuarios gestionados centralmente en http://localhost:8080/profiles
        renglones: renglonesRes.rows || [],
        unidades: unidadesRes.rows || [],
        puestos_nominales: puestosNomRes.rows || [],
        puestos_funcionales: puestosFuncRes.rows || [],
        tipos_documento: tiposDocRes.rows || [],
      },
      _links: buildCatalogLinks(),
    });
  } catch (error) {
    console.error("Error al consultar catálogos en PostgreSQL:", error);
    res.status(500).json({ success: false, message: "Error al consultar catálogos de la base de datos" });
  }
};

exports.getBudgetLines = async (req, res) => {
  try {
    const result = await db.query("SELECT id, codigo, nombre, tipo, tiene_relacion_dependencia, requiere_fianza, requiere_colegiado_activo FROM renglones_presupuestarios ORDER BY codigo");
    res.json({ success: true, data: result.rows || [], _links: buildCatalogLinks() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching budget lines: " + error.message });
  }
};
exports.getRenglones = exports.getBudgetLines;

exports.getUnits = async (req, res) => {
  try {
    const result = await db.query("SELECT id, codigo, nombre, dependencia_padre_id FROM unidades_administrativas ORDER BY codigo");
    res.json({ success: true, data: result.rows || [], _links: buildCatalogLinks() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching units: " + error.message });
  }
};
exports.getUnidades = exports.getUnits;

exports.getNominalPositions = async (req, res) => {
  try {
    const result = await db.query("SELECT id, codigo, nombre FROM puestos_nominales ORDER BY codigo");
    res.json({ success: true, data: result.rows || [], _links: buildCatalogLinks() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching nominal positions: " + error.message });
  }
};
exports.getPuestosNominales = exports.getNominalPositions;

exports.getFunctionalPositions = async (req, res) => {
  try {
    const result = await db.query("SELECT id, codigo, nombre FROM puestos_funcionales ORDER BY codigo");
    res.json({ success: true, data: result.rows || [], _links: buildCatalogLinks() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching functional positions: " + error.message });
  }
};
exports.getPuestosFuncionales = exports.getFunctionalPositions;

exports.getDocumentTypes = async (req, res) => {
  try {
    const result = await db.query("SELECT id, codigo, nombre, es_obligatorio, requiere_vencimiento, meses_vigencia, dias_alerta_anticipada, renglones_aplicables FROM tipos_documento ORDER BY codigo");
    res.json({ success: true, data: result.rows || [], _links: buildCatalogLinks() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching document types: " + error.message });
  }
};
exports.getTiposDocumento = exports.getDocumentTypes;
