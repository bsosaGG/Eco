const db = require("../config/db-core-humanis");
const { evaluarIntegridadExpediente } = require("../services/traffic-light.service");
const { registrarAuditoria } = require("../services/audit.service");
const {
  buildCollaboratorLinks,
  buildCollaboratorCollectionLinks,
} = require("../utils/hateoas.helper");

// Listado de colaboradores con filtros multicriterio, paginación hipermedia y cálculo de semáforo (PostgreSQL Directo)
exports.getColaboradores = async (req, res) => {
  try {
    const { search, renglon, unidad, estado, estado_expediente, page, limit } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = limit ? Math.max(1, parseInt(limit, 10)) : 10;
    const offset = (currentPage - 1) * pageLimit;

    let whereConditions = ["p.activo = true"];
    let queryParams = [];
    let paramIdx = 1;

    // Filtro por texto libre (nombre, CUI, NIT, puesto)
    if (search && search.trim() !== "") {
      const q = `%${search.trim().toLowerCase()}%`;
      whereConditions.push(`(
        LOWER(p.primer_nombre || ' ' || COALESCE(p.segundo_nombre, '') || ' ' || p.primer_apellido || ' ' || COALESCE(p.segundo_apellido, '')) LIKE $${paramIdx}
        OR LOWER(COALESCE(p.cui_dpi, '')) LIKE $${paramIdx}
        OR LOWER(COALESCE(p.nit, '')) LIKE $${paramIdx}
        OR LOWER(COALESCE(pf.nombre, '')) LIKE $${paramIdx}
        OR LOWER(COALESCE(pn.nombre, '')) LIKE $${paramIdx}
      )`);
      queryParams.push(q);
      paramIdx++;
    }

    // Filtro por Renglón Presupuestario
    if (renglon && renglon !== "ALL") {
      whereConditions.push(`rp.codigo = $${paramIdx}`);
      queryParams.push(renglon);
      paramIdx++;
    }

    // Filtro por Unidad Administrativa
    if (unidad && unidad !== "ALL") {
      whereConditions.push(`(ua.id::text = $${paramIdx} OR ua.codigo = $${paramIdx} OR LOWER(ua.nombre) LIKE $${paramIdx + 1})`);
      queryParams.push(unidad);
      queryParams.push(`%${unidad.toLowerCase()}%`);
      paramIdx += 2;
    }

    // Filtro por estado de relación laboral
    if (estado && estado !== "ALL") {
      whereConditions.push(`rl.estado = $${paramIdx}`);
      queryParams.push(estado);
      paramIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Consulta consolidada con relaciones laborales activas y documentos
    const sqlQuery = `
      SELECT 
        p.id,
        p.cui_dpi,
        p.nit,
        p.igss_afiliacion,
        p.primer_nombre,
        p.segundo_nombre,
        p.otros_nombres,
        p.primer_apellido,
        p.segundo_apellido,
        p.apellido_casada,
        p.fecha_nacimiento,
        p.genero,
        p.estado_civil,
        p.nacionalidad,
        p.direccion_residencia,
        p.departamento,
        p.municipio,
        p.telefono_personal,
        p.correo_personal,
        p.correo_institucional,
        p.foto_url,
        p.activo,
        p.created_at,
        p.updated_at,
        -- Contrato Actual
        rl.id AS contrato_id,
        rl.numero_acuerdo_contrato,
        rl.partida_presupuestaria,
        rl.fecha_inicio,
        rl.fecha_fin,
        rl.salario_honorarios,
        rl.estado AS contrato_estado,
        rl.numero_fianza,
        rl.aseguradora_fianza,
        rl.vigencia_fianza,
        rp.id AS renglon_id,
        rp.codigo AS renglon_codigo,
        rp.nombre AS renglon_nombre,
        pn.id AS puesto_nominal_id,
        pn.nombre AS puesto_nominal,
        pf.id AS puesto_funcional_id,
        pf.nombre AS puesto_funcional,
        ua.id AS unidad_admin_id,
        ua.nombre AS unidad_admin,
        -- Documentos del expediente en JSON
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', d.id,
                'tipo_codigo', td.codigo,
                'tipo_nombre', td.nombre,
                'nombre_archivo', d.nombre_archivo_original,
                'numero_documento', d.numero_documento,
                'fecha_emision', d.fecha_emision,
                'fecha_vencimiento', d.fecha_vencimiento,
                'tamano_bytes', d.tamano_bytes,
                'estado_vigencia', d.estado_vigencia
              )
            )
            FROM expediente_documentos d
            JOIN tipos_documento td ON d.tipo_documento_id = td.id
            WHERE d.persona_id = p.id
          ),
          '[]'::json
        ) AS documentos
      FROM personas p
      LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
      LEFT JOIN renglones_presupuestarios rp ON rl.renglon_id = rp.id
      LEFT JOIN puestos_nominales pn ON rl.puesto_nominal_id = pn.id
      LEFT JOIN puestos_funcionales pf ON rl.puesto_funcional_id = pf.id
      LEFT JOIN unidades_administrativas ua ON rl.unidad_admin_id = ua.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    const result = await db.query(sqlQuery, queryParams);
    const rows = result.rows || [];

    // Mapeo a objeto canónico con contrato_actual estructurado y semáforo
    let colaboradores = rows.map((r) => {
      const documentos = r.documentos || [];
      const contrato_actual = r.contrato_id
        ? {
            id: r.contrato_id,
            renglon_codigo: r.renglon_codigo,
            renglon_nombre: r.renglon_nombre,
            renglon_id: r.renglon_id,
            puesto_nominal: r.puesto_nominal,
            puesto_nominal_id: r.puesto_nominal_id,
            puesto_funcional: r.puesto_funcional,
            puesto_funcional_id: r.puesto_funcional_id,
            unidad_admin: r.unidad_admin,
            unidad_admin_id: r.unidad_admin_id,
            numero_acuerdo_contrato: r.numero_acuerdo_contrato,
            partida_presupuestaria: r.partida_presupuestaria,
            fecha_inicio: r.fecha_inicio,
            fecha_fin: r.fecha_fin,
            salario_honorarios: Number(r.salario_honorarios || 0),
            numero_fianza: r.numero_fianza,
            aseguradora_fianza: r.aseguradora_fianza,
            vigencia_fianza: r.vigencia_fianza,
            estado: r.contrato_estado || "ACTIVO",
          }
        : null;

      const semaforo_expediente = evaluarIntegridadExpediente(documentos, r.renglon_codigo);

      const pObj = {
        id: r.id,
        cui_dpi: r.cui_dpi,
        nit: r.nit,
        igss_afiliacion: r.igss_afiliacion,
        primer_nombre: r.primer_nombre,
        segundo_nombre: r.segundo_nombre,
        otros_nombres: r.otros_nombres,
        primer_apellido: r.primer_apellido,
        segundo_apellido: r.segundo_apellido,
        apellido_casada: r.apellido_casada,
        fecha_nacimiento: r.fecha_nacimiento,
        genero: r.genero,
        estado_civil: r.estado_civil,
        nacionalidad: r.nacionalidad,
        direccion_residencia: r.direccion_residencia,
        departamento: r.departamento,
        municipio: r.municipio,
        telefono_personal: r.telefono_personal,
        correo_personal: r.correo_personal,
        correo_institucional: r.correo_institucional,
        foto_url: r.foto_url,
        activo: r.activo,
        contrato_actual,
        documentos,
        semaforo_expediente,
      };

      return {
        ...pObj,
        _links: buildCollaboratorLinks(pObj),
      };
    });

    // Filtro en memoria para estado_expediente si aplica
    if (estado_expediente && estado_expediente !== "ALL") {
      colaboradores = colaboradores.filter((c) => c.semaforo_expediente.estado === estado_expediente);
    }

    const total = colaboradores.length;
    const totalPages = Math.max(1, Math.ceil(total / pageLimit));
    const paginatedItems = colaboradores.slice(offset, offset + pageLimit);

    const queryFilters = {};
    if (search) queryFilters.search = search;
    if (renglon && renglon !== "ALL") queryFilters.renglon = renglon;
    if (unidad && unidad !== "ALL") queryFilters.unidad = unidad;
    if (estado_expediente && estado_expediente !== "ALL") queryFilters.estado_expediente = estado_expediente;

    const paginationMeta = {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages,
    };

    res.json({
      success: true,
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages,
      data: paginatedItems,
      _links: buildCollaboratorCollectionLinks(queryFilters, paginationMeta),
    });
  } catch (error) {
    console.error("Error al obtener colaboradores desde PostgreSQL:", error);
    res.status(500).json({ success: false, message: "Error interno al consultar colaboradores de la base de datos" });
  }
};

// Ficha 360° Dossier Completo (PostgreSQL Directo)
exports.getColaboradorById = async (req, res) => {
  try {
    const { id } = req.params;

    const sqlQuery = `
      SELECT 
        p.*,
        rl.id AS contrato_id,
        rl.numero_acuerdo_contrato,
        rl.partida_presupuestaria,
        rl.fecha_inicio,
        rl.fecha_fin,
        rl.salario_honorarios,
        rl.estado AS contrato_estado,
        rl.numero_fianza,
        rl.aseguradora_fianza,
        rl.vigencia_fianza,
        rp.id AS renglon_id,
        rp.codigo AS renglon_codigo,
        rp.nombre AS renglon_nombre,
        pn.id AS puesto_nominal_id,
        pn.nombre AS puesto_nominal,
        pf.id AS puesto_funcional_id,
        pf.nombre AS puesto_funcional,
        ua.id AS unidad_admin_id,
        ua.nombre AS unidad_admin,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', d.id,
                'tipo_codigo', td.codigo,
                'tipo_nombre', td.nombre,
                'nombre_archivo', d.nombre_archivo_original,
                'numero_documento', d.numero_documento,
                'fecha_emision', d.fecha_emision,
                'fecha_vencimiento', d.fecha_vencimiento,
                'tamano_bytes', d.tamano_bytes,
                'estado_vigencia', d.estado_vigencia
              )
            )
            FROM expediente_documentos d
            JOIN tipos_documento td ON d.tipo_documento_id = td.id
            WHERE d.persona_id = p.id
          ),
          '[]'::json
        ) AS documentos,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', e.id,
                'nivel_academico', e.nivel_academico,
                'titulo_obtenido', e.titulo_obtenido,
                'institucion', e.institucion,
                'campo_estudio', e.campo_estudio,
                'fecha_inicio', e.fecha_inicio,
                'fecha_graduacion', e.fecha_graduacion,
                'en_curso', e.en_curso,
                'notas', e.notas,
                'colegio_profesional', e.colegio_profesional,
                'numero_colegiado', e.numero_colegiado,
                'vigencia_colegiado', e.vigencia_colegiado,
                'estado_colegiado', e.estado_colegiado
              )
            )
            FROM estudios_academicos e
            WHERE e.persona_id = p.id
          ),
          '[]'::json
        ) AS estudios
      FROM personas p
      LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
      LEFT JOIN renglones_presupuestarios rp ON rl.renglon_id = rp.id
      LEFT JOIN puestos_nominales pn ON rl.puesto_nominal_id = pn.id
      LEFT JOIN puestos_funcionales pf ON rl.puesto_funcional_id = pf.id
      LEFT JOIN unidades_administrativas ua ON rl.unidad_admin_id = ua.id
      WHERE p.id::text = $1 OR p.cui_dpi = $1
      LIMIT 1
    `;

    const result = await db.query(sqlQuery, [id]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado en la base de datos" });
    }

    const r = result.rows[0];
    const documentos = r.documentos || [];
    const contrato_actual = r.contrato_id
      ? {
          id: r.contrato_id,
          renglon_codigo: r.renglon_codigo,
          renglon_nombre: r.renglon_nombre,
          renglon_id: r.renglon_id,
          puesto_nominal: r.puesto_nominal,
          puesto_nominal_id: r.puesto_nominal_id,
          puesto_funcional: r.puesto_funcional,
          puesto_funcional_id: r.puesto_funcional_id,
          unidad_admin: r.unidad_admin,
          unidad_admin_id: r.unidad_admin_id,
          numero_acuerdo_contrato: r.numero_acuerdo_contrato,
          partida_presupuestaria: r.partida_presupuestaria,
          fecha_inicio: r.fecha_inicio,
          fecha_fin: r.fecha_fin,
          salario_honorarios: Number(r.salario_honorarios || 0),
          numero_fianza: r.numero_fianza,
          aseguradora_fianza: r.aseguradora_fianza,
          vigencia_fianza: r.vigencia_fianza,
          estado: r.contrato_estado || "ACTIVO",
        }
      : null;

    const semaforo_expediente = evaluarIntegridadExpediente(documentos, r.renglon_codigo);

    const persona = {
      id: r.id,
      cui_dpi: r.cui_dpi,
      nit: r.nit,
      igss_afiliacion: r.igss_afiliacion,
      primer_nombre: r.primer_nombre,
      segundo_nombre: r.segundo_nombre,
      otros_nombres: r.otros_nombres,
      primer_apellido: r.primer_apellido,
      segundo_apellido: r.segundo_apellido,
      apellido_casada: r.apellido_casada,
      fecha_nacimiento: r.fecha_nacimiento,
      genero: r.genero,
      estado_civil: r.estado_civil,
      nacionalidad: r.nacionalidad,
      direccion_residencia: r.direccion_residencia,
      departamento: r.departamento,
      municipio: r.municipio,
      telefono_personal: r.telefono_personal,
      correo_personal: r.correo_personal,
      correo_institucional: r.correo_institucional,
      foto_url: r.foto_url,
      activo: r.activo,
      contrato_actual,
      documentos,
      estudios: r.estudios || [],
      semaforo_expediente,
    };

    res.json({
      success: true,
      data: {
        ...persona,
        _links: buildCollaboratorLinks(persona),
      },
      _links: {
        self: { href: `/api/v1/core-humanis/collaborators/${persona.id}`, method: "GET" },
        collection: { href: "/api/v1/core-humanis/collaborators", method: "GET" },
      },
    });
  } catch (error) {
    console.error("Error al obtener colaborador por ID:", error);
    res.status(500).json({ success: false, message: "Error al consultar ficha 360°" });
  }
};

// Crear nuevo colaborador (PostgreSQL Directo)
exports.crearColaborador = async (req, res) => {
  try {
    const {
      cui_dpi,
      nit,
      igss_afiliacion,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      fecha_nacimiento,
      genero,
      estado_civil,
      direccion_residencia,
      telefono_personal,
      correo_institucional,
      renglon_codigo,
      puesto_funcional,
      puesto_nominal,
      unidad_admin,
      numero_acuerdo_contrato,
      salario_honorarios,
      fecha_inicio,
      fecha_fin,
    } = req.body;

    if (!cui_dpi || (cui_dpi.length !== 13 && cui_dpi.length !== 36 && cui_dpi.length < 8)) {
      return res.status(400).json({ success: false, message: "El CUI / DPI debe contener 13 dígitos numéricos o un identificador válido" });
    }

    if (!primer_nombre || !primer_apellido) {
      return res.status(400).json({ success: false, message: "El primer nombre y primer apellido son obligatorios" });
    }

    const foto_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(primer_nombre + "+" + primer_apellido)}&background=0B2545&color=fff`;

    // 1. Insertar persona en db_core_humanis
    const insertPersonaSql = `
      INSERT INTO personas (
        cui_dpi, nit, igss_afiliacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        fecha_nacimiento, genero, estado_civil, direccion_residencia, telefono_personal, correo_institucional, foto_url, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
      RETURNING *
    `;

    const personaRes = await db.query(insertPersonaSql, [
      cui_dpi,
      nit || null,
      igss_afiliacion || null,
      primer_nombre,
      segundo_nombre || null,
      primer_apellido,
      segundo_apellido || null,
      fecha_nacimiento || null,
      genero || "NO_ESPECIFICADO",
      estado_civil || "SOLTERO/A",
      direccion_residencia || null,
      telefono_personal || null,
      correo_institucional || null,
      foto_url,
    ]);

    const nuevaPersona = personaRes.rows[0];

    // 2. Asociar IDs de catálogos para la relación laboral
    let renglonId = null;
    if (renglon_codigo) {
      const rRes = await db.query("SELECT id FROM renglones_presupuestarios WHERE codigo = $1 LIMIT 1", [renglon_codigo]);
      if (rRes.rows.length > 0) renglonId = rRes.rows[0].id;
    }
    if (!renglonId) {
      const rRes = await db.query("SELECT id FROM renglones_presupuestarios WHERE codigo = '011' LIMIT 1");
      if (rRes.rows.length > 0) renglonId = rRes.rows[0].id;
    }

    let unidadId = null;
    if (unidad_admin) {
      const uRes = await db.query("SELECT id FROM unidades_administrativas WHERE nombre ILIKE $1 OR codigo ILIKE $1 LIMIT 1", [`%${unidad_admin}%`]);
      if (uRes.rows.length > 0) unidadId = uRes.rows[0].id;
    }

    let puestoNomId = null;
    if (puesto_nominal) {
      const pnRes = await db.query("SELECT id FROM puestos_nominales WHERE nombre ILIKE $1 OR codigo ILIKE $1 LIMIT 1", [`%${puesto_nominal}%`]);
      if (pnRes.rows.length > 0) puestoNomId = pnRes.rows[0].id;
    }

    let puestoFuncId = null;
    if (puesto_funcional) {
      const pfRes = await db.query("SELECT id FROM puestos_funcionales WHERE nombre ILIKE $1 OR codigo ILIKE $1 LIMIT 1", [`%${puesto_funcional}%`]);
      if (pfRes.rows.length > 0) puestoFuncId = pfRes.rows[0].id;
    }

    // 3. Insertar relación laboral inicial
    const insertContratoSql = `
      INSERT INTO relaciones_laborales (
        persona_id, renglon_id, puesto_nominal_id, puesto_funcional_id, unidad_admin_id,
        numero_acuerdo_contrato, partida_presupuestaria, fecha_inicio, fecha_fin, salario_honorarios, estado, es_contrato_actual
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVO', true)
      RETURNING *
    `;

    const contratoRes = await db.query(insertContratoSql, [
      nuevaPersona.id,
      renglonId,
      puestoNomId,
      puestoFuncId,
      unidadId,
      numero_acuerdo_contrato || `SCSPR-${renglon_codigo || "011"}-${new Date().getFullYear()}`,
      `11130005-101-00-0101-0001-${renglon_codigo || "011"}`,
      fecha_inicio || new Date().toISOString().split("T")[0],
      fecha_fin || null,
      Number(salario_honorarios || 12000),
    ]);

    await registrarAuditoria({
      usuarioUsername: req.user?.username || req.user?.email || "sistema",
      accion: "CREATE",
      tablaAfectada: "personas",
      registroId: nuevaPersona.id,
      valoresNuevos: { cui_dpi, primer_nombre, primer_apellido, renglon_codigo },
      detalles: `Alta de nuevo colaborador ${primer_nombre} ${primer_apellido} (${cui_dpi}) en base de datos PostgreSQL`,
    });

    const resourceLocation = `/api/v1/core-humanis/collaborators/${nuevaPersona.id}`;
    res.location(resourceLocation);
    res.status(201).json({
      success: true,
      message: "Colaborador registrado exitosamente en Core Humanis",
      data: {
        ...nuevaPersona,
        contrato_actual: contratoRes.rows[0],
        _links: buildCollaboratorLinks(nuevaPersona),
      },
    });
  } catch (error) {
    console.error("Error al crear colaborador:", error);
    res.status(500).json({ success: false, message: "Error interno al crear colaborador en la base de datos: " + error.message });
  }
};

