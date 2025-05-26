const app = require("./app");
require("dotenv").config(); // Asegura que dotenv se cargue

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor API escuchando en el puerto ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV || "development"}`);
  // Verificación rápida de variables de entorno clave
  if (!process.env.DATABASE_URL) console.warn("DATABASE_URL no está definida!");
  if (!process.env.MAIL_HOST)
    console.warn("MAIL_HOST no está definida (para correos)!");
  if (!process.env.RECAPTCHA_SECRET_KEY)
    console.warn("RECAPTCHA_SECRET_KEY no está definida!");
});
