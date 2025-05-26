const transporter = require("../config/mailer");
require("dotenv").config();

const mailToNotify = process.env.MAIL_TO_NOTIFY;
const mailFrom = process.env.MAIL_FROM;

const sendDenunciaCreadaEmail = async (denuncia) => {
  if (!mailToNotify) {
    console.warn(
      "MAIL_TO_NOTIFY no está configurado. No se enviará correo de nueva denuncia."
    );
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

  try {
    await transporter.sendMail({
      from: mailFrom,
      to: mailToNotify,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });
    console.log(
      `Correo de nueva denuncia enviado para folio ${denuncia.folio_denuncia}`
    );
  } catch (error) {
    console.error(
      `Error al enviar correo de nueva denuncia para folio ${denuncia.folio_denuncia}:`,
      error
    );
  }
};

const sendEstadoDenunciaActualizadoEmail = async (denuncia) => {
  if (!mailToNotify) {
    console.warn(
      "MAIL_TO_NOTIFY no está configurado. No se enviará correo de actualización de estado."
    );
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

  try {
    await transporter.sendMail({
      from: mailFrom,
      to: mailToNotify,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });
    console.log(
      `Correo de actualización de estado enviado para folio ${denuncia.folio_denuncia}`
    );
  } catch (error) {
    console.error(
      `Error al enviar correo de actualización para folio ${denuncia.folio_denuncia}:`,
      error
    );
  }
};

module.exports = {
  sendDenunciaCreadaEmail,
  sendEstadoDenunciaActualizadoEmail,
};
