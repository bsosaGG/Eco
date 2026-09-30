const db = require("../config/db-core-humanis");
const { buildCatalogLinks } = require("../utils/hateoas.helper");

exports.getCatalogos = async (req, res) => {
  try {
    const [renglonesRes, unidadesRes, puestosNomRes, puestosFuncRes, tiposDocRes, rolesRes] = await Promise.all([
      db.query("SELECT id, codigo, nombre, tipo, tiene_relacion_dependencia, requiere_fianza, requiere_colegiado_activo FROM renglones_presupuestarios ORDER BY codigo"),
      db.query("SELECT id, codigo, nombre, dependencia_padre_id FROM unidades_administrativas ORDER BY codigo"),
      db.query("SELECT id, codigo, nombre FROM puestos_nominales ORDER BY codigo"),
      db.query("SELECT id, codigo, nombre FROM puestos_funcionales ORDER BY codigo"),
      db.query("SELECT id, codigo, nombre, es_obligatorio, requiere_vencimiento, meses_vigencia, dias_alerta_anticipada, renglones_aplicables FROM tipos_documento ORDER BY codigo"),
      db.query("SELECT id, codigo, nombre, descripcion FROM roles ORDER BY codigo"),
    ]);

    res.json({
      success: true,
      data: {
        roles: rolesRes.rows || [],
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

exports.getOrganigramTree = async (req, res) => {
  try {
    const { unitId } = req.query;

    // Obtener todas las unidades o filtrar por unitId
    let unitsQuery = `
      SELECT u.id, u.codigo, u.nombre, u.dependencia_padre_id,
             p.nombre AS padre_nombre, p.codigo AS padre_codigo
      FROM unidades_administrativas u
      LEFT JOIN unidades_administrativas p ON p.id = u.dependencia_padre_id
    `;
    const params = [];

    if (unitId) {
      params.push(unitId);
      unitsQuery += ` WHERE u.id = $1 OR u.dependencia_padre_id = $1`;
    }
    unitsQuery += ` ORDER BY u.codigo ASC`;

    const unitsRes = await db.query(unitsQuery, params);

    // Obtener colaboradores y sus puestos actuales
    const colabsRes = await db.query(`
      SELECT p.id AS persona_id, p.cui_dpi, p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido, p.foto_url,
             rl.id AS contrato_id, rl.unidad_admin_id, rl.puesto_funcional_id, rl.puesto_nominal_id,
             pf.nombre AS puesto_funcional, pn.nombre AS puesto_nominal, r.codigo AS renglon_codigo, r.nombre AS renglon_nombre
      FROM personas p
      JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
      LEFT JOIN puestos_funcionales pf ON pf.id = rl.puesto_funcional_id
      LEFT JOIN puestos_nominales pn ON pn.id = rl.puesto_nominal_id
      LEFT JOIN renglones_presupuestarios r ON r.id = rl.renglon_id
    `);

    // Agrupar colaboradores por unidad clasificando Jefes vs Subordinados
    const colabsByUnit = {};
    colabsRes.rows.forEach((colab) => {
      const uId = colab.unidad_admin_id;
      if (!colabsByUnit[uId]) {
        colabsByUnit[uId] = { jefes: [], subordinados: [], todos: [] };
      }
      
      const puestoLower = (colab.puesto_funcional || colab.puesto_nominal || "").toLowerCase();
      const esJefe = puestoLower.includes("jefe") || 
                     puestoLower.includes("director") || 
                     puestoLower.includes("secretario") || 
                     puestoLower.includes("subsecretario") ||
                     puestoLower.includes("encargado");

      const colabObj = { ...colab, es_jefe: esJefe };
      colabsByUnit[uId].todos.push(colabObj);

      if (esJefe) {
        colabsByUnit[uId].jefes.push(colabObj);
      } else {
        colabsByUnit[uId].subordinados.push(colabObj);
      }
    });

    // Construir estructura jerárquica de unidades
    const unitsMap = {};
    const tree = [];

    unitsRes.rows.forEach((unit) => {
      const group = colabsByUnit[unit.id] || { jefes: [], subordinados: [], todos: [] };
      unitsMap[unit.id] = {
        ...unit,
        jefes: group.jefes,
        subordinados: group.subordinados,
        colaboradores: group.todos,
        total_personal: group.todos.length,
        subunidades: [],
      };
    });

    unitsRes.rows.forEach((unit) => {
      if (unit.dependencia_padre_id && unitsMap[unit.dependencia_padre_id]) {
        unitsMap[unit.dependencia_padre_id].subunidades.push(unitsMap[unit.id]);
      } else {
        tree.push(unitsMap[unit.id]);
      }
    });

    res.json({
      success: true,
      total_unidades: unitsRes.rows.length,
      data: tree,
      flat: Object.values(unitsMap),
    });
  } catch (error) {
    console.error("Error al generar árbol de organigramas:", error);
    res.status(500).json({ success: false, message: "Error al generar organigrama institucional: " + error.message });
  }
};

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

exports.getRoles = async (req, res) => {
  try {
    const result = await db.query("SELECT id, codigo, nombre, descripcion FROM roles ORDER BY codigo");
    res.json({ success: true, data: result.rows || [], _links: buildCatalogLinks() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching roles: " + error.message });
  }
};

