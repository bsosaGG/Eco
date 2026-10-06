// Reportes / vistas administrativas: listados cross-expediente para las secciones del sidebar (admin).
// Ver reportes.repository.js sobre por qué todavía no llevan paginación.
const { adquisicionesDb } = require("../../config/db-adquisiciones");
const reportes = require("./repositories/reportes.repository");

const getReporteCotizaciones = () => reportes.cotizaciones(adquisicionesDb);
const getReporteCdp = () => reportes.cdp(adquisicionesDb);
const getReporteOrdenesCompra = () => reportes.ordenesCompra(adquisicionesDb);

async function getReporteFinanciera() {
  const [compromisos, devengados, solicitudesPago] = await Promise.all([
    reportes.compromisos(adquisicionesDb),
    reportes.devengados(adquisicionesDb),
    reportes.solicitudesPago(adquisicionesDb),
  ]);
  return { compromisos, devengados, solicitudes_pago: solicitudesPago };
}

async function getReporteResumen() {
  const [porEstado, montos, conteos] = await Promise.all([
    reportes.expedientesPorEstado(adquisicionesDb),
    reportes.montosTotales(adquisicionesDb),
    reportes.conteosGenerales(adquisicionesDb),
  ]);
  return { por_estado: porEstado, montos, conteos };
}

module.exports = {
  getReporteCotizaciones,
  getReporteCdp,
  getReporteOrdenesCompra,
  getReporteFinanciera,
  getReporteResumen,
};
