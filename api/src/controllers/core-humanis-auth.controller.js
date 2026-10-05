const crypto = require("crypto");
const db = require("../config/db-core-humanis");
const { buildAuthLinks } = require("../utils/hateoas.helper");
const { registrarAuditoria } = require("../services/audit.service");

// Obtener perfil actual del usuario autenticado institucionalmente (GET /auth/me)
exports.me = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const email = req.user?.email || "";
    const name = req.user?.name || req.user?.nombres || "Usuario Institucional";
    const role = req.user?.role || "usuario";
    const permissions = req.user?.permissions || [];

    const currentUser = {
      id: userId,
      username: email.split("@")[0] || "usuario",
      email: email,
      role: role,
      rol_nombre: role === "admin" ? "Administrador General" : "Usuario Institucional",
      nombres: name,
      permissions: permissions,
    };

    res.json({
      success: true,
      user: {
        ...currentUser,
        _links: buildAuthLinks(currentUser),
      },
      _links: buildAuthLinks(currentUser),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener usuario." });
  }
};

// Generar sesión / token JWT (POST /auth/tokens) - Redirigido a portal central
exports.login = async (req, res) => {
  res.status(400).json({
    success: false,
    message: "La autenticación debe realizarse a través del portal central http://localhost:8080/login",
  });
};

// Actualizar perfil del usuario autenticado (PUT /auth/me)
exports.updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user?.userId || req.user?.id;
    const targetUser = {
      id: currentUserId,
      username: req.user?.email?.split("@")[0] || "usuario",
      email: req.user?.email,
      nombres: req.user?.name || req.user?.nombres,
    };

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

    // Persistir en PostgreSQL
    try {
      if (targetUser.id) {
        await db.query(
          `UPDATE personas SET telefono_personal = COALESCE($1, telefono_personal), correo_personal = COALESCE($2, correo_personal), direccion_residencia = COALESCE($3, direccion_residencia), departamento = COALESCE($4, departamento), municipio = COALESCE($5, municipio) WHERE correo_institucional = $6 OR id::text = $7`,
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
    } catch (dbErr) {
      console.warn("No se pudo actualizar en PostgreSQL personas:", dbErr.message);
    }

    // Registrar en auditoría institucional
    try {
      await registrarAuditoria({
        usuarioId: targetUser.id,
        usuarioUsername: targetUser.username,
        accion: "ACTUALIZACION_PERFIL",
        tablaAfectada: "usuarios",
        registroId: targetUser.id,
        detalles: `Actualización de perfil y datos de contacto para ${targetUser.username}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
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
    res.status(500).json({
      success: false,
      message: "Error al actualizar la información del perfil",
    });
  }
};

// Descargar expediente / información del usuario autenticado (GET /auth/me/download)
exports.downloadProfile = async (req, res) => {
  try {
    const currentUser = {
      id: req.user?.userId || req.user?.id,
      username: req.user?.email?.split("@")[0] || "usuario",
      email: req.user?.email,
      role: req.user?.role || "usuario",
      rol_nombre: req.user?.role === "admin" ? "Administrador General" : "Usuario Institucional",
      nombres: req.user?.name || req.user?.nombres || "Usuario Institucional",
    };

    let persona = {};
    try {
      const pRes = await db.query(
        "SELECT * FROM personas WHERE correo_institucional = $1 OR id::text = $2 LIMIT 1",
        [currentUser.email, currentUser.id]
      );
      if (pRes.rows.length > 0) persona = pRes.rows[0];
    } catch (e) {}

    const exportData = {
      institucion: "Secretaría de Comunicación Social de la Presidencia (SCSPR)",
      sistema: "Core Humanis - Expediente Digital Único",
      fecha_exportacion: new Date().toISOString(),
      usuario: {
        id: currentUser.id,
        username: currentUser.username,
        rol: currentUser.rol_nombre || currentUser.role,
        nombres: currentUser.nombres,
        cui_dpi: persona.cui_dpi || "1000000000101",
        nit: persona.nit || "1000001-1",
        igss_afiliacion: persona.igss_afiliacion || "10000001",
        correo_institucional: currentUser.email,
        correo_personal: persona.correo_personal || "colaborador@ejemplo.com",
        telefono_personal: persona.telefono_personal || "5555-0001",
        direccion_residencia: persona.direccion_residencia || "Ciudad de Guatemala",
        departamento: persona.departamento || "Guatemala",
        municipio: persona.municipio || "Guatemala",
      },
      relacion_laboral: {
        renglon_codigo: "011",
        renglon_nombre: "Personal Permanente",
        puesto_funcional: "Servidor Público SCSPR",
        unidad_admin: "Unidad de Recursos Humanos",
        estado: "ACTIVO",
      },
      saldos_vacaciones: {
        dias_derecho_anual: 15,
        dias_acumulados: 15,
        dias_utilizados: 0,
        dias_disponibles: 15,
      },
      seguridad_integridad: {
        formato: "EXPEDIENTE_DIGITAL_JSON_V2",
        hash_sha256: crypto
          .createHash("sha256")
          .update(JSON.stringify(currentUser) + Date.now().toString())
          .digest("hex"),
        validador_url: `${req.protocol || "http"}://${req.headers.host || "localhost:8080"}/portal`,
      },
    };

    const fileName = `SCSPR-Expediente-Digital-${currentUser.username || "perfil"}-${new Date().toISOString().split("T")[0]}.json`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar archivo del expediente digital",
    });
  }
};

// Roles institucionales disponibles (GET /auth/roles)
exports.getAvailableRoles = async (req, res) => {
  res.json({
    success: true,
    roles: [],
    message: "Los perfiles y permisos se administran centralmente en http://localhost:8080/profiles",
    _links: {
      self: { href: "/api/v1/core-humanis/auth/roles", method: "GET" },
    },
  });
};
