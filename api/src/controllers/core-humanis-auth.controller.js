const jwt = require("jsonwebtoken");
const { mockData } = require("../config/mock-store");
const { buildAuthLinks } = require("../utils/hateoas.helper");

const JWT_SECRET = process.env.JWT_SECRET || "scspr-secret-jwt-key-2026";

const USERS_DEV = [
  {
    id: "22222222-2222-2222-2222-222222222201",
    username: "jefa.rrhh",
    email: "rrhh@scspr.gob.gt",
    role: "JEFA_RRHH",
    rol_nombre: "Jefa de Recursos Humanos",
    nombres: "Licda. María Elena Morales Paz",
    permissions: ["core-humanis:read", "core-humanis:write", "core-humanis:constancias", "core-humanis:admin"],
  },
  {
    id: "22222222-2222-2222-2222-222222222202",
    username: "analista.rrhh",
    email: "analista@scspr.gob.gt",
    role: "ANALISTA_RRHH",
    rol_nombre: "Analista de Recursos Humanos",
    nombres: "Lic. Juan Pablo Gómez",
    permissions: ["core-humanis:read", "core-humanis:write", "core-humanis:constancias"],
  },
  {
    id: "22222222-2222-2222-2222-222222222203",
    username: "auditor.cgc",
    email: "auditor@cgc.gob.gt",
    role: "AUDITOR",
    rol_nombre: "Auditor Interno / Fiscalizador CGC",
    nombres: "Lic. Fernando Ruiz",
    permissions: ["core-humanis:read"],
  },
  {
    id: "22222222-2222-2222-2222-222222222204",
    username: "admin.ti",
    email: "informatica@scspr.gob.gt",
    role: "ADMIN_TI",
    rol_nombre: "Administrador de Informática",
    nombres: "Ing. Marvin Castillo",
    permissions: ["core-humanis:read", "core-humanis:write", "core-humanis:constancias", "core-humanis:admin"],
  },
  {
    id: "510523ce-a019-51d3-b8c9-c6b5b1696471",
    username: "colaborador.011",
    email: "karina.garcia@scspr.gob.gt",
    role: "COLABORADOR",
    rol_nombre: "Colaborador SCSPR (Personal)",
    nombres: "Karina Judith García Ruano",
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
  const currentUser = req.user || USERS_DEV[0];
  res.json({
    success: true,
    user: {
      ...currentUser,
      _links: buildAuthLinks(currentUser),
    },
    _links: buildAuthLinks(currentUser),
  });
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
