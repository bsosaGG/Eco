#!/usr/bin/env node
// Carga el catálogo de medios (Excel oficial) a la base de datos de Plan de Medios.
//
//   node scripts/plan-medios/import-catalog.js <archivo.xlsx> [--dry-run]
//
// Usa la misma conexión que el API (PLAN_MEDIOS_DATABASE_URL o PLAN_MEDIOS_DB_*).
// Se puede repetir: actualiza los medios existentes sin cambiar sus ids ni borrar ninguno.
// Con --dry-run solo valida el archivo y muestra cuántos medios y productos cargaría.
const fs = require("fs");
const { importarCatalogo } = require("../../src/services/plan-medios/catalog-import.service");

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const [filePath] = args.filter((arg) => !arg.startsWith("--"));

  if (!filePath) {
    console.error("Uso: node scripts/plan-medios/import-catalog.js <archivo.xlsx> [--dry-run]");
    return 2;
  }
  if (!fs.existsSync(filePath)) {
    console.error(`No existe el archivo: ${filePath}`);
    return 2;
  }

  const result = await importarCatalogo({ filePath, dryRun });
  console.log(dryRun ? "Validación del catálogo (no se escribió nada):" : "Catálogo cargado correctamente:");
  console.log(JSON.stringify(result, null, 2));
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`No fue posible cargar el catálogo: ${error.message}`);
    process.exit(1);
  });
