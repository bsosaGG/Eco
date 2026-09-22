/**
 * Servicio de Evaluaciones del Desempeño y Reclutamiento (Ola 4)
 * Secretaría de Comunicación Social de la Presidencia (SCSPR)
 */

/**
 * Retorna los factores predeterminados según el tipo de instrumento
 * @param {string} tipoInstrumento - 'ONSEC_011_022' | 'TDR_029_SUB18'
 * @returns {Array} Factores con ponderaciones máximas que suman 100
 */
function getDefaultFactors(tipoInstrumento) {
  if (tipoInstrumento === "TDR_029_SUB18") {
    return [
      {
        factor_clave: "Entrega de Informes Mensuales",
        factor_descripcion: "Puntualidad y formalidad en la entrega del informe mensual de actividades",
        ponderacion_maxima: 30,
      },
      {
        factor_clave: "Cumplimiento Técnico de TDRs",
        factor_descripcion: "Calidad y apego de los entregables a los términos de referencia convenidos",
        ponderacion_maxima: 40,
      },
      {
        factor_clave: "Satisfacción y Disponibilidad",
        factor_descripcion: "Disponibilidad profesional y satisfacción del administrador del contrato",
        ponderacion_maxima: 30,
      },
    ];
  }

  // Por defecto: ONSEC 011 / 022
  return [
    {
      factor_clave: "Calidad de Trabajo",
      factor_descripcion: "Exactitud, presentación, orden y esmero en las tareas asignadas",
      ponderacion_maxima: 20,
    },
    {
      factor_clave: "Cumplimiento de Metas",
      factor_descripcion: "Logro de objetivos institucionales y entrega oportuna de resultados",
      ponderacion_maxima: 25,
    },
    {
      factor_clave: "Conocimiento del Puesto",
      factor_descripcion: "Dominio de la normativa, procedimientos y herramientas de la función",
      ponderacion_maxima: 20,
    },
    {
      factor_clave: "Iniciativa",
      factor_descripcion: "Proactividad, aportes constructivos y solución autónoma de problemas",
      ponderacion_maxima: 15,
    },
    {
      factor_clave: "Relaciones Interpersonales",
      factor_descripcion: "Trabajo en equipo, respeto y atención cordial a usuarios internos y externos",
      ponderacion_maxima: 20,
    },
  ];
}

/**
 * Calcula el punteo consolidado y escala ONSEC
 * @param {Array} factors - Lista de factores con puntaje_obtenido
 * @param {string} tipoInstrumento - 'ONSEC_011_022' | 'TDR_029_SUB18'
 */
function calculateEvaluationScore(factors = [], tipoInstrumento = "ONSEC_011_022") {
  const total = factors.reduce((sum, f) => {
    const pts = parseFloat(f.puntaje_obtenido) || 0;
    const max = parseFloat(f.ponderacion_maxima) || 100;
    return sum + Math.min(pts, max);
  }, 0);

  const calificacion_total = Math.round(total * 100) / 100;

  let resultado_escala = "DEFICIENTE";
  if (calificacion_total >= 90) {
    resultado_escala = "EXCELENTE";
  } else if (calificacion_total >= 80) {
    resultado_escala = "MUY_BUENO";
  } else if (calificacion_total >= 70) {
    resultado_escala = "SATISFACTORIO";
  } else {
    resultado_escala = "DEFICIENTE";
  }

  const requiere_plan_mejora = calificacion_total < 70;

  return {
    calificacion_total,
    resultado_escala,
    requiere_plan_mejora,
    factores_evaluados: factors,
  };
}

/**
 * Calcula el punteo total de un candidato y su calificación para la terna final
 * @param {number} curricular - 0 a 30 pts
 * @param {number} tecnico - 0 a 40 pts
 * @param {number} entrevista - 0 a 30 pts
 */
function calculateCandidateScore(curricular = 0, tecnico = 0, entrevista = 0) {
  const cur = Math.min(Math.max(parseFloat(curricular) || 0, 0), 30);
  const tec = Math.min(Math.max(parseFloat(tecnico) || 0, 0), 40);
  const ent = Math.min(Math.max(parseFloat(entrevista) || 0, 0), 30);

  const punteo_total = Math.round((cur + tec + ent) * 100) / 100;
  const en_terna = punteo_total >= 75.0;

  return {
    punteo_curricular: cur,
    punteo_tecnico: tec,
    punteo_entrevista: ent,
    punteo_total,
    en_terna,
  };
}

module.exports = {
  getDefaultFactors,
  calculateEvaluationScore,
  calculateCandidateScore,
};
