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

exports.saveOrganigramTree = async (req, res) => {
  let client = null;
  try {
    const { tree, flatUnits } = req.body;
    if (!tree && !flatUnits) {
      return res.status(400).json({ success: false, message: "No se proporcionó la estructura del organigrama." });
    }

    const unitsToProcess = [];
    const flattenNodes = (nodes, parentCodigo = null) => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n || !n.codigo || !n.nombre) continue;
        const cod = String(n.codigo).trim().toUpperCase();
        const nom = String(n.nombre).trim();
        const padCod = n.padre_id || n.padre_codigo || parentCodigo || null;

        const colabs = [
          ...(n.jefes || []),
          ...(n.subordinados || []),
          ...(n.colaboradores || []),
        ];

        unitsToProcess.push({
          codigo: cod,
          nombre: nom,
          padre_codigo: padCod ? String(padCod).trim().toUpperCase() : null,
          colaboradores: colabs,
        });

        if (n.subunidades && Array.isArray(n.subunidades)) {
          flattenNodes(n.subunidades, cod);
        }
      }
    };

    if (Array.isArray(tree) && tree.length > 0) {
      flattenNodes(tree);
    } else if (Array.isArray(flatUnits) && flatUnits.length > 0) {
      for (const u of flatUnits) {
        if (u.codigo && u.nombre) {
          unitsToProcess.push({
            codigo: String(u.codigo).trim().toUpperCase(),
            nombre: String(u.nombre).trim(),
            padre_codigo: u.padre_id || u.padre_codigo ? String(u.padre_id || u.padre_codigo).trim().toUpperCase() : null,
            colaboradores: u.colaboradores || [],
          });
        }
      }
    }

    if (unitsToProcess.length === 0) {
      return res.status(400).json({ success: false, message: "La estructura del organigrama está vacía o carece de unidades válidas." });
    }

    client = await db.getClient();
    await client.query("BEGIN");

    // 1. Guardar/Actualizar cada unidad administrativa por su código único
    const codeToIdMap = new Map();

    for (const u of unitsToProcess) {
      const upsertRes = await client.query(
        `INSERT INTO unidades_administrativas (codigo, nombre, activo)
         VALUES ($1, $2, true)
         ON CONFLICT (codigo) DO UPDATE
         SET nombre = EXCLUDED.nombre, activo = true
         RETURNING id, codigo`,
        [u.codigo, u.nombre]
      );
      if (upsertRes.rows && upsertRes.rows.length > 0) {
        codeToIdMap.set(u.codigo, upsertRes.rows[0].id);
      }
    }

    // 2. Resolver y actualizar la jerarquía de dependencias (dependencia_padre_id)
    for (const u of unitsToProcess) {
      const unitId = codeToIdMap.get(u.codigo);
      if (!unitId) continue;

      let parentId = null;
      if (u.padre_codigo && codeToIdMap.has(u.padre_codigo)) {
        parentId = codeToIdMap.get(u.padre_codigo);
        if (parentId === unitId) parentId = null; // evitar bucle circular
      }

      await client.query(
        `UPDATE unidades_administrativas
         SET dependencia_padre_id = $1
         WHERE id = $2`,
        [parentId, unitId]
      );
    }

    // 3. Asignar colaboradores y actualizar puestos funcionales si aplica
    let colabsUpdated = 0;
    for (const u of unitsToProcess) {
      const unitId = codeToIdMap.get(u.codigo);
      if (!unitId || !u.colaboradores || !u.colaboradores.length) continue;

      for (const c of u.colaboradores) {
        const personaId = c.persona_id;
        const cui = c.cui_dpi;
        const puestoNombre = c.puesto_funcional || c.puesto_nominal;

        let rlRes = null;
        if (personaId && personaId !== '-' && personaId !== 'N/A' && personaId.length > 10) {
          rlRes = await client.query(
            `SELECT rl.id, rl.persona_id
             FROM relaciones_laborales rl
             WHERE rl.persona_id::text = $1 AND rl.estado = 'ACTIVO'
             LIMIT 1`,
            [personaId]
          );
        }

        if ((!rlRes || !rlRes.rows || rlRes.rows.length === 0) && cui && cui !== '-' && cui !== 'N/A') {
          rlRes = await client.query(
            `SELECT rl.id, rl.persona_id
             FROM relaciones_laborales rl
             JOIN personas p ON p.id = rl.persona_id
             WHERE p.cui_dpi = $1 AND rl.estado = 'ACTIVO'
             LIMIT 1`,
            [cui]
          );
        }

        if (rlRes && rlRes.rows && rlRes.rows.length > 0) {
          const rlId = rlRes.rows[0].id;

          let pfId = null;
          if (c.puesto_funcional_id) {
            pfId = c.puesto_funcional_id;
          } else if (puestoNombre) {
            const pfRes = await client.query(
              `SELECT id FROM puestos_funcionales WHERE nombre ILIKE $1 OR codigo ILIKE $1 LIMIT 1`,
              [puestoNombre.trim()]
            );
            if (pfRes.rows && pfRes.rows.length > 0) {
              pfId = pfRes.rows[0].id;
            }
          }

          if (pfId) {
            await client.query(
              `UPDATE relaciones_laborales
               SET unidad_admin_id = $1,
                   puesto_funcional_id = $2,
                   updated_at = NOW()
               WHERE id = $3`,
              [unitId, pfId, rlId]
            );
          } else {
            await client.query(
              `UPDATE relaciones_laborales
               SET unidad_admin_id = $1,
                   updated_at = NOW()
               WHERE id = $2`,
              [unitId, rlId]
            );
          }
          colabsUpdated++;
        }
      }
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Organigrama institucional guardado y persistido exitosamente en la base de datos.",
      total_unidades: unitsToProcess.length,
      colaboradores_asignados: colabsUpdated,
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rbErr) {
        // Ignorar
      }
    }
    console.error("Error al persistir organigrama en PostgreSQL:", error);
    return res.status(500).json({
      success: false,
      message: "Error al guardar el organigrama en la base de datos: " + error.message,
    });
  } finally {
    if (client && typeof client.release === "function") {
      client.release();
    }
  }
};


