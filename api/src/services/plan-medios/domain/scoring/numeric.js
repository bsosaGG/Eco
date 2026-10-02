// Formateo y redondeo numérico con la misma semántica que Python.
//
// Python redondea "mitad al par" (round(2.5) == 2, f"{2.5:.0f}" == "2") mientras
// que JavaScript redondea la mitad hacia arriba. Como el scoring debe ser
// reproducible respecto del sistema original, se replica el comportamiento de Python.

/** Equivalente a f"{value:.{digits}f}" de Python. */
function toFixedHalfEven(value, digits = 0) {
  if (!Number.isFinite(value)) return String(value);
  // toFixed redondea con exactitud sobre el valor binario, salvo en empates exactos
  // (p. ej. 2.5 o 0.125), donde JavaScript sube y Python va al par. Un empate es
  // un valor cuya expansión decimal exacta es "...5" seguido solo de ceros.
  const exact = Math.abs(value).toFixed(Math.min(100, digits + 30));
  const tail = exact.slice(exact.indexOf(".") + 1 + digits);
  const isExactTie = /^50*$/.test(tail);
  if (!isExactTie) return value.toFixed(digits);

  const truncated = exact.slice(0, exact.indexOf(".") + 1 + digits).replace(/\.$/, "");
  const lastDigit = Number(truncated[truncated.length - 1]);
  const roundedUp = (Number(truncated.replace(".", "")) + (lastDigit % 2 === 0 ? 0 : 1)).toString();
  const padded = roundedUp.padStart(digits + 1, "0");
  const integerPart = padded.slice(0, padded.length - digits) || "0";
  const result = digits ? `${integerPart}.${padded.slice(padded.length - digits)}` : integerPart;
  return (value < 0 ? "-" : "") + result;
}

/** Equivalente a round(value, digits) de Python (devuelve número). */
function roundHalfEven(value, digits = 0) {
  return Number(toFixedHalfEven(value, digits));
}

/** Equivalente a f"{value:,.{digits}f}" (separador de miles). */
function formatThousands(value, digits = 2) {
  const fixed = toFixedHalfEven(Math.abs(value), digits);
  const [integer, decimals] = fixed.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = value < 0 ? "-" : "";
  return decimals !== undefined ? `${sign}${grouped}.${decimals}` : `${sign}${grouped}`;
}

/** 1_250_000 -> "1.25 M"; 45_000 -> "45 mil"; 800 -> "800". */
function humanNumber(value) {
  if (value >= 1_000_000) return `${toFixedHalfEven(value / 1_000_000, 2)} M`;
  if (value >= 1_000) return `${toFixedHalfEven(value / 1_000, 0)} mil`;
  return formatThousands(value, 0);
}

module.exports = { toFixedHalfEven, roundHalfEven, formatThousands, humanNumber };
