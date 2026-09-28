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
      password,
      nombre_completo
    );
    res.status(201).json(result);
  } catch (error) {
    if (error.message === "El correo electrónico ya está registrado.") {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    if (error.message === "Error al enviar el correo electrónico.") {
      // Aunque el usuario se creó, el correo falló. Decide cómo manejarlo.
      // Podrías tener un reenvío o simplemente informar.
      return res.status(500).json({
        message:
          "Usuario registrado, pero hubo un problema al enviar el correo de validación.",
      });
    }
    next(error);
  }
};

// VERIFY EMAIL
const verifyEmail = async (req, res, next) => {
  const { token } = req.params;
  try {
    const result = await authService.verifyEmailToken(token);
    // Enviar una respuesta HTML simple ya que el usuario está en el navegador
    res.status(200).send(`
            <html>
                <head><title>Verificación de Correo - Sistema SCSPR</title></head>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1>${result.message}</h1>
                    <p>Puede cerrar esta ventana.</p>
                </body>
            </html>`);
  } catch (error) {
    res.status(400).send(`
            <html>
                <head><title>Error de Verificación - Sistema SCSPR</title></head>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                    <h1>Error de Verificación</h1>
                    <p>${error.message ||
      "Ocurrió un error durante la verificación."
      }</p>
                </body>
            </html>`);
  }
};

// --- FORGOT PASSWORD CONTROLLER ---
const forgotPasswordController = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;
  try {
    const result = await authService.forgotPassword(email);
    // Siempre devolver un mensaje genérico para no revelar si un email existe o no
    res.status(200).json({ message: result.message });
  } catch (error) {
    // Manejar errores internos del servicio si los hubiera (ej. fallo al enviar email)
    console.error("Error en forgotPasswordController:", error);
    res
      .status(500)
      .json({ message: "Ocurrió un error al procesar su solicitud." });
    // next(error); // No queremos exponer detalles del error
  }
};

// --- RENDER RESET PASSWORD PAGE CONTROLLER ---
const renderResetPasswordPage = (req, res) => {
  const { token } = req.params;
  // Aquí simplemente renderizamos una página HTML con un formulario.
  // El formulario hará un POST a /api/auth/reset-password/:token
  // Es importante incluir el token en la URL del action del form o como campo oculto.
  res.send(`
        <html>
            <head>
                <title>Restablecer Contraseña - Sistema SCSPR</title>
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 90vh; background-color: #f4f4f4; margin: 0; }
                    .container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
                    h1 { text-align: center; color: #333; }
                    label { display: block; margin-bottom: 8px; color: #555; }
                    input[type="password"] { width: calc(100% - 22px); padding: 10px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px; }
                    button { background-color: #007bff; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 16px; }
                    button:hover { background-color: #0056b3; }
                    .message { text-align: center; margin-top: 15px; padding: 10px; border-radius: 4px; }
                    .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;}
                    .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Restablecer Contraseña</h1>
                    <form id="resetForm" action="/api/auth/reset-password/${token}" method="POST">
                        <label for="password">Nueva Contraseña:</label>
                        <input type="password" id="password" name="password" required minlength="8">
                        <label for="confirm_password">Confirmar Nueva Contraseña:</label>
                        <input type="password" id="confirm_password" name="confirm_password" required minlength="8">
                        <button type="submit">Restablecer Contraseña</button>
                    </form>
                    <div id="messageDiv" class="message" style="display:none;"></div>
                </div>
                <script src="/js/reset-password-form.js"></script>
            </body>
        </html>
    `);
};

// --- RESET PASSWORD CONTROLLER (Maneja el POST del formulario de reseteo) ---
const resetPasswordController = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Si la validación falla (ej. contraseñas no coinciden, longitud)
    return res.status(400).json({
      message: errors
        .array()
        .map((e) => e.msg)
        .join(", "),
    });
  }

  const { token } = req.params;
  const { password } = req.body; // La confirm_password ya fue validada por express-validator
  try {
    const result = await authService.resetPassword(token, password);
    res.status(200).json(result); // { message: 'Contraseña restablecida...' }
  } catch (error) {
    // Errores como token inválido, expirado, etc.
    res.status(400).json({ message: error.message });
  }
};

// VERIFICAR CONTRASEÑA (re-confirmación de identidad para firmas electrónicas)
const verifyPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { password } = req.body;
  try {
    const isValid = await authService.verifyPassword(req.user.userId, password);
    if (!isValid) {
      return res.status(401).json({ valid: false, message: "Contraseña incorrecta." });
    }
    res.status(200).json({ valid: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  signup,
  verifyEmail,
  forgotPasswordController,
  renderResetPasswordPage,
  resetPasswordController,
  verifyPassword,
};
