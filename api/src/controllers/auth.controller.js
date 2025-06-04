const authService = require("../services/auth.service");
const { validationResult } = require("express-validator");

// LOGIN (Actualizar para usar 'email')
const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body; // Cambiado de nombre_usuario
  try {
    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (
      [
        "Usuario no encontrado.",
        "Credenciales inválidas.",
        "Cuenta inactiva.",
        "Correo no validado.",
        "Contraseña no establecida para esta cuenta.",
      ].includes(error.message)
    ) {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
};

// SIGNUP
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password, nombre_completo } = req.body;
  try {
    const result = await authService.registerUser(
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
                    <p>${
                      error.message ||
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

module.exports = {
  login,
  signup,
  verifyEmail,
  forgotPasswordController,
  renderResetPasswordPage,
  resetPasswordController,
};
