const crypto = require("crypto");
const db = require("../config/db-core-humanis");
const { mockData } = require("../config/mock-store");
const { registrarAuditoria } = require("./audit.service");

/**
 * Servicio para gestión del Buzón de Denuncias Éticas y Laborales (SCSPR)
 */

exports.createComplaint = async (data, clientIp = "127.0.0.1", userAgent = "Mozilla") => {
  const anio = new Date().getFullYear();
  let correlativo = "";
  let codigoSeguimiento = "";

  // 1. Generar correlativo institucional y código seguro de seguimiento SHA-256
  try {
    const countRes = await db.query(
      `SELECT COUNT(*) as total FROM denuncias_buzon WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [anio]
    );
    const count = parseInt(countRes.rows[0]?.total || 0, 10) + 1;
    correlativo = `DEN-SCSPR-${anio}-${String(count).padStart(4, "0")}`;
  } catch (err) {
    const count = (mockData.denuncias?.length || 0) + 1;
    correlativo = `DEN-SCSPR-${anio}-${String(count).padStart(4, "0")}`;
  }

  // Código SHA-256 confidencial único para consulta sin token
  codigoSeguimiento = crypto
    .createHash("sha256")
    .update(`${correlativo}-${Date.now()}-${Math.random().toString(36).substring(2)}`)
    .digest("hex");

  const esAnonima = data.es_anonima !== false;

  const complaintRecord = {
    id: crypto.randomUUID(),
    correlativo,
    tipo_denuncia: data.tipo_denuncia || "FALTA_ETICA",
    prioridad: data.prioridad || "MEDIA",
    es_anonima: esAnonima,
    denunciante_nombre: esAnonima ? null : (data.denunciante_nombre || null),
    denunciante_correo: esAnonima ? null : (data.denunciante_correo || null),
    denunciante_telefono: esAnonima ? null : (data.denunciante_telefono || null),
    denunciante_unidad: data.denunciante_unidad || null,
    persona_denunciada: data.persona_denunciada || null,
    cargo_denunciado: data.cargo_denunciado || null,
    dependencia_denunciada: data.dependencia_denunciada || null,
    fecha_incidente: data.fecha_incidente || new Date().toISOString().split("T")[0],
    lugar_incidente: data.lugar_incidente || null,
    descripcion: data.descripcion || "",
    pruebas_descripcion: data.pruebas_descripcion || null,
    codigo_seguimiento: codigoSeguimiento,
    estado: "RECIBIDA",
    resolucion_nota: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 2. Persistir en PostgreSQL con fallback en memoria
  try {
    const query = `
      INSERT INTO denuncias_buzon (
        id, correlativo, tipo_denuncia, prioridad, es_anonima,
        denunciante_nombre, denunciante_correo, denunciante_telefono, denunciante_unidad,
        persona_denunciada, cargo_denunciado, dependencia_denunciada,
        fecha_incidente, lugar_incidente, descripcion, pruebas_descripcion,
        codigo_seguimiento, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *;
    `;
    const values = [
      complaintRecord.id,
      complaintRecord.correlativo,
      complaintRecord.tipo_denuncia,
      complaintRecord.prioridad,
      complaintRecord.es_anonima,
      complaintRecord.denunciante_nombre,
      complaintRecord.denunciante_correo,
      complaintRecord.denunciante_telefono,
      complaintRecord.denunciante_unidad,
      complaintRecord.persona_denunciada,
      complaintRecord.cargo_denunciado,
      complaintRecord.dependencia_denunciada,
      complaintRecord.fecha_incidente,
      complaintRecord.lugar_incidente,
      complaintRecord.descripcion,
      complaintRecord.pruebas_descripcion,
      complaintRecord.codigo_seguimiento,
      complaintRecord.estado,
    ];
    const insertRes = await db.query(query, values);
    if (insertRes.rows.length > 0) {
      Object.assign(complaintRecord, insertRes.rows[0]);
    }
  } catch (dbErr) {
    // Mantener en mockData.denuncias
    if (!mockData.denuncias) mockData.denuncias = [];
    mockData.denuncias.unshift(complaintRecord);
  }

  // Sincronizar en mockData siempre para resiliencia
  if (mockData.denuncias && !mockData.denuncias.some((d) => d.correlativo === correlativo)) {
    mockData.denuncias.unshift(complaintRecord);
  }

  // 3. Registrar auditoría inmutable
  try {
    await registrarAuditoria({
      usuario_id: null, // Anónima o no asociada a usuario autenticado
      accion: "REGISTRO_DENUNCIA",
      tabla_afectada: "denuncias_buzon",
      registro_id: complaintRecord.id,
      detalles: `Registro de denuncia correlativo ${correlativo} (Anonima: ${esAnonima})`,
      ip_address: clientIp,
      user_agent: userAgent,
    });
  } catch (e) {}

  return complaintRecord;
};

exports.getComplaints = async (filters = {}) => {
  const { estado, tipo, prioridad, search, page = 1, limit = 10 } = filters;

  try {
    let whereClauses = [];
    let params = [];
    let idx = 1;

    if (estado && estado !== "ALL") {
      whereClauses.push(`estado = $${idx++}`);
      params.push(estado);
    }
    if (tipo && tipo !== "ALL") {
      whereClauses.push(`tipo_denuncia = $${idx++}`);
      params.push(tipo);
    }
    if (prioridad && prioridad !== "ALL") {
      whereClauses.push(`prioridad = $${idx++}`);
      params.push(prioridad);
    }
    if (search) {
      whereClauses.push(`(correlativo ILIKE $${idx} OR descripcion ILIKE $${idx} OR persona_denunciada ILIKE $${idx} OR denunciante_unidad ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const countRes = await db.query(`SELECT COUNT(*) as total FROM denuncias_buzon ${whereSql}`, params);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const offset = (page - 1) * limit;
    const listRes = await db.query(
      `SELECT * FROM denuncias_buzon ${whereSql} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return {
      items: listRes.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch (err) {
    // Fallback con mockData
    let items = [...(mockData.denuncias || [])];
    if (estado && estado !== "ALL") items = items.filter((d) => d.estado === estado);
    if (tipo && tipo !== "ALL") items = items.filter((d) => d.tipo_denuncia === tipo);
    if (prioridad && prioridad !== "ALL") items = items.filter((d) => d.prioridad === prioridad);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (d) =>
          d.correlativo.toLowerCase().includes(q) ||
          (d.descripcion || "").toLowerCase().includes(q) ||
          (d.persona_denunciada || "").toLowerCase().includes(q)
      );
    }

    const total = items.length;
    const offset = (page - 1) * limit;
    const paginated = items.slice(offset, offset + limit);

    return {
      items: paginated,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
};

exports.getComplaintById = async (id) => {
  try {
    const res = await db.query(`SELECT * FROM denuncias_buzon WHERE id = $1`, [id]);
    if (res.rows.length > 0) return res.rows[0];
  } catch (e) {}

  return (mockData.denuncias || []).find((d) => d.id === id) || null;
};

exports.trackComplaint = async (trackingCode) => {
  let complaint = null;
  try {
    const res = await db.query(
      `SELECT id, correlativo, tipo_denuncia, prioridad, es_anonima, dependencia_denunciada, fecha_incidente, estado, resolucion_nota, created_at, updated_at FROM denuncias_buzon WHERE codigo_seguimiento = $1`,
      [trackingCode]
    );
    if (res.rows.length > 0) complaint = res.rows[0];
  } catch (e) {}

  if (!complaint) {
    const found = (mockData.denuncias || []).find((d) => d.codigo_seguimiento === trackingCode);
    if (found) {
      complaint = {
        id: found.id,
        correlativo: found.correlativo,
        tipo_denuncia: found.tipo_denuncia,
        prioridad: found.prioridad,
        es_anonima: found.es_anonima,
        dependencia_denunciada: found.dependencia_denunciada,
        fecha_incidente: found.fecha_incidente,
        estado: found.estado,
        resolucion_nota: found.resolucion_nota,
        created_at: found.created_at,
        updated_at: found.updated_at,
      };
    }
  }

  return complaint;
};

exports.updateComplaintStatus = async (id, { estado, resolucion_nota, usuario_id }, clientIp = "127.0.0.1") => {
  let updated = null;
  const fechaResolucion = ["RESUELTA", "DESESTIMADA"].includes(estado) ? new Date().toISOString() : null;

  try {
    const query = `
      UPDATE denuncias_buzon 
      SET estado = $1, resolucion_nota = $2, atendido_por = $3, fecha_resolucion = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;
    const res = await db.query(query, [estado, resolucion_nota, usuario_id, fechaResolucion, id]);
    if (res.rows.length > 0) {
      updated = res.rows[0];
    }
  } catch (e) {}

  if (!updated && mockData.denuncias) {
    const idx = mockData.denuncias.findIndex((d) => d.id === id);
    if (idx !== -1) {
      mockData.denuncias[idx].estado = estado;
      mockData.denuncias[idx].resolucion_nota = resolucion_nota;
      mockData.denuncias[idx].updated_at = new Date().toISOString();
      if (fechaResolucion) mockData.denuncias[idx].fecha_resolucion = fechaResolucion;
      updated = mockData.denuncias[idx];
    }
  }

  // Registrar auditoría
  if (updated) {
    try {
      await registrarAuditoria({
        usuario_id,
        accion: "ACTUALIZACION_ESTADO_DENUNCIA",
        tabla_afectada: "denuncias_buzon",
        registro_id: id,
        detalles: `Cambio de estado a ${estado}. Resolución: ${resolucion_nota || "Sin nota"}`,
        ip_address: clientIp,
      });
    } catch (e) {}
  }

  return updated;
};
