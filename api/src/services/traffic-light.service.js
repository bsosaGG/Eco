/**
 * Servicio de Cálculo de Semáforos de Vigencia y Alertas Legales (CGC, Colegiados, Contratos)
 * Implementa las reglas BR-02 (Finiquito CGC 6 meses), BR-03 y control de expedientes.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calcula el estado del semáforo para un documento
 * @param {string} fechaVencimientoStr - Fecha YYYY-MM-DD
 * @param {number} diasAlerta - Días de anticipación para estado 'POR_VENCER' (default 30)
 */
function calcularEstadoVigencia(fechaVencimientoStr, diasAlerta = 30) {
  if (!fechaVencimientoStr) return { estado: "VIGENTE", diasRestantes: null, color: "verde" };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaVenc = new Date(fechaVencimientoStr);
  fechaVenc.setHours(0, 0, 0, 0);

  const diffMs = fechaVenc.getTime() - hoy.getTime();
  const diasRestantes = Math.ceil(diffMs / MS_PER_DAY);

  if (diasRestantes < 0) {
    return {
      estado: "VENCIDO",
      diasRestantes,
      color: "rojo",
      label: `Vencido hace ${Math.abs(diasRestantes)} días`,
    };
  } else if (diasRestantes <= diasAlerta) {
    return {
      estado: "POR_VENCER",
      diasRestantes,
      color: "amarillo",
      label: `Vence en ${diasRestantes} días`,
    };
  } else {
    return {
      estado: "VIGENTE",
      diasRestantes,
      color: "verde",
      label: `Vigente (${diasRestantes} días)`,
    };
  }
}

/**
 * Calcula la fecha de expiración legal para el Finiquito CGC (6 meses exactos)
 * @param {string|Date} fechaEmision 
 */
function calcularVencimientoFiniquitoCGC(fechaEmision) {
  const d = new Date(fechaEmision);
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().split("T")[0];
}

/**
 * Evalúa la completitud e integridad del expediente de un colaborador
 */
function evaluarIntegridadExpediente(documentos = [], renglonCodigo = "011") {
  const docFiniquito = documentos.find((d) => d.tipo_codigo === "DOC_FINIQ_CGC");
  const docDPI = documentos.find((d) => d.tipo_codigo === "DOC_DPI");
  const docRTU = documentos.find((d) => d.tipo_codigo === "DOC_RTU");

  let tieneVencidos = false;
  let tienePorVencer = false;

  documentos.forEach((doc) => {
    if (doc.fecha_vencimiento) {
      const calc = calcularEstadoVigencia(doc.fecha_vencimiento);
      if (calc.estado === "VENCIDO") tieneVencidos = true;
      if (calc.estado === "POR_VENCER") tienePorVencer = true;
    }
  });

  const faltanObligatorios = !docFiniquito || !docDPI;

  if (tieneVencidos) {
    return { estado: "CON_VENCIMIENTOS", color: "rojo", badge: "Documentos Vencidos" };
  } else if (tienePorVencer) {
    return { estado: "POR_VENCER", color: "amarillo", badge: "Próximo a Vencer" };
  } else if (faltanObligatorios) {
    return { estado: "INCOMPLETO", color: "naranja", badge: "Incompleto" };
  }

  return { estado: "COMPLETO", color: "verde", badge: "Expediente Completo" };
}

module.exports = {
  calcularEstadoVigencia,
  calcularVencimientoFiniquitoCGC,
  evaluarIntegridadExpediente,
};