// Actualizar datos del colaborador (PostgreSQL Directo)
exports.actualizarColaborador = async (req, res) => {
  try {
    const { id } = req.params;

    const findRes = await db.query("SELECT * FROM personas WHERE id::text = $1 OR cui_dpi = $1", [id]);
    if (!findRes.rows || findRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }
    const prev = findRes.rows[0];

    const fields = [
      "primer_nombre", "segundo_nombre", "primer_apellido", "segundo_apellido",
      "nit", "igss_afiliacion", "fecha_nacimiento", "genero", "estado_civil",
      "direccion_residencia", "departamento", "municipio", "telefono_personal",
      "correo_personal", "correo_institucional", "foto_url"
    ];

    let updateClauses = [];
    let params = [];
    let pIdx = 1;

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updateClauses.push(`${f} = $${pIdx}`);
        params.push(req.body[f]);
        pIdx++;
      }
    });

    if (updateClauses.length > 0) {
      updateClauses.push("updated_at = CURRENT_TIMESTAMP");
      params.push(prev.id);
      const updateSql = `UPDATE personas SET ${updateClauses.join(", ")} WHERE id = $${pIdx} RETURNING *`;
      await db.query(updateSql, params);
    }

    // Actualizar contrato si se proporcionaron campos contractuales
    if (req.body.salario_honorarios !== undefined || req.body.numero_acuerdo_contrato !== undefined) {
      const cUpdates = [];
      const cParams = [];
      let cIdx = 1;
      if (req.body.salario_honorarios !== undefined) {
        cUpdates.push(`salario_honorarios = $${cIdx++}`);
        cParams.push(Number(req.body.salario_honorarios));
      }
      if (req.body.numero_acuerdo_contrato !== undefined) {
        cUpdates.push(`numero_acuerdo_contrato = $${cIdx++}`);
        cParams.push(req.body.numero_acuerdo_contrato);
      }
      if (cUpdates.length > 0) {
        cUpdates.push("updated_at = CURRENT_TIMESTAMP");
        cParams.push(prev.id);
        await db.query(`UPDATE relaciones_laborales SET ${cUpdates.join(", ")} WHERE persona_id = $${cIdx} AND es_contrato_actual = true`, cParams);
      }
    }

    await registrarAuditoria({
      usuarioUsername: req.user?.username || req.user?.email || "sistema",
      accion: "UPDATE",
      tablaAfectada: "personas",
      registroId: prev.id,
      valoresAnteriores: prev,
      valoresNuevos: req.body,
      detalles: `Actualización de datos para expediente ${prev.primer_nombre} ${prev.primer_apellido}`,
    });

    res.json({
      success: true,
      message: "Expediente actualizado correctamente en la base de datos",
      data: {
        id: prev.id,
        ...req.body,
        _links: buildCollaboratorLinks({ id: prev.id, ...req.body }),
      },
    });
  } catch (error) {
    console.error("Error al actualizar expediente:", error);
    res.status(500).json({ success: false, message: "Error al actualizar expediente en la base de datos" });
  }
};

