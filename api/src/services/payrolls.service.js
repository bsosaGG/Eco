/**
 * Payroll Service (Ola 3 - Core Humanis SCSPR)
 * Handles wage calculations, Guatemalan labor regulations, social security (IGSS),
 * state pension fund (Montepío - Dto. 63-88), bonuses, and 029 service honorariums.
 */

const crypto = require("crypto");

/**
 * Calculates the progressive Montepío deduction percentage based on Ley de Clases Pasivas (Decreto 63-88).
 * Only applies to permanent personnel under Renglón 011.
 *
 * @param {number} sueldoBase - Base salary in Quetzales
 * @returns {number} Decimal percentage (e.g. 0.11 for 11%)
 */
function calcularMontepioPorcentaje(sueldoBase) {
  const sueldo = Number(sueldoBase) || 0;
  if (sueldo <= 2000) return 0.09;
  if (sueldo <= 4000) return 0.10;
  if (sueldo <= 6000) return 0.11;
  if (sueldo <= 8000) return 0.12;
  if (sueldo <= 10000) return 0.13;
  if (sueldo <= 15000) return 0.14;
  return 0.15;
}

/**
 * Calculates payroll liquidation breakdown for a single collaborator.
 *
 * @param {Object} colab - Collaborator data
 * @returns {Object} Computed liquidation details
 */
function calcularLiquidacionColaborador(colab) {
  const renglon = String(colab.renglon || "011").trim();
  const diasLaborados = Number(colab.diasLaborados) || 30;
  const diasSuspension = Number(colab.diasSuspension) || 0;

  // 1. SERVICES REGIMES: 029, 183, 189 (NO LABOR DEPENDENCY)
  if (renglon === "029" || renglon.startsWith("18")) {
    const honorarios = Number(colab.honorarios || colab.salarioHonorarios || colab.sueldoBase) || 0;
    const retencionIsr = Number((honorarios * 0.05).toFixed(2));
    const liquidoRecibir = Number((honorarios - retencionIsr).toFixed(2));

    return {
      personaId: colab.id,
      nombre: colab.nombre,
      renglon,
      diasLaborados,
      honorarios,
      totalIngresos: honorarios,
      bonoIncentivo: 0.00,
      bonoProfesional: 0.00,
      cuotaIgss: 0.00,
      montepio: 0.00,
      retencionIsr,
      descuentoSuspension: 0.00,
      totalDescuentos: retencionIsr,
      liquidoRecibir,
      bancoNombre: colab.bancoNombre || "BANRURAL",
      bancoNumeroCuenta: colab.bancoNumeroCuenta || "",
      tipoCuenta: colab.tipoCuenta || "MONETARIA"
    };
  }

  // 2. LABOR DEPENDENCY REGIMES: 011, 022, 021
  const sueldoBaseNominal = Number(colab.sueldoBase || colab.salarioHonorarios) || 0;

  // Deduction for disciplinary suspension (unpaid leave)
  const cuotaDiaria = sueldoBaseNominal / 30;
  const descuentoSuspension = Number((cuotaDiaria * diasSuspension).toFixed(2));
  const sueldoBaseEfectivo = Math.max(0, sueldoBaseNominal - descuentoSuspension);

  // Statutory bonuses
  const bonoIncentivo = 250.00; // Dto. 37-2001
  const bonoProfesional = colab.esProfesional ? 375.00 : 0.00; // Dto. 72-2001
  const totalIngresos = Number((sueldoBaseNominal + bonoIncentivo + bonoProfesional).toFixed(2));

  // Statutory social security: IGSS Cuota Laboral 4.83% on base salary
  const cuotaIgss = Number((sueldoBaseEfectivo * 0.0483).toFixed(2));

  // State Pension Fund: Montepío (Only for 011)
  let montepio = 0.00;
  if (renglon === "011") {
    const porcentajeMontepio = calcularMontepioPorcentaje(sueldoBaseEfectivo);
    montepio = Number((sueldoBaseEfectivo * porcentajeMontepio).toFixed(2));
  }

  const retencionIsr = Number(colab.retencionIsr || 0.00);
  const otrosDescuentos = Number(colab.otrosDescuentos || 0.00);

  const totalDescuentos = Number(
    (cuotaIgss + montepio + retencionIsr + descuentoSuspension + otrosDescuentos).toFixed(2)
  );
  const liquidoRecibir = Number((totalIngresos - totalDescuentos).toFixed(2));

  return {
    personaId: colab.id,
    nombre: colab.nombre,
    renglon,
    diasLaborados,
    diasSuspension,
    sueldoBase: sueldoBaseNominal,
    sueldoBaseEfectivo,
    bonoIncentivo,
    bonoProfesional,
    totalIngresos,
    cuotaIgss,
    montepio,
    retencionIsr,
    descuentoSuspension,
    totalDescuentos,
    liquidoRecibir,
    bancoNombre: colab.bancoNombre || "BANRURAL",
    bancoNumeroCuenta: colab.bancoNumeroCuenta || "",
    tipoCuenta: colab.tipoCuenta || "MONETARIA"
  };
}

/**
 * Calculates aggregated totals for a payroll collection.
 *
 * @param {Array<Object>} detalles - List of collaborator liquidations
 * @returns {Object} Aggregated totals
 */
function calcularResumenPlanilla(detalles) {
  let totalDevengado = 0;
  let totalDescuentos = 0;
  let totalLiquido = 0;

  for (const d of detalles) {
    totalDevengado += Number(d.totalIngresos || d.honorarios || 0);
    totalDescuentos += Number(d.totalDescuentos || 0);
    totalLiquido += Number(d.liquidoRecibir || 0);
  }

  return {
    totalDevengado: Number(totalDevengado.toFixed(2)),
    totalDescuentos: Number(totalDescuentos.toFixed(2)),
    totalLiquido: Number(totalLiquido.toFixed(2)),
    cantidadColaboradores: detalles.length
  };
}

/**
 * Generates an immutable SHA-256 hash for a payroll slip.
 *
 * @param {string} personaId
 * @param {string} nominaId
 * @param {number} periodoMes
 * @param {number} periodoAnio
 * @param {number} liquido
 * @returns {string} SHA-256 hex string
 */
function generarHashBoleta(personaId, nominaId, periodoMes, periodoAnio, liquido) {
  const payload = `${personaId}|${nominaId}|${periodoMes}|${periodoAnio}|${liquido}|SCSPR_PAYROLL_SALT_2026`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

module.exports = {
  calcularMontepioPorcentaje,
  calcularLiquidacionColaborador,
  calcularResumenPlanilla,
  generarHashBoleta
};
