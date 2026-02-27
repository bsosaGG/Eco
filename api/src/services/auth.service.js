const db = require("../config/db-users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("./email.service");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET_KEY_SCSCR;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN_SCSCR;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_BASE_URL =
  NODE_ENV === "production"
    ? process.env.API_BASE_URL_PROD
    : process.env.API_BASE_URL_DEV;

// --- LOGIN ---
const loginUser = async (email, password) => {
  // 1. Obtener datos básicos del usuario
  const userQuery =
    "SELECT id_usuario, email, password_hash, rol, activo, correo_validado, nombre_completo, foto_perfil_url FROM usuarios WHERE email = $1";
  const { rows } = await db.query(userQuery, [email.toLowerCase()]);

  if (rows.length === 0) {
    throw new Error("Credenciales inválidas."); // Mensaje genérico por seguridad
  }
  const user = rows[0];

  // Validaciones de estado de la cuenta
  if (!user.activo || !user.correo_validado || !user.password_hash) {
    throw new Error("Credenciales inválidas o cuenta no activada.");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error("Credenciales inválidas.");
  }

  // 2. Obtener todos los permisos del usuario (la nueva lógica)
  const permissionsQuery = `
    SELECT DISTINCT p.clave_permiso
    FROM permisos p
    JOIN perfil_permisos pp ON p.id_permiso = pp.id_permiso
    JOIN usuario_perfiles up ON pp.id_perfil = up.id_perfil
    WHERE up.id_usuario = $1
    UNION -- Usamos UNION para combinar con permisos directos y evitar duplicados
    SELECT p.clave_permiso
    FROM permisos p
    JOIN usuario_permisos up_direct ON p.id_permiso = up_direct.id_permiso
    WHERE up_direct.id_usuario = $1;
  `;
  const permissionsResult = await db.query(permissionsQuery, [user.id_usuario]);
  // Convertimos el resultado (array de objetos) en un array de strings simple
  const permissions = permissionsResult.rows.map((p) => p.clave_permiso);

  // Si el rol es 'admin', le damos todos los permisos existentes como un super-poder.
  if (user.rol === "admin") {
    const allPermissionsResult = await db.query(
      "SELECT clave_permiso FROM permisos"
    );
    const allPermissions = allPermissionsResult.rows.map(
      (p) => p.clave_permiso
    );
    // Usamos un Set para asegurar que no haya duplicados
    permissions.push(...allPermissions);
  }
  const uniquePermissions = [...new Set(permissions)];

  // 3. Crear el payload del token con los permisos
  const payload = {
    userId: user.id_usuario,
    email: user.email,
    role: user.rol,
    name: user.nombre_completo,
    permissions: uniquePermissions, // ¡Aquí incluimos los permisos!
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  await db.query(
    "UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = $1",
    [user.id_usuario]
  );

  // 4. Devolver la respuesta completa, incluyendo los permisos
  return {
    token,
    user: {
      id: user.id_usuario,
      email: user.email,
      role: user.rol,
      name: user.nombre_completo,
      foto_perfil_url: user.foto_perfil_url,
      permissions: uniquePermissions, // ¡Y aquí también!
    },
  };
};

// --- SIGNUP ---
const registerUser = async (email, password, nombreCompleto) => {
  const lowerEmail = email.toLowerCase();

  // --- 1. VALIDACIÓN DE DOMINIOS PERMITIDOS ---
  const allowedDomains = ['scspr.gob.gt', 'mcd.gob.gt'];
  const emailDomain = lowerEmail.split('@')[1]; // Extrae lo que está después del @

  if (!allowedDomains.includes(emailDomain)) {
    throw new Error(`Registro denegado. Solo se permiten correos de los dominios: ${allowedDomains.join(', ')}`);
  }
  // --------------------------------------------

  // Verificar si el email ya existe
  const existingUser = await db.query(
    "SELECT id_usuario FROM usuarios WHERE email = $1",
    [lowerEmail]
  );
  if (existingUser.rows.length > 0) {
    throw new Error("El correo electrónico ya está registrado.");
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const validationToken = crypto.randomBytes(32).toString("hex");
  const validationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  const newUserQuery = `
        INSERT INTO usuarios (email, password_hash, nombre_completo, token_validacion_correo, token_validacion_correo_expira, rol, activo, correo_validado)
        VALUES ($1, $2, $3, $4, $5, 'usuario', TRUE, FALSE) RETURNING id_usuario, email, nombre_completo;
    `; // rol 'usuario', activo TRUE, correo_validado FALSE por defecto
  const newUserResult = await db.query(newUserQuery, [
    lowerEmail,
    passwordHash,
    nombreCompleto,
    validationToken,
    validationTokenExpires,
  ]);
  const newUser = newUserResult.rows[0];

  // --- 2. ASIGNACIÓN AUTOMÁTICA DEL PERFIL ---
  // Buscamos el ID del perfil por su nombre y lo insertamos en usuario_perfiles
  const assignProfileQuery = `
    INSERT INTO usuario_perfiles (id_usuario, id_perfil)
    SELECT $1, id_perfil FROM perfiles WHERE nombre_perfil = 'Usuario Impresiones'
    ON CONFLICT DO NOTHING;
  `;
  await db.query(assignProfileQuery, [newUser.id_usuario]);
  // --------------------------------------------

  // Enviar correo de validación
  const verificationUrl = `${API_BASE_URL}/api/auth/verify-email/${validationToken}`;
  console.log(verificationUrl);
  await emailService.sendEmail(
    // Necesitaremos un método genérico o uno específico
    lowerEmail,
    "Validación de Correo Electrónico - Sistema SCSPR",
    `<h1>Bienvenido al Sistema SCSPR!</h1>
         <p>Gracias por registrarte. Por favor, haz clic en el siguiente enlace para validar tu correo electrónico:</p>
         <p><a href="${verificationUrl}">${verificationUrl}</a></p>
         <p>Este enlace expirará en 24 horas.</p>
         <p>Si no te registraste, por favor ignora este correo.</p>`,
    `Gracias por registrarte en Sistema SCSPR. Valida tu correo: ${verificationUrl}`
  );

  return {
    message:
      "Usuario registrado exitosamente. Por favor, revise su correo para validar su cuenta.",
    user: {
      id: newUser.id_usuario,
      email: newUser.email,
      name: newUser.nombre_completo,
    },
  };
};

// --- VERIFY EMAIL ---
const verifyEmailToken = async (token) => {
  const userQuery = `
        SELECT id_usuario, token_validacion_correo_expira 
        FROM usuarios 
        WHERE token_validacion_correo = $1 AND correo_validado = FALSE;
    `;
  const { rows } = await db.query(userQuery, [token]);

  if (rows.length === 0) {
    throw new Error(
      "Token de validación inválido o el correo ya ha sido validado."
    );
  }
  const user = rows[0];

  if (new Date() > new Date(user.token_validacion_correo_expira)) {
    // Opcional: Limpiar token expirado y permitir reenvío
    // await db.query('UPDATE usuarios SET token_validacion_correo = NULL, token_validacion_correo_expira = NULL WHERE id_usuario = $1', [user.id_usuario]);
    throw new Error(
      "El token de validación ha expirado. Por favor, solicite uno nuevo."
    );
  }

  await db.query(
    "UPDATE usuarios SET correo_validado = TRUE, token_validacion_correo = NULL, token_validacion_correo_expira = NULL, activo = TRUE WHERE id_usuario = $1",
    [user.id_usuario]
  );
  return {
    message:
      "Correo electrónico validado exitosamente. Ahora puede iniciar sesión.",
  };
};

// --- FORGOT PASSWORD (Solicitud de reseteo) ---
const forgotPassword = async (email) => {
  const lowerEmail = email.toLowerCase();
  const userQuery =
    "SELECT id_usuario, email, activo, correo_validado FROM usuarios WHERE email = $1";
  const { rows } = await db.query(userQuery, [lowerEmail]);

  if (rows.length === 0) {
    // No revelar si el email existe o no por seguridad.
    // Simplemente indicar que si el email está registrado, se enviará un correo.
    console.log(
      `Solicitud de reseteo para email no encontrado (o se simula envío): ${lowerEmail}`
    );
    return {
      message:
        "Si su correo electrónico está registrado, recibirá un enlace para restablecer su contraseña.",
    };
  }
  const user = rows[0];

  if (!user.activo) {
    // No permitir reseteo si la cuenta está inactiva por un admin.
    return {
      message:
        "No se puede restablecer la contraseña para esta cuenta en este momento.",
    };
  }
  if (!user.correo_validado) {
    // No permitir reseteo si el correo no ha sido validado.
    return {
      message:
        "Su correo electrónico aún no ha sido validado. Por favor, valide su correo primero.",
    };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora de validez

  await db.query(
    "UPDATE usuarios SET token_reseteo_password = $1, token_reseteo_password_expira = $2 WHERE id_usuario = $3",
    [resetToken, resetTokenExpires, user.id_usuario]
  );

  const resetUrl = `${API_BASE_URL}/reset-password/${resetToken}`; // URL a una página que renderiza el form de reseteo
  // O podría ser una URL del frontend si la app móvil maneja deep links:
  // const resetUrl = `myapp://reset-password/${resetToken}`;

  await emailService.sendEmail(
    lowerEmail,
    "Restablecimiento de Contraseña - Sistema SCSPR",
    `<h1>Solicitud de Restablecimiento de Contraseña</h1>
         <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta.</p>
         <p>Haga clic en el siguiente enlace para establecer una nueva contraseña:</p>
         <p><a href="${resetUrl}">${resetUrl}</a></p>
         <p>Este enlace expirará en 1 hora.</p>
         <p>Si no solicitó esto, por favor ignore este correo.</p>`,
    `Para restablecer su contraseña en Sistema SCSPR, visite: ${resetUrl}`
  );

  return {
    message:
      "Si su correo electrónico está registrado y validado, recibirá un enlace para restablecer su contraseña.",
  };
};

// --- RESET PASSWORD (Establecer nueva contraseña con token) ---
const resetPassword = async (token, newPassword) => {
  const userQuery = `
        SELECT id_usuario, token_reseteo_password_expira 
        FROM usuarios 
        WHERE token_reseteo_password = $1;
    `;
  const { rows } = await db.query(userQuery, [token]);

  if (rows.length === 0) {
    throw new Error("Token de restablecimiento inválido.");
  }
  const user = rows[0];

  if (new Date() > new Date(user.token_reseteo_password_expira)) {
    // Opcional: Limpiar token expirado
    // await db.query('UPDATE usuarios SET token_reseteo_password = NULL, token_reseteo_password_expira = NULL WHERE id_usuario = $1', [user.id_usuario]);
    throw new Error("El token de restablecimiento ha expirado.");
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await db.query(
    "UPDATE usuarios SET password_hash = $1, token_reseteo_password = NULL, token_reseteo_password_expira = NULL, ultimo_login = NULL WHERE id_usuario = $2",
    [passwordHash, user.id_usuario] // Limpiar token y ultimo_login para forzar nuevo inicio de sesión
  );

  // Opcional: Enviar correo de confirmación de cambio de contraseña
  // const userEmailQuery = 'SELECT email FROM usuarios WHERE id_usuario = $1';
  // const emailRes = await db.query(userEmailQuery, [user.id_usuario]);
  // if (emailRes.rows.length > 0) {
  //     await emailService.sendEmail(emailRes.rows[0].email, 'Contraseña Restablecida - Sistema SCSPR', 'Su contraseña ha sido restablecida exitosamente.', 'Su contraseña ha sido restablecida.');
  // }

  return {
    message:
      "Contraseña restablecida exitosamente. Ahora puede iniciar sesión con su nueva contraseña.",
  };
};

module.exports = {
  loginUser,
  registerUser,
  verifyEmailToken,
  forgotPassword,
  resetPassword,
};
