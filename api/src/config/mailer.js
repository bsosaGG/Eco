const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail", // <<< Usamos el servicio preconfigurado para Gmail
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // <<< Debe ser tu App Password de 16 letras
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error al configurar el transporter de Nodemailer:", error);
  } else {
    console.log("Servidor de correo listo para enviar mensajes.");
  }
});

module.exports = transporter;