// ===========================================================================
// SUB-RECURSO: FORMACIÓN Y COLEGIACIÓN PROFESIONAL (ESTUDIOS ACADÉMICOS)
// ===========================================================================

exports.getEstudiosByColaboradorId = async (req, res) => {
  try {
    const { id } = req.params;
    const q = `
      SELECT 
        id, persona_id, nivel_academico, titulo_obtenido, institucion,
        campo_estudio, fecha_inicio, fecha_graduacion, en_curso, notas,
        numero_colegiado, colegio_profesional, vigencia_colegiado, estado_colegiado,
        created_at
      FROM estudios_academicos
      WHERE persona_id::text = $1
      ORDER BY COALESCE(fecha_graduacion, fecha_inicio, created_at) DESC
    `;
    const result = await db.query(q, [id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error al obtener formación académica:", error);
    res.status(500).json({ success: false, message: "Error al obtener formación académica" });
  }
};

exports.crearEstudio = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nivel_academico,
      titulo_obtenido,
      institucion,
      campo_estudio,
      fecha_inicio,
      fecha_graduacion,
      en_curso,
      notas,
      numero_colegiado,
      colegio_profesional,
      vigencia_colegiado,
      estado_colegiado,
    } = req.body;

    if (!titulo_obtenido && !numero_colegiado) {
      return res.status(400).json({
        success: false,
        message: "El título obtenido o número de colegiado es obligatorio",
      });
    }

    const personaCheck = await db.query("SELECT id FROM personas WHERE id::text = $1", [id]);
    if (!personaCheck.rows || personaCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }

    const q = `
      INSERT INTO estudios_academicos (
        persona_id, nivel_academico, titulo_obtenido, institucion,
        campo_estudio, fecha_inicio, fecha_graduacion, en_curso, notas,
        numero_colegiado, colegio_profesional, vigencia_colegiado, estado_colegiado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      id,
      nivel_academico || (numero_colegiado ? "COLEGIACION_PROFESIONAL" : "LICENCIATURA"),
      titulo_obtenido || (numero_colegiado ? `Colegiado Activo (${colegio_profesional || 'Colegio Profesional'})` : "Formación Profesional"),
      institucion || null,
      campo_estudio || null,
      fecha_inicio || null,
      fecha_graduacion || null,
      en_curso === true || en_curso === "true",
      notas || null,
      numero_colegiado || null,
      colegio_profesional || null,
      vigencia_colegiado || null,
      estado_colegiado || (numero_colegiado ? "ACTIVO" : null),
    ];

    const result = await db.query(q, values);
    const nuevo = result.rows[0];

    await registrarAuditoria({
      usuarioUsername: req.user?.username || req.user?.email || "sistema",
      accion: "CREATE",
      tablaAfectada: "estudios_academicos",
      registroId: nuevo.id,
      valoresNuevos: nuevo,
      detalles: `Registro de estudio/colegiatura: ${nuevo.titulo_obtenido}`,
    });

    res.status(201).json({
      success: true,
      message: "Registro académico guardado exitosamente",
      data: nuevo,
    });
  } catch (error) {
    console.error("Error al registrar formación académica:", error);
    res.status(500).json({ success: false, message: "Error al registrar formación académica en la base de datos" });
  }
};

exports.actualizarEstudio = async (req, res) => {
  try {
    const { id, estudioId } = req.params;
    const {
      nivel_academico,
      titulo_obtenido,
      institucion,
      campo_estudio,
      fecha_inicio,
      fecha_graduacion,
      en_curso,
      notas,
      numero_colegiado,
      colegio_profesional,
      vigencia_colegiado,
      estado_colegiado,
    } = req.body;

    const prevRes = await db.query(
      "SELECT * FROM estudios_academicos WHERE id = $1 AND persona_id = $2",
      [estudioId, id]
    );
    if (!prevRes.rows || prevRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Registro no encontrado" });
    }
    const prev = prevRes.rows[0];

    const q = `
      UPDATE estudios_academicos SET
        nivel_academico = COALESCE($1, nivel_academico),
        titulo_obtenido = COALESCE($2, titulo_obtenido),
        institucion = COALESCE($3, institucion),
        campo_estudio = COALESCE($4, campo_estudio),
        fecha_inicio = $5,
        fecha_graduacion = $6,
        en_curso = $7,
        notas = $8,
        numero_colegiado = $9,
        colegio_profesional = $10,
        vigencia_colegiado = $11,
        estado_colegiado = COALESCE($12, estado_colegiado)
      WHERE id = $13 AND persona_id = $14
      RETURNING *
    `;

    const values = [
      nivel_academico !== undefined ? nivel_academico : prev.nivel_academico,
      titulo_obtenido !== undefined ? titulo_obtenido : prev.titulo_obtenido,
      institucion !== undefined ? institucion : prev.institucion,
      campo_estudio !== undefined ? campo_estudio : prev.campo_estudio,
      fecha_inicio !== undefined ? (fecha_inicio || null) : prev.fecha_inicio,
      fecha_graduacion !== undefined ? (fecha_graduacion || null) : prev.fecha_graduacion,
      en_curso !== undefined ? (en_curso === true || en_curso === "true") : prev.en_curso,
      notas !== undefined ? (notas || null) : prev.notas,
      numero_colegiado !== undefined ? (numero_colegiado || null) : prev.numero_colegiado,
      colegio_profesional !== undefined ? (colegio_profesional || null) : prev.colegio_profesional,
      vigencia_colegiado !== undefined ? (vigencia_colegiado || null) : prev.vigencia_colegiado,
      estado_colegiado !== undefined ? estado_colegiado : prev.estado_colegiado,
      estudioId,
      id,
    ];

    const result = await db.query(q, values);
    const actualizado = result.rows[0];

    await registrarAuditoria({
      usuarioUsername: req.user?.username || req.user?.email || "sistema",
      accion: "UPDATE",
      tablaAfectada: "estudios_academicos",
      registroId: estudioId,
      valoresAnteriores: prev,
      valoresNuevos: actualizado,
      detalles: `Actualización de formación académica: ${actualizado.titulo_obtenido}`,
    });

    res.json({
      success: true,
      message: "Registro académico actualizado correctamente",
      data: actualizado,
    });
  } catch (error) {
    console.error("Error al actualizar formación académica:", error);
    res.status(500).json({ success: false, message: "Error al actualizar formación académica" });
  }
};

exports.eliminarEstudio = async (req, res) => {
  try {
    const { id, estudioId } = req.params;
    const prevRes = await db.query(
      "SELECT * FROM estudios_academicos WHERE id = $1 AND persona_id = $2",
      [estudioId, id]
    );
    if (!prevRes.rows || prevRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Registro no encontrado" });
    }
    const prev = prevRes.rows[0];

    await db.query("DELETE FROM estudios_academicos WHERE id = $1 AND persona_id = $2", [estudioId, id]);

    await registrarAuditoria({
      usuarioUsername: req.user?.username || req.user?.email || "sistema",
      accion: "DELETE",
      tablaAfectada: "estudios_academicos",
      registroId: estudioId,
      valoresAnteriores: prev,
      detalles: `Eliminación de estudio/colegiatura: ${prev.titulo_obtenido}`,
    });

    res.json({
      success: true,
      message: "Registro académico eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar registro académico:", error);
    res.status(500).json({ success: false, message: "Error al eliminar registro académico" });
  }
};
