const db = require("../config/db-core-humanis");
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

// Generar nueva constancia oficial con código QR (POST /certificates) - PostgreSQL Directo
exports.generarConstancia = async (req, res) => {
  try {
    const { persona_id, dirigido_a, incluye_salario } = req.body;

    const personaRes = await db.query(`
      SELECT 
        p.*,
        rl.id AS contrato_id,
        rl.numero_acuerdo_contrato,
        rl.partida_presupuestaria,
        rl.fecha_inicio,
        rl.fecha_fin,
        rl.salario_honorarios,
        rp.codigo AS renglon_codigo,
        rp.nombre AS renglon_nombre,
        pf.nombre AS puesto_funcional,
        pn.nombre AS puesto_nominal,
        ua.nombre AS unidad_admin
      FROM personas p
      LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
      LEFT JOIN renglones_presupuestarios rp ON rl.renglon_id = rp.id
      LEFT JOIN puestos_funcionales pf ON rl.puesto_funcional_id = pf.id
      LEFT JOIN puestos_nominales pn ON rl.puesto_nominal_id = pn.id
      LEFT JOIN unidades_administrativas ua ON rl.unidad_admin_id = ua.id
      WHERE p.id::text = $1 OR p.cui_dpi = $1
      LIMIT 1
    `, [persona_id]);

    if (!personaRes.rows || personaRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Colaborador no encontrado" });
    }

    const colaborador = personaRes.rows[0];
    if (!colaborador.contrato_id) {
      return res.status(400).json({ success: false, message: "El colaborador no posee contrato activo vigente" });
    }

    const contrato = {
      id: colaborador.contrato_id,
      renglon_codigo: colaborador.renglon_codigo,
      renglon_nombre: colaborador.renglon_nombre,
      puesto_funcional: colaborador.puesto_funcional,
      puesto_nominal: colaborador.puesto_nominal,
      unidad_admin: colaborador.unidad_admin,
      numero_acuerdo_contrato: colaborador.numero_acuerdo_contrato,
      partida_presupuestaria: colaborador.partida_presupuestaria,
      fecha_inicio: colaborador.fecha_inicio,
      fecha_fin: colaborador.fecha_fin,
      salario_honorarios: Number(colaborador.salario_honorarios || 0),
      estado: "ACTIVO",
    };

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

    const tipoConstancia = ["011", "021", "022"].includes(contrato.renglon_codigo) ? "LABORAL" : "SERVICIOS";

    const insertSql = `
      INSERT INTO constancias_emitidas (
        correlativo, persona_id, relacion_laboral_id, tipo_constancia,
        dirigido_a, incluye_salario, hash_verificacion, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VALIDA')
      RETURNING *
    `;

    const constanciaRes = await db.query(insertSql, [
      correlativo,
      colaborador.id,
      contrato.id,
      tipoConstancia,
      dirigido_a || "A QUIEN INTERESE",
      incluye_salario !== false,
      hash,
    ]);

    const nuevaConstancia = constanciaRes.rows[0];

    const constancia = {
      id: nuevaConstancia.id,
      correlativo,
      persona_id: colaborador.id,
      colaborador_nombre: `${colaborador.primer_nombre} ${colaborador.primer_apellido}`,
      cui_dpi: colaborador.cui_dpi,
      renglon: contrato.renglon_codigo,
      tipo_constancia: tipoConstancia,
      dirigido_a: dirigido_a || "A QUIEN INTERESE",
      incluye_salario: incluye_salario !== false,
      hash_verificacion: hash,
      qr_code: qrCodeDataUrl,
      texto_legal: textoLegal,
      fecha_emision: nuevaConstancia.created_at,
      emitido_por: req.user?.nombres || req.user?.email || "Dirección de Recursos Humanos SCSPR",
      estado: "VALIDA",
    };

    await registrarAuditoria({
      usuarioUsername: req.user?.username || req.user?.email || "sistema",
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
    console.error("Error al generar constancia en PostgreSQL:", error);
    res.status(500).json({ success: false, message: "Error interno al generar constancia en la base de datos" });
  }
};

// Listado de constancias emitidas (GET /certificates) - PostgreSQL Directo
exports.getConstancias = async (req, res) => {
  try {
    const { persona_id } = req.query;

    let sql = `
      SELECT 
        ce.id,
        ce.correlativo,
        ce.persona_id,
        ce.tipo_constancia,
        ce.dirigido_a,
        ce.incluye_salario,
        ce.hash_verificacion,
        ce.estado,
        ce.created_at AS fecha_emision,
        p.primer_nombre || ' ' || p.primer_apellido AS colaborador_nombre,
        p.cui_dpi,
        rp.codigo AS renglon
      FROM constancias_emitidas ce
      JOIN personas p ON ce.persona_id = p.id
      LEFT JOIN relaciones_laborales rl ON ce.relacion_laboral_id = rl.id
      LEFT JOIN renglones_presupuestarios rp ON rl.renglon_id = rp.id
      WHERE 1=1
    `;
    const params = [];

    if (persona_id) {
      sql += ` AND (ce.persona_id::text = $1 OR p.cui_dpi = $1)`;
      params.push(persona_id);
    }

    sql += ` ORDER BY ce.created_at DESC`;

    const result = await db.query(sql, params);
    const items = (result.rows || []).map((c) => ({
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
    console.error("Error al consultar constancias en PostgreSQL:", error);
    res.status(500).json({ success: false, message: "Error al consultar constancias" });
  }
};

// Detalle de constancia por ID (GET /certificates/:id) - PostgreSQL Directo
exports.getConstanciaById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        ce.*,
        p.primer_nombre || ' ' || p.primer_apellido AS colaborador_nombre,
        p.cui_dpi,
        rp.codigo AS renglon
      FROM constancias_emitidas ce
      JOIN personas p ON ce.persona_id = p.id
      LEFT JOIN relaciones_laborales rl ON ce.relacion_laboral_id = rl.id
      LEFT JOIN renglones_presupuestarios rp ON rl.renglon_id = rp.id
      WHERE ce.id::text = $1 OR ce.correlativo = $1
      LIMIT 1
    `;
    const result = await db.query(sql, [id]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Constancia no encontrada" });
    }

    const constancia = result.rows[0];

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
    console.error("Error al consultar constancia:", error);
    res.status(500).json({ success: false, message: "Error al consultar constancia" });
  }
};

// Verificación pública vía QR (Acceso Libre) (GET /certificates/verifications/:hash) - PostgreSQL Directo
exports.verificarConstancia = async (req, res) => {
  try {
    const { hash } = req.params;

    const sql = `
      SELECT 
        ce.correlativo,
        ce.tipo_constancia,
        ce.created_at AS fecha_emision,
        ce.estado,
        p.primer_nombre || ' ' || p.primer_apellido AS colaborador_nombre,
        p.cui_dpi
      FROM constancias_emitidas ce
      JOIN personas p ON ce.persona_id = p.id
      WHERE ce.hash_verificacion = $1
      LIMIT 1
    `;
    const result = await db.query(sql, [hash]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        valido: false,
        message: "El código o documento no es auténtico o no se encuentra registrado en el sistema institucional de la SCSPR.",
      });
    }

    const constancia = result.rows[0];
    const cuiMasked = constancia.cui_dpi
      ? constancia.cui_dpi.replace(/(\d{4})\d{5}(\d{4})/, "$1*****$2")
      : "1000*****0101";

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
        emitido_por: "Dirección de Recursos Humanos SCSPR",
        estado: constancia.estado || "VALIDA",
        institucion: "Secretaría de Comunicación Social de la Presidencia de la República (SCSPR)",
      },
      _links: buildVerificationLinks(hash),
    });
  } catch (error) {
    console.error("Error al verificar constancia:", error);
    res.status(500).json({ success: false, message: "Error al verificar constancia" });
  }
};
