const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || "587", 10),
  secure: parseInt(process.env.MAIL_PORT || "587", 10) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // Descomentar si usas certificados autofirmados en desarrollo (no recomendado para producción)
  // tls: {
  //     rejectUnauthorized: false
  // }
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error al configurar el transporter de Nodemailer:", error);
  } else {
    console.log("Servidor de correo listo para enviar mensajes.");
  }
});

module.exports = transporter;
