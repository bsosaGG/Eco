const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db-core-humanis");
const { mockData } = require("../config/mock-store");
const { buildAuthLinks } = require("../utils/hateoas.helper");
const { registrarAuditoria } = require("../services/audit.service");

const JWT_SECRET = process.env.JWT_SECRET || "scspr-secret-jwt-key-2026";

const USERS_DEV = [
  {
    id: "22222222-2222-2222-2222-222222222201",
    username: "jefa.rrhh",
    email: "rrhh@scspr.gob.gt",
    role: "JEFA_RRHH",
    rol_nombre: "Jefa de Recursos Humanos",
    nombres: "Licda. María Elena Morales Paz",
    telefono_personal: "5555-1001",
    correo_personal: "maria.morales@gmail.com",
    direccion_residencia: "Zona 14, Ciudad de Guatemala",
    departamento: "Guatemala",
    municipio: "Guatemala",
    contacto_emergencia: "Lic. Roberto Morales (Hermano - 5555-9090)",
    puesto_funcional: "Jefa de la Unidad de Recursos Humanos",
    permissions: ["core-humanis:read", "core-humanis:write", "core-humanis:constancias", "core-humanis:admin"],
  },
  {
    id: "22222222-2222-2222-2222-222222222202",
    username: "analista.rrhh",
    email: "analista@scspr.gob.gt",
    role: "ANALISTA_RRHH",
    rol_nombre: "Analista de Recursos Humanos",
    nombres: "Lic. Juan Pablo Gómez",
    telefono_personal: "5555-1002",
    correo_personal: "juan.gomez@gmail.com",
    direccion_residencia: "Zona 7, Ciudad de Guatemala",
    departamento: "Guatemala",
    municipio: "Guatemala",
    contacto_emergencia: "Ana Gómez (Esposa - 5555-8080)",
    puesto_funcional: "Analista de Expedientes y Nombramientos",
    permissions: ["core-humanis:read", "core-humanis:write", "core-humanis:constancias"],
  },
  {
    id: "22222222-2222-2222-2222-222222222203",
    username: "auditor.cgc",
    email: "auditor@cgc.gob.gt",
    role: "AUDITOR",
    rol_nombre: "Auditor Interno / Fiscalizador CGC",
    nombres: "Lic. Fernando Ruiz",
    telefono_personal: "5555-1003",
    correo_personal: "fernando.ruiz@cgc.gob.gt",
    direccion_residencia: "Zona 1, Ciudad de Guatemala",
    departamento: "Guatemala",
    municipio: "Guatemala",
    contacto_emergencia: "Luisa Ruiz (Hija - 5555-7070)",
    puesto_funcional: "Delegado Fiscalizador de la CGC",
    permissions: ["core-humanis:read"],
  },
  {
    id: "22222222-2222-2222-2222-222222222204",
    username: "admin.ti",
    email: "informatica@scspr.gob.gt",
    role: "ADMIN_TI",
    rol_nombre: "Administrador de Informática",
    nombres: "Ing. Marvin Castillo",
    telefono_personal: "5555-1004",
    correo_personal: "marvin.castillo@gmail.com",
    direccion_residencia: "Zona 11, Ciudad de Guatemala",
    departamento: "Guatemala",
    municipio: "Guatemala",
    contacto_emergencia: "Carlos Castillo (Padre - 5555-6060)",
    puesto_funcional: "Jefe de la Unidad de Informática y Tecnología",
    permissions: ["core-humanis:read", "core-humanis:write", "core-humanis:constancias", "core-humanis:admin"],
  },
  {
    id: "510523ce-a019-51d3-b8c9-c6b5b1696471",
    username: "colaborador.011",
    email: "karina.garcia@scspr.gob.gt",
    role: "COLABORADOR",
    rol_nombre: "Colaborador SCSPR (Personal)",
    nombres: "Karina Judith García Ruano",
    cui_dpi: "550e8400-e29b-41d4-a716-446655440000",
    telefono_personal: "5551-0101",
    correo_personal: "karina.garcia@gmail.com",
    direccion_residencia: "Zona 10, Ciudad de Guatemala",
    departamento: "Guatemala",
    municipio: "Guatemala",
    contacto_emergencia: "Lic. Carlos García (Esposo - 5555-1234)",
    puesto_funcional: "Secretaria de Comunicación Social de la Presidencia",
    permissions: ["core-humanis:portal", "core-humanis:read-self"],
  },
];

