const transporter = require("../config/mailer");
require("dotenv").config();

const emailQueue = [];
let isProcessingQueue = false;

const processEmailQueue = async () => {
  if (isProcessingQueue || emailQueue.length === 0) {
    return;
  }
  isProcessingQueue = true;
  const emailJob = emailQueue.shift();

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log("Correo de prueba:", JSON.stringify(emailJob));
      return;
    }
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: emailJob.to,
      subject: emailJob.subject,
      text: emailJob.textBody,
      html: emailJob.htmlBody,
    });
    console.log(
      `Correo enviado a ${emailJob.to} con asunto: ${emailJob.subject}`
    );
  } catch (error) {
    console.error(
      `Error al enviar correo a ${emailJob.to} con asunto ${emailJob.subject}:`,
      error
    );
  }

  // Esperamos 5 segundos antes de procesar el siguiente correo
  setTimeout(() => {
    isProcessingQueue = false;
    processEmailQueue();
  }, 5000); // 5 segundos de retardo
};

// El resto del archivo se mantiene igual...
const sendEmail = async (to, subject, htmlBody, textBody) => {
  if (!process.env.MAIL_HOST) {
    console.warn(
      "Servicio de correo no configurado. El correo no se añadirá a la cola."
    );
    return;
  }
  emailQueue.push({ to, subject, htmlBody, textBody });
  processEmailQueue();
};

// Mantenemos tus otras funciones, pero ahora usarán el nuevo `sendEmail` que añade a la cola
const sendDenunciaCreadaEmail = async (denuncia) => {
  const mailToNotify = process.env.MAIL_TO_NOTIFY;
  if (!mailToNotify) {
    console.warn("MAIL_TO_NOTIFY no está configurado.");
    return;
  }
  const subject = `Nueva Denuncia Recibida - Folio: ${denuncia.folio_denuncia}`;
  const textBody = `
        Se ha registrado una nueva denuncia en el sistema.
        Folio: ${denuncia.folio_denuncia}
        Fecha de creación: ${new Date(denuncia.fecha_creacion).toLocaleString()}
        Municipio del denunciado: ${denuncia.municipio_denunciado}
        Descripción breve: ${denuncia.descripcion_hechos.substring(0, 100)}...

        Por favor, revise el panel de administración para más detalles.
    `;
  const htmlBody = `
        <h1>Nueva Denuncia Recibida</h1>
        <p>Se ha registrado una nueva denuncia en el sistema.</p>
        <ul>
            <li><strong>Folio:</strong> ${denuncia.folio_denuncia}</li>
            <li><strong>Fecha de creación:</strong> ${new Date(
              denuncia.fecha_creacion
            ).toLocaleString()}</li>
            <li><strong>Municipio del denunciado:</strong> ${
              denuncia.municipio_denunciado
            }</li>
            <li><strong>Descripción breve:</strong> ${denuncia.descripcion_hechos.substring(
              0,
              100
            )}...</li>
        </ul>
        <p>Por favor, revise el panel de administración para más detalles.</p>
    `;

  sendEmail(mailToNotify, subject, htmlBody, textBody);
};

const sendEstadoDenunciaActualizadoEmail = async (denuncia) => {
  const mailToNotify = process.env.MAIL_TO_NOTIFY;
  if (!mailToNotify) {
    console.warn("MAIL_TO_NOTIFY no está configurado.");
    return;
  }
  const subject = `Actualización de Estado de Denuncia - Folio: ${denuncia.folio_denuncia}`;
  const textBody = `
        El estado de la denuncia con folio ${
          denuncia.folio_denuncia
        } ha sido actualizado.
        Nuevo estado: ${denuncia.estado}
        Fecha de actualización: ${new Date(
          denuncia.fecha_actualizacion_estado
        ).toLocaleString()}

        Por favor, revise el panel de administración para más detalles.
    `;
  const htmlBody = `
        <h1>Actualización de Estado de Denuncia</h1>
        <p>El estado de la denuncia con folio <strong>${
          denuncia.folio_denuncia
        }</strong> ha sido actualizado.</p>
        <ul>
            <li><strong>Nuevo estado:</strong> ${denuncia.estado}</li>
            <li><strong>Fecha de actualización:</strong> ${new Date(
              denuncia.fecha_actualizacion_estado
            ).toLocaleString()}</li>
        </ul>
        <p>Por favor, revise el panel de administración para más detalles.</p>
    `;

  sendEmail(mailToNotify, subject, htmlBody, textBody);
};

module.exports = {
  sendEmail,
  sendDenunciaCreadaEmail,
  sendEstadoDenunciaActualizadoEmail,
};
