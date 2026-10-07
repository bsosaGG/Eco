const { buildAuthLinks } = require("../utils/hateoas.helper");
const portalProfileCtrl = require("./portal-profile.controller");

/**
 * CONTROLADOR DE AUTENTICACIÓN INSTITUCIONAL / SESIÓN (/auth)
 * 
 * Responsabilidad exclusiva: Sesión, roles y permisos de acceso del usuario autenticado.
 * REGLA DE ARQUITECTURA:
 * Este servicio NO gestiona ni consulta datos de la tabla 'personas' ni expedientes de RRHH.
 * El expediente laboral del colaborador es gestionado exclusivamente por el módulo de RRHH
 * en /portal/profile (portal-profile.controller.js).
 */

// Obtener sesión, rol y permisos del usuario autenticado (GET /auth/me)
exports.me = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const email = req.user?.email || "";
    const name = req.user?.name || req.user?.nombres || "Usuario Institucional";
    const role = req.user?.role || "usuario";
    const permissions = req.user?.permissions || [];

    // Objeto de sesión estrictamente enfocado en identidad y control de acceso
    const currentUser = {
      id: userId,
      username: email.split("@")[0] || "usuario",
      email: email,
      name: name,
      role: role,
      rol_nombre:
        role === "admin"
          ? "Administrador General"
          : role === "COLABORADOR"
          ? "Colaborador Institucional (Self-Service)"
          : "Usuario Institucional",
      permissions: permissions,
    };

    const links = buildAuthLinks ? buildAuthLinks(currentUser) : undefined;

    res.json({
      success: true,
      user: {
        ...currentUser,
        _links: links,
      },
      _links: links,
    });
  } catch (error) {
    console.error("Error al obtener sesión en /auth/me:", error);
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

// ===========================================================================
// DELEGACIONES DE COMPATIBILIDAD TRANSITORIA HACIA RRHH (/portal/profile)
// ===========================================================================
// Actualizar expediente (PUT /auth/me) -> Delegado a RRHH
exports.updateProfile = async (req, res) => {
  return portalProfileCtrl.updateProfile(req, res);
};

// Descargar expediente digital (GET /auth/me/download) -> Delegado a RRHH
exports.downloadProfile = async (req, res) => {
  return portalProfileCtrl.downloadProfile(req, res);
};
