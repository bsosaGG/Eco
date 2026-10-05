// Conteo de lo ya emitido para generar los correlativos oficiales (formato en domain/numeracion.js).
//
// NOTA: el correlativo se calcula contando filas dentro de la misma transacción; para volúmenes
// altos con alta concurrencia conviene migrar a una tabla de correlativos como la de PAC
// (pac_correlativos). No bloquea el MVP.
const { DOCUMENTO, prefijoAnual, numeroAnual, patronExpedientesDelAnio } = require("../domain/numeracion");

// documento -> tabla y columna donde se guarda su número (valores fijos, nunca vienen del usuario).
const ORIGEN = {
  [DOCUMENTO.CDP]: { tabla: "cdp", columna: "numero_cdp" },
  [DOCUMENTO.ORDEN_COMPRA]: { tabla: "ordenes_compra", columna: "numero_oc" },
  [DOCUMENTO.COMPROMISO]: { tabla: "compromisos_presupuestarios", columna: "numero_comp" },
  [DOCUMENTO.DEVENGADO]: { tabla: "devengados", columna: "numero_dev" },
};

/** Siguiente número del documento para el año en curso: "CDP-2026-0001". */
async function siguienteNumeroAnual(db, documento, anio = new Date().getFullYear()) {
  const { tabla, columna } = ORIGEN[documento];
  const { rows } = await db.query(`SELECT COUNT(*)::int AS total FROM ${tabla} WHERE ${columna} LIKE $1`, [
    `${prefijoAnual(documento, anio)}%`,
  ]);
  return numeroAnual(documento, anio, rows[0].total + 1);
}

/** Cuántos expedientes lleva la unidad en el año (el siguiente correlativo es este número + 1). */
async function contarExpedientesDelAnio(db, codigoUnidad, anio) {
  // El correlativo va en medio (ABREV-CORRELATIVO-AÑO), así que no se puede contar con un prefijo
  // simple: se usa el patrón completo con el correlativo como comodín ('UA-%-2026').
  const { rows } = await db.query("SELECT COUNT(*)::int AS total FROM expedientes WHERE codigo_expediente LIKE $1", [
    patronExpedientesDelAnio(codigoUnidad, anio),
  ]);
  return rows[0].total;
}

module.exports = { siguienteNumeroAnual, contarExpedientesDelAnio };
