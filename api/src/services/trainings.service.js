/**
 * Trainings & Occupational Health Service (Ola 5 - Core Humanis SCSPR)
 * Business logic for training hours accreditation, certificate hashing,
 * induction progress, eNPS climate score, and occupational accident metrics.
 */

const crypto = require("crypto");

class TrainingsService {
  /**
   * Sums accredited hours for approved training programs.
   * @param {Array} enrollments - List of participant enrollment records.
   * @returns {number} Total accredited training hours.
   */
  calculateAccreditedHours(enrollments = []) {
    return enrollments.reduce((acc, curr) => {
      const isApproved =
        curr.estado === "APROBADO" || (Number(curr.calificacion_final) >= 70 && Number(curr.porcentaje_asistencia) >= 80);
      if (isApproved) {
        return acc + Number(curr.horas_lectivas || 0);
      }
      return acc;
    }, 0);
  }

  /**
   * Evaluates if a participant meets standards for official accreditation and certificate issuance.
   * @param {number} grade - Final grade (0-100).
   * @param {number} attendance - Attendance percentage (0-100).
   * @param {number} minGrade - Minimum required passing grade (default 70).
   * @param {number} minAttendance - Minimum required attendance (default 80%).
   * @returns {Object} Evaluation summary.
   */
  evaluateParticipantPassing(grade, attendance, minGrade = 70, minAttendance = 80) {
    const numGrade = Number(grade) || 0;
    const numAtt = Number(attendance) || 0;

    const gradePassed = numGrade >= minGrade;
    const attPassed = numAtt >= minAttendance;
    const passed = gradePassed && attPassed;

    return {
      passed,
      estado: passed ? "APROBADO" : "REPROBADO",
      gradePassed,
      attPassed,
      generaCertificado: passed,
    };
  }

  /**
   * Generates a tamper-proof SHA-256 hash for official training completion certificate.
   * @param {string} personaId
   * @param {string} programaId
   * @param {string} dateStr
   * @returns {string} Institutional certificate hash.
   */
  generateCertificateHash(personaId, programaId, dateStr = new Date().toISOString()) {
    const salt = "SCSPR_TRAINING_SECURE_SALT_2026";
    const raw = `${personaId}|${programaId}|${dateStr}|${salt}`;
    const hashHex = crypto.createHash("sha256").update(raw).digest("hex");
    return `SCSPR-DIP-${hashHex.substring(0, 16).toUpperCase()}`;
  }

  /**
   * Calculates induction checklist progress across 4 institutional phases.
   * @param {Object} phases - Boolean flags for each phase.
   * @returns {Object} Percentage and completion status.
   */
  calculateInductionProgress(phases = {}) {
    const list = [
      Boolean(phases.fase_institucional_completada),
      Boolean(phases.fase_normativa_completada),
      Boolean(phases.fase_herramientas_completada),
      Boolean(phases.fase_seguridad_sso_completada),
    ];
    const completedCount = list.filter(Boolean).length;
    const percentage = Math.round((completedCount / list.length) * 100);

    return {
      totalPhases: list.length,
      completedCount,
      percentage,
      isCompleted: completedCount === list.length,
      estado: completedCount === list.length ? "COMPLETADA" : "EN_PROCESO",
    };
  }

  /**
   * Generates a blind cryptographic participation token to guarantee anonymous one-time voting.
   * Disassociates user identity from survey responses.
   * @param {string} userId - User UUID.
   * @param {string} campaignId - Campaign UUID.
   * @returns {string} SHA-256 blind token.
   */
  generateBlindParticipationToken(userId, campaignId) {
    const salt = "SCSPR_CLIMA_BLIND_TOKEN_SALT_2026";
    return crypto.createHash("sha256").update(`${userId}|${campaignId}|${salt}`).digest("hex");
  }

  /**
   * Calculates Employee Net Promoter Score (eNPS) from ratings (0 to 10).
   * Promoters: 9-10, Passives: 7-8, Detractors: 0-6.
   * eNPS = % Promoters - % Detractors (ranges from -100 to +100).
   * Supports both raw numbers and response objects { valor_escala }.
   * @param {Array<number|Object>} scoresOrResponses
   * @returns {Object} Consolidated eNPS metrics.
   */
  calculateEnps(scoresOrResponses = []) {
    if (!scoresOrResponses || scoresOrResponses.length === 0) {
      return { total: 0, promoters: 0, passives: 0, detractors: 0, enps: 0 };
    }

    const scores = scoresOrResponses
      .map((item) => (typeof item === "object" && item !== null ? item.valor_escala : item))
      .filter((val) => val !== null && val !== undefined && !isNaN(Number(val)))
      .map((val) => Number(val));

    if (scores.length === 0) {
      return { total: 0, promoters: 0, passives: 0, detractors: 0, enps: 0 };
    }

    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    scores.forEach((val) => {
      if (val >= 9 && val <= 10) promoters++;
      else if (val >= 7 && val <= 8) passives++;
      else if (val >= 0 && val <= 6) detractors++;
    });

    const total = scores.length;
    const pctPromoters = (promoters / total) * 100;
    const pctDetractors = (detractors / total) * 100;
    const enps = Math.round(pctPromoters - pctDetractors);

    return {
      total,
      promoters,
      passives,
      detractors,
      pctPromoters: Math.round(pctPromoters * 10) / 10,
      pctDetractors: Math.round(pctDetractors * 10) / 10,
      enps,
    };
  }

  calculateENPS(scoresOrResponses) {
    return this.calculateEnps(scoresOrResponses);
  }

  /**
   * Computes occupational accident and incident rates under Guatemalan SSO standards (AG 229-2014).
   * @param {Array} incidents - List of recorded incident objects.
   * @param {number} totalHoursWorked - Total hours worked by the workforce in the period.
   * @returns {Object} Injury frequency and severity rates.
   */
  calculateAccidentRates(incidents = [], totalHoursWorked = 34560) {
    let lostTimeAccidents = 0;
    let noLostTimeAccidents = 0;
    let dangerousIncidents = 0;
    let totalLostDays = 0;

    incidents.forEach((inc) => {
      if (inc.tipo_evento === "ACCIDENTE_CON_BAJA") {
        lostTimeAccidents++;
        totalLostDays += Number(inc.dias_incapacidad_estimados || 0);
      } else if (inc.tipo_evento === "ACCIDENTE_SIN_BAJA") {
        noLostTimeAccidents++;
      } else if (inc.tipo_evento === "INCIDENTE_PELIGROSO") {
        dangerousIncidents++;
      }
    });

    const hours = Math.max(1, totalHoursWorked);
    // Tasa de Frecuencia (IF) = (Accidentes con baja * 1,000,000) / Horas hombre
    const frequencyRate = Math.round(((lostTimeAccidents * 1000000) / hours) * 100) / 100;
    // Tasa de Gravedad (IG) = (Días perdidos * 1,000) / Horas hombre
    const severityRate = Math.round(((totalLostDays * 1000) / hours) * 100) / 100;

    return {
      totalIncidents: incidents.length,
      lostTimeAccidents,
      noLostTimeAccidents,
      dangerousIncidents,
      totalLostDays,
      frequencyRate,
      severityRate,
    };
  }
}

module.exports = new TrainingsService();
