// Seed del catálogo de medios: si la tabla está vacía, la carga desde el Excel oficial que viaja
// con el código. Se ejecuta al arrancar el API, en segundo plano y sin bloquear ni tumbar al
// core: si la base de Plan de Medios aún no existe (o falla cualquier cosa) solo se registra
// un aviso y el resto del API sigue funcionando.
//
// Nunca sobrescribe: solo actúa cuando NO hay ningún medio cargado. Para actualizar un
// catálogo ya existente se usa el comando scripts/plan-medios/import-catalog.js.
const fs = require("fs");
const config = require("../../config/plan-medios.config");
const { planMediosDb } = require("../../config/db-plan-medios");
const { importarCatalogo } = require("./catalog-import.service");

const TAG = "[Plan de Medios]";

/**
 * @returns {Promise<{seeded: boolean, reason: string, media_count?: number, product_count?: number}>}
 */
async function seedCatalogIfEmpty({ db = planMediosDb, filePath = config.catalog.defaultFile, log = console } = {}) {
  try {
    const { rows } = await db.query("SELECT count(*)::int AS total FROM media_catalog");
    if (rows[0].total > 0) return { seeded: false, reason: "El catálogo ya tiene medios." };

    if (!fs.existsSync(filePath)) {
      log.warn(`${TAG} El catálogo está vacío y no se encontró el archivo de carga: ${filePath}`);
      return { seeded: false, reason: "No existe el archivo del catálogo." };
    }

    const result = await importarCatalogo({ filePath, db });
    log.log(`${TAG} Catálogo vacío: se cargaron ${result.media_count} medios y ${result.product_count} productos.`);
    return { seeded: true, reason: "Catálogo cargado.", media_count: result.media_count, product_count: result.product_count };
  } catch (error) {
    // Lo más común: la base db_plan_medios_scspr todavía no se creó (setup_plan_medios.sh).
    log.warn(`${TAG} No se pudo verificar/cargar el catálogo al arrancar: ${error.message}`);
    return { seeded: false, reason: error.message };
  }
}

module.exports = { seedCatalogIfEmpty };