// Generar sesión / token JWT (POST /auth/tokens)
exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = USERS_DEV.find((u) => u.username === username) || USERS_DEV[0];

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      nombres: user.nombres,
      permissions: user.permissions,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    success: true,
    message: "Autenticación institucional exitosa",
    token,
    user: {
      ...user,
      _links: buildAuthLinks(user),
    },
    _links: buildAuthLinks(user),
  });
};

// Perfil actual del usuario autenticado (GET /auth/me)
exports.me = async (req, res) => {
  const currentUser = req.user ? (USERS_DEV.find((u) => u.id === req.user.id || u.username === req.user.username) || req.user) : USERS_DEV[0];
  res.json({
    success: true,
    user: {
      ...currentUser,
      _links: buildAuthLinks(currentUser),
    },
    _links: buildAuthLinks(currentUser),
  });
};

// Actualizar perfil del usuario autenticado (PUT /auth/me)
exports.updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const userIdx = USERS_DEV.findIndex((u) => u.id === currentUserId || u.username === req.user?.username);
    const targetUser = userIdx !== -1 ? USERS_DEV[userIdx] : USERS_DEV[0];

    const {
      nombres,
      apellidos,
      email,
      telefono_personal,
      correo_personal,
      direccion_residencia,
      departamento,
      municipio,
      contacto_emergencia,
      foto_url,
    } = req.body;

    if (nombres) targetUser.nombres = nombres.trim();
    if (apellidos) targetUser.apellidos = apellidos.trim();
    if (email) targetUser.email = email.trim();
    if (telefono_personal !== undefined) targetUser.telefono_personal = telefono_personal;
    if (correo_personal !== undefined) targetUser.correo_personal = correo_personal;
    if (direccion_residencia !== undefined) targetUser.direccion_residencia = direccion_residencia;
    if (departamento !== undefined) targetUser.departamento = departamento;
    if (municipio !== undefined) targetUser.municipio = municipio;
    if (contacto_emergencia !== undefined) targetUser.contacto_emergencia = contacto_emergencia;
    if (foto_url !== undefined) targetUser.foto_url = foto_url;

    // Actualizar en mockData.personas si coincide
    const matchedPersona = (mockData.personas || []).find(
      (p) => p.correo_institucional === targetUser.email || p.id === targetUser.id
    );
    if (matchedPersona) {
      if (telefono_personal !== undefined) matchedPersona.telefono_personal = telefono_personal;
      if (correo_personal !== undefined) matchedPersona.correo_personal = correo_personal;
      if (direccion_residencia !== undefined) matchedPersona.direccion_residencia = direccion_residencia;
      if (departamento !== undefined) matchedPersona.departamento = departamento;
      if (municipio !== undefined) matchedPersona.municipio = municipio;
    }

    // Persistir en PostgreSQL si está disponible
    try {
      if (targetUser.id) {
        await db.query(
          `UPDATE usuarios SET nombres = COALESCE($1, nombres), email = COALESCE($2, email) WHERE id = $3`,
          [targetUser.nombres, targetUser.email, targetUser.id]
        );
        await db.query(
          `UPDATE personas SET telefono_personal = $1, correo_personal = $2, direccion_residencia = $3, departamento = $4, municipio = $5 WHERE correo_institucional = $6 OR id = $7`,
          [
            targetUser.telefono_personal,
            targetUser.correo_personal,
            targetUser.direccion_residencia,
            targetUser.departamento,
            targetUser.municipio,
            targetUser.email,
            targetUser.id,
          ]
        );
      }
    } catch (dbErr) {}

    // Registrar en auditoría institucional
    try {
      await registrarAuditoria({
        usuario_id: targetUser.id,
        accion: "ACTUALIZACION_PERFIL",
        tabla_afectada: "usuarios",
        registro_id: targetUser.id,
        detalles: `Actualización de perfil y datos de contacto para ${targetUser.username}`,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });
    } catch (auditErr) {}

    res.json({
      success: true,
      message: "Perfil institucional actualizado correctamente",
      user: {
        ...targetUser,
        _links: buildAuthLinks(targetUser),
      },
      _links: buildAuthLinks(targetUser),
    });
  } catch (error) {
    req.log?.error?.(error, "Error al actualizar perfil de usuario");
    res.status(500).json({
      success: false,
      message: "Error al actualizar la información del perfil",
    });
  }
};

