const { v4: uuidv4 } = require("uuid");

function generateFolio() {
  // Genera un folio simple basado en fecha y una parte de UUID
  // Ejemplo: SCSPR-20240727-A3B5
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  //!const randomPart = uuidv4().split("-")[0].substring(0, 4).toUpperCase();
  //!return `SCSPR-${year}${month}${day}-${randomPart}`;
  const randomPart = uuidv4().split("-")[0].substring(0, 3).toUpperCase();
  return `SCSP-UAP-${randomPart}-${year}-DENU-DIG`;
}

module.exports = generateFolio;
