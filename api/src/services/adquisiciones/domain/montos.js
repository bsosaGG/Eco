/** Monto en quetzales con dos decimales para mensajes y bitácora: "Q9000.00". */
const quetzales = (monto) => `Q${parseFloat(monto).toFixed(2)}`;

module.exports = { quetzales };