// Descargar expediente / información del usuario autenticado (GET /auth/me/download)
exports.downloadProfile = async (req, res) => {
  try {
    const currentUser = req.user ? (USERS_DEV.find((u) => u.id === req.user.id || u.username === req.user.username) || req.user) : USERS_DEV[0];
    const persona = (mockData.personas || []).find((p) => p.correo_institucional === currentUser.email || p.id === currentUser.id) || {};

    const exportData = {
      institucion: "Secretaría de Comunicación Social de la Presidencia (SCSPR)",
      sistema: "Core Humanis - Expediente Digital Único",
      fecha_exportacion: new Date().toISOString(),
      usuario: {
        id: currentUser.id,
        username: currentUser.username,
        rol: currentUser.rol_nombre || currentUser.role,
        nombres: currentUser.nombres,
        cui_dpi: persona.cui_dpi || currentUser.cui_dpi || "550e8400-e29b-41d4-a716-446655440000",
        nit: persona.nit || "7845123-4",
        igss_afiliacion: persona.igss_afiliacion || "98451234",
        correo_institucional: currentUser.email,
        correo_personal: currentUser.correo_personal || persona.correo_personal || "colaborador@correo.com",
        telefono_personal: currentUser.telefono_personal || persona.telefono_personal || "5555-0000",
        direccion_residencia: currentUser.direccion_residencia || persona.direccion_residencia || "Ciudad de Guatemala",
        departamento: currentUser.departamento || persona.departamento || "Guatemala",
        municipio: currentUser.municipio || persona.municipio || "Guatemala",
        contacto_emergencia: currentUser.contacto_emergencia || "Contacto registrado en URH",
      },
      relacion_laboral: persona.contrato_actual || {
        renglon_codigo: "011",
        renglon_nombre: "Personal Permanente",
        puesto_funcional: currentUser.puesto_funcional || "Servidor Público SCSPR",
        unidad_admin: "Unidad de Recursos Humanos",
        estado: "ACTIVO",
      },
      saldos_vacaciones: {
        dias_derecho_anual: 15,
        dias_acumulados: 15,
        dias_utilizados: 0,
        dias_disponibles: 15,
      },
      documentos_expediente: (persona.documentos || []).map((d) => ({
        tipo: d.tipo_nombre || d.tipo_documento,
        codigo: d.codigo,
        fecha_subida: d.created_at,
        vigente: !d.fecha_vencimiento || new Date(d.fecha_vencimiento) > new Date(),
      })),
      seguridad_integridad: {
        formato: "EXPEDIENTE_DIGITAL_JSON_V2",
        hash_sha256: crypto
          .createHash("sha256")
          .update(JSON.stringify(currentUser) + Date.now().toString())
          .digest("hex"),
        validador_url: `http://${req.headers.host || "localhost:8080"}/core-humanis/portal`,
      },
    };

    const fileName = `SCSPR-Expediente-Digital-${currentUser.username || "perfil"}-${new Date().toISOString().split("T")[0]}.json`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    req.log?.error?.(error, "Error al descargar expediente digital");
    res.status(500).json({
      success: false,
      message: "Error al generar archivo del expediente digital",
    });
  }
};

// Roles institucionales disponibles para desarrollo y pruebas (GET /auth/roles)
exports.getAvailableRoles = async (req, res) => {
  res.json({
    success: true,
    roles: USERS_DEV.map((u) => ({
      ...u,
      _links: buildAuthLinks(u),
    })),
    _links: {
      self: { href: "/api/v1/core-humanis/auth/roles", method: "GET" },
      login: { href: "/api/v1/core-humanis/auth/tokens", method: "POST" },
    },
  });
};
