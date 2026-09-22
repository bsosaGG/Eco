const crypto = require("crypto");
const QRCode = require("qrcode");

let correlativoCounter = 1;

/**
 * Genera el correlativo institucional oficial
 * Formato: SCSPR-URH-CONST-[AÑO]-[NÚMERO_CORRELATIVO]
 */
function generarCorrelativo() {
  const anio = new Date().getFullYear();
  const num = String(correlativoCounter++).padStart(5, "0");
  return `SCSPR-URH-CONST-${anio}-${num}`;
}

/**
 * Genera el hash criptográfico SHA-256 para validación por terceros
 */
function generarHashVerificacion(correlativo, cuiDpi, timestamp) {
  const data = `${correlativo}|${cuiDpi}|${timestamp}|scspr-urh-2026`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Genera la data URL del código QR que apunta a la URL pública de validación
 */
async function generarCodigoQR(hashVerificacion, host = "https://rrhh.scspr.gob.gt") {
  const urlValidacion = `${host}/core-humanis/validar/${hashVerificacion}`;
  return await QRCode.toDataURL(urlValidacion, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 180,
    color: {
      dark: "#0B2545",
      light: "#FFFFFF",
    },
  });
}

/**
 * Construye el cuerpo del documento respetando estrictamente la regla BR-04
 * Prohibición terminológica para 029 / 18:
 * Queda prohibido usar "salario", "sueldo", "empleado", "trabajador", "jornada".
 * Debe usar "honorarios", "prestador de servicios", "servicios técnicos/profesionales".
 */
function construirTextoLegalConstancia({
  colaborador,
  contrato,
  tipoConstancia,
  dirigidoA = "A QUIEN INTERESE",
  incluyeSalario = true,
  fechaEmision = new Date(),
}) {
  const renglon = contrato.renglon_codigo || "011";
  const esRelacionDependencia = ["011", "021", "022", "031"].includes(renglon);

  const nombreCompleto = `${colaborador.primer_nombre} ${colaborador.segundo_nombre || ""} ${colaborador.primer_apellido} ${colaborador.segundo_apellido || ""}`.replace(/\s+/g, " ").trim();
  const fechaIngresoFormatted = new Date(contrato.fecha_inicio).toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fechaHoyFormatted = fechaEmision.toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const montoFormatted = incluyeSalario
    ? `Q ${Number(contrato.salario_honorarios || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
    : null;

  let cuerpoTexto = "";

  if (esRelacionDependencia) {
    // Renglones 011 / 022
    cuerpoTexto = `La infrascrita Jefa de la Unidad de Recursos Humanos de la Secretaría de Comunicación Social de la Presidencia de la República (SCSPR), HACE CONSTAR que el señor(a):

${nombreCompleto}, quien se identifica con el Documento Personal de Identificación (DPI) con Código Único de Identificación (CUI) número ${colaborador.cui_dpi}, labora para esta Institución bajo el renglón presupuestario ${renglon} (${contrato.renglon_nombre}), desempeñando el puesto funcional de "${contrato.puesto_funcional}" en la dependencia "${contrato.unidad_admin}", desde el ${fechaIngresoFormatted} a la presente fecha, manteniendo un desempeño y conducta intachables.${
      montoFormatted
        ? `\n\nDevengando un salario mensual nominal de ${montoFormatted}, afecto a los descuentos de ley correspondientes.`
        : ""
    }`;
  } else {
    // Renglones 029 / 183 / 189 (BR-04 Estricto: Sin relación de dependencia)
    cuerpoTexto = `La infrascrita Jefa de la Unidad de Recursos Humanos de la Secretaría de Comunicación Social de la Presidencia de la República (SCSPR), HACE CONSTAR que el señor(a):

${nombreCompleto}, quien se identifica con el Documento Personal de Identificación (DPI) con Código Único de Identificación (CUI) número ${colaborador.cui_dpi}, presta sus servicios técnicos y profesionales para esta Secretaría bajo el renglón presupuestario ${renglon} (${contrato.renglon_nombre}), según Contrato Administrativo número ${contrato.numero_acuerdo_contrato || "S/N"}, asignado a la unidad "${contrato.unidad_admin}", prestando sus servicios a partir del ${fechaIngresoFormatted}.${
      montoFormatted
        ? `\n\nPercibiendo por concepto de honorarios mensuales la cantidad de ${montoFormatted}, sujeto a retención tributaria según las leyes vigentes de la SAT.`
        : ""
    }\n\nSe hace constar expresamente que la presente vinculación se rige por la Ley de Contrataciones del Estado y disposiciones civiles aplicables, por lo que NO genera relación laboral de dependencia ni prestaciones de carácter laboral.`;
  }

  return {
    titulo: esRelacionDependencia
      ? "CONSTANCIA DE TRABAJO"
      : "CONSTANCIA DE PRESTACIÓN DE SERVICIOS TÉCNICOS Y PROFESIONALES",
    dirigidoA,
    nombreCompleto,
    cuiDpi: colaborador.cui_dpi,
    nit: colaborador.nit,
    renglon,
    cuerpoTexto,
    fechaEmisionTexto: `Guatemala, ${fechaHoyFormatted}.`,
    firmante: "Licda. María Elena Morales Paz\nJefa de la Unidad de Recursos Humanos\nSecretaría de Comunicación Social de la Presidencia",
  };
}

module.exports = {
  generarCorrelativo,
  generarHashVerificacion,
  generarCodigoQR,
  construirTextoLegalConstancia,
};
