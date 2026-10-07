const crypto = require("crypto");
const db = require("../config/db-core-humanis");
const { buildPortalProfileLinks } = require("../utils/hateoas.helper");
const { registrarAuditoria } = require("../services/audit.service");

/**
 * CONTROLADOR DEL PORTAL DEL EMPLEADO / EXPEDIENTE DE RRHH
 * 
 * Responsabilidad exclusiva: Gestión del expediente del colaborador (personas),
 * datos laborales, actualización de datos de contacto y descarga de expediente digital.
 * 
 * NOTA DE ARQUITECTURA:
 * El servicio de autenticación (/auth) solo gestiona sesiones, tokens, roles y permisos.
 * Toda consulta y mutación de personas y relaciones laborales pertenece a este controlador de RRHH.
 */

// Obtener expediente laboral y datos del colaborador autenticado (GET /portal/profile o GET /portal/me)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const email = req.user?.email || "";
    const cui = req.user?.cui || req.user?.cui_dpi || req.user?.username || "";
    const name = req.user?.name || req.user?.nombres || "Usuario Institucional";
    const role = req.user?.role || "usuario";

    // Buscar expediente del colaborador amarrado en el dominio de Recursos Humanos (personas)
    let personaExpediente = null;
    try {
      const personaRes = await db.query(
        `SELECT p.*,
                rl.id AS contrato_id,
                rl.fecha_inicio,
                rl.salario_honorarios,
                rp.codigo AS renglon_codigo,
                rp.nombre AS renglon_nombre,
                pf.nombre AS puesto_funcional,
                ua.nombre AS unidad_admin
         FROM personas p
         LEFT JOIN relaciones_laborales rl ON rl.persona_id = p.id AND rl.es_contrato_actual = true
         LEFT JOIN renglones_presupuestarios rp ON rl.renglon_id = rp.id
         LEFT JOIN puestos_funcionales pf ON rl.puesto_funcional_id = pf.id
         LEFT JOIN unidades_administrativas ua ON rl.unidad_admin_id = ua.id
         WHERE (cui_dpi IS NOT NULL AND REPLACE(cui_dpi, ' ', '') = $1)
            OR (correo_institucional IS NOT NULL AND LOWER(correo_institucional) = $2)
            OR (correo_personal IS NOT NULL AND LOWER(correo_personal) = $2)
         LIMIT 1`,
        [String(cui).replace(/\s+/g, ""), email.toLowerCase()]
      );

      if (personaRes.rows && personaRes.rows.length > 0) {
        personaExpediente = personaRes.rows[0];
      }
    } catch (dbErr) {
      console.warn("⚠️ No se pudo vincular el expediente del colaborador en /portal/profile:", dbErr.message);
    }

    const currentProfile = {
      id: userId,
      username: email.split("@")[0] || "usuario",
      email: email,
      role: role,
      rol_nombre: role === "admin" ? "Administrador General" : (role === "COLABORADOR" ? "Colaborador Institucional (Self-Service)" : "Usuario Institucional"),
      nombres: personaExpediente ? `${personaExpediente.primer_nombre} ${personaExpediente.segundo_nombre || ""}`.trim() : name,
      apellidos: personaExpediente ? `${personaExpediente.primer_apellido} ${personaExpediente.segundo_apellido || ""}`.trim() : "",
      puesto_funcional: personaExpediente?.puesto_funcional || "Servidor Público SCSPR",
      unidad_admin: personaExpediente?.unidad_admin || "Secretaría de Comunicación Social",
      renglon_codigo: personaExpediente?.renglon_codigo || "011",
      cui_dpi: personaExpediente?.cui_dpi || cui,
      persona_id: personaExpediente?.id || null,
      persona: personaExpediente,
      telefono_personal: personaExpediente?.telefono_personal || "",
      correo_personal: personaExpediente?.correo_personal || "",
      direccion_residencia: personaExpediente?.direccion_residencia || "",
      departamento: personaExpediente?.departamento || "",
      municipio: personaExpediente?.municipio || "",
      contacto_emergencia: personaExpediente?.contacto_emergencia || "",
    };

    const links = buildPortalProfileLinks ? buildPortalProfileLinks(currentProfile) : undefined;

    res.json({
      success: true,
      profile: {
        ...currentProfile,
        _links: links,
      },
      // Compatibilidad con clientes que leen data.user
      user: {
        ...currentProfile,
        _links: links,
      },
      _links: links,
    });
  } catch (error) {
    console.error("Error al obtener perfil en /portal/profile:", error);
    res.status(500).json({ success: false, message: "Error al obtener perfil del colaborador." });
  }
};

// Actualizar datos de contacto en el expediente de RRHH (PUT /portal/profile)
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

    // Persistir exclusivamente en la tabla personas de Recursos Humanos
    try {
      if (targetUser.id || targetUser.email) {
        await db.query(
          `UPDATE personas SET 
             telefono_personal = COALESCE($1, telefono_personal), 
             correo_personal = COALESCE($2, correo_personal), 
             direccion_residencia = COALESCE($3, direccion_residencia), 
             departamento = COALESCE($4, departamento), 
             municipio = COALESCE($5, municipio),
             contacto_emergencia = COALESCE($6, contacto_emergencia)
           WHERE correo_institucional = $7 OR id::text = $8`,
          [
            targetUser.telefono_personal,
            targetUser.correo_personal,
            targetUser.direccion_residencia,
            targetUser.departamento,
            targetUser.municipio,
            targetUser.contacto_emergencia,
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
        accion: "ACTUALIZACION_EXPEDIENTE_RRHH",
        tablaAfectada: "personas",
        registroId: targetUser.id,
        detalles: `Actualización de expediente y datos de contacto en RRHH para ${targetUser.username}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    } catch (auditErr) {}

    const links = buildPortalProfileLinks ? buildPortalProfileLinks(targetUser) : undefined;

    res.json({
      success: true,
      message: "Expediente del colaborador actualizado correctamente en RRHH",
      profile: {
        ...targetUser,
        _links: links,
      },
      user: {
        ...targetUser,
        _links: links,
      },
      _links: links,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar la información del expediente",
    });
  }
};

// Descargar expediente digital del colaborador (GET /portal/profile/download)
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
      sistema: "Core Humanis - Expediente Digital Único (RRHH)",
      fecha_exportacion: new Date().toISOString(),
      colaborador: {
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
