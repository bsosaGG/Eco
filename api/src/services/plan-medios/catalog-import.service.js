// Caso de uso: cargar el catálogo de medios desde el Excel oficial a la base de datos.
//
// Es una carga por "upsert": un medio que ya existe (mismo nombre y tipo) se actualiza
// conservando su id, para no romper los expedientes que ya lo seleccionaron; sus productos
// se reemplazan por los del archivo. Los medios que no vienen en el archivo se dejan como
// están (nunca se borran). Todo ocurre en una sola transacción: o se carga completo o nada.
const path = require("path");
const { planMediosDb } = require("../../config/db-plan-medios");
const { parseCatalogWorkbook, MEDIA_COLUMNS, mediaKey } = require("./documents/catalog-xlsx");

const UPDATABLE_COLUMNS = MEDIA_COLUMNS.filter((column) => column !== "name" && column !== "media_type");

async function upsertMedia(tx, record) {
  const columns = MEDIA_COLUMNS;
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const updates = UPDATABLE_COLUMNS.map((column) => `${column} = EXCLUDED.${column}`).join(", ");
  const { rows } = await tx.query(
    `INSERT INTO media_catalog (${columns.join(", ")}) VALUES (${placeholders.join(", ")})
     ON CONFLICT (name, media_type) DO UPDATE SET ${updates}, imported_at = now()
     RETURNING id`,
    columns.map((column) => record[column])
  );
  return rows[0].id;
}

/**
 * @param {object} args
 * @param {string} args.filePath  ruta del .xlsx del catálogo
 * @param {boolean} [args.dryRun] solo valida y cuenta; no escribe
 * @param {object} [args.db]      conexión a usar (por defecto, la del módulo)
 */
async function importarCatalogo({ filePath, dryRun = false, db = planMediosDb }) {
  const parsed = parseCatalogWorkbook(filePath);
  const summary = {
    source: path.resolve(filePath),
    media_count: parsed.media.length,
    product_count: 0,
    orphan_product_count: 0,
    sheet_stats: parsed.sheetStats,
    warnings: parsed.warnings,
    dry_run: dryRun,
  };

  const ids = new Map();
  const work = async (tx) => {
    for (const record of parsed.media) {
      ids.set(`${mediaKey(record.name)}\u0000${record.media_type}`, dryRun ? 0 : await upsertMedia(tx, record));
    }
    if (!dryRun) await tx.query("DELETE FROM media_products WHERE media_id = ANY($1::int[])", [[...ids.values()]]);

    for (const product of parsed.products) {
      const mediaId = ids.get(`${mediaKey(product.medium_name)}\u0000${product.media_type}`);
      if (mediaId === undefined) {
        summary.orphan_product_count += 1;
        continue;
      }
      summary.product_count += 1;
      if (dryRun) continue;
      await tx.query(
        `INSERT INTO media_products (media_id, category, product_name, format, schedule, prime_time, rating,
                                     estimated_audience, unit_cost, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
        [
          mediaId, product.category, product.product_name, product.format, product.schedule, product.prime_time,
          product.rating,
          product.estimated_audience === null ? null : Math.round(product.estimated_audience),
          product.unit_cost === null ? null : Math.round(product.unit_cost * 100) / 100,
          JSON.stringify(product.details),
        ]
      );
    }

    if (!dryRun) {
      await tx.query(
        `INSERT INTO catalog_import_runs (source_path, media_count, product_count, orphan_product_count)
         VALUES ($1, $2, $3, $4)`,
        [summary.source, summary.media_count, summary.product_count, summary.orphan_product_count]
      );
    }
  };

  if (dryRun) await work(null);
  else await db.transaction(work);
  return summary;
}

module.exports = { importarCatalogo };
