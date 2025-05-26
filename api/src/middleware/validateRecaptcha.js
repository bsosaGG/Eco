const axios = require("axios");
require("dotenv").config();

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

async function validateRecaptcha(req, res, next) {
  const recaptchaToken = req.body.recaptchaToken; // El token enviado desde el cliente

  if (!RECAPTCHA_SECRET_KEY) {
    console.warn(
      "RECAPTCHA_SECRET_KEY no está configurada. Saltando validación de reCAPTCHA."
    );
    return next(); // En desarrollo o si no se configura, permitir pasar
  }

  if (!recaptchaToken) {
    return res
      .status(400)
      .json({ message: "Token de reCAPTCHA no proporcionado." });
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        },
      }
    );

    const { success, score, action } = response.data; // score y action son para reCAPTCHA v3

    // Para reCAPTCHA v2 (Checkbox o Invisible), solo 'success' es lo principal.
    // Para reCAPTCHA v3, también se verifica el 'score' y 'action'.
    // Aquí asumimos v2 por simplicidad, pero puedes adaptarlo para v3.
    if (success) {
      // console.log('reCAPTCHA verificado con éxito:', response.data);
      // Opcional para v3: if (score > 0.5 && action === 'submit_denuncia') { next(); }
      next();
    } else {
      console.error("Fallo en la verificación de reCAPTCHA:", response.data);
      return res.status(400).json({
        message: "Verificación de reCAPTCHA fallida.",
        errors: response.data["error-codes"],
      });
    }
  } catch (error) {
    console.error("Error al verificar reCAPTCHA:", error.message);
    return res
      .status(500)
      .json({ message: "Error del servidor al verificar reCAPTCHA." });
  }
}

module.exports = validateRecaptcha;
