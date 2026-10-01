// Acceso de solo lectura al catálogo de medios (media_catalog, media_products,
// catalog_import_runs). El catálogo lo carga el comando de importación
// (api/scripts/plan-medios/import-catalog.js); la aplicación nunca lo modifica.
const { text: asText } = require("../domain/text-utils");

const MEDIA_COLUMNS =
  "id, name, group_name, media_type, coverage, regions, languages, reach, ages, predominant_sex, nse, " +
  "interests, peak_hours, contact_person, contact_email, contact_phone, legal_name, nit, tax_status, " +
  "required_documents, minimum_investment, contracting_forms, discounts, rate_card_validity, imported_at";

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

async function status(db) {
  const [{ rows: media }, { rows: products }, { rows: runs }] = await Promise.all([
    db.query("SELECT count(*)::int AS total FROM media_catalog"),
    db.query("SELECT count(*)::int AS total FROM media_products"),
    db.query(
      "SELECT imported_at, source_path, orphan_product_count FROM catalog_import_runs ORDER BY id DESC LIMIT 1"
    ),
  ]);
  const run = runs[0];
  return {
    status: media[0].total > 0 ? "ready" : "empty",
    database: "postgresql",
    media_count: media[0].total,
    product_count: products[0].total,
    last_imported_at: run ? new Date(run.imported_at).toISOString() : null,
    last_source: run ? run.source_path : null,
    orphan_product_count: run ? run.orphan_product_count : 0,
  };
}

/** Listado ligero de medios (con cantidad de productos). */
async function listMedia(db, { mediaType, limit }) {
  const filter = mediaType && mediaType.trim() ? "WHERE lower(m.media_type) = lower($2)" : "";
  const params = [limit];
  if (filter) params.push(mediaType.trim());
  const { rows } = await db.query(
    `SELECT m.id, m.name, m.group_name, m.media_type, m.coverage, m.regions, m.languages, m.reach, m.ages,
            m.nse, m.minimum_investment, m.rate_card_validity,
            (SELECT count(*)::int FROM media_products p WHERE p.media_id = m.id) AS product_count
       FROM media_catalog m ${filter}
      ORDER BY m.media_type, m.name
      LIMIT $1`,
    params
  );
  return rows;
}

function toProduct(row) {
  return {
    id: Number(row.id),
    category: row.category,
    product_name: row.product_name,
    format: row.format,
    schedule: row.schedule,
    prime_time: row.prime_time,
    rating: toNumber(row.rating),
    estimated_audience: toNumber(row.estimated_audience),
    unit_cost: toNumber(row.unit_cost),
    details: row.details || {},
  };
}

const byString = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function toMedia(row, products) {
  const { imported_at: importedAt, ...columns } = row;
  return {
    ...columns,
    imported_at: new Date(importedAt).toISOString(),
    products: products.sort(
      (a, b) => byString(a.category, b.category) || byString(a.product_name, b.product_name) || a.id - b.id
    ),
  };
}

async function loadProducts(db, mediaIds) {
  if (!mediaIds.length) return new Map();
  const { rows } = await db.query(
    `SELECT id, media_id, category, product_name, format, schedule, prime_time, rating,
            estimated_audience, unit_cost, details
       FROM media_products WHERE media_id = ANY($1::int[])`,
    [mediaIds]
  );
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.media_id)) grouped.set(row.media_id, []);
    grouped.get(row.media_id).push(toProduct(row));
  }
  return grouped;
}

/** Detalle de un medio con sus productos; null si no existe. */
async function getMedia(db, id) {
  const { rows } = await db.query(`SELECT ${MEDIA_COLUMNS} FROM media_catalog WHERE id = $1`, [id]);
  if (!rows[0]) return null;
  const products = await loadProducts(db, [rows[0].id]);
  return toMedia(rows[0], products.get(rows[0].id) || []);
}

/** Catálogo completo con productos, en el orden (tipo, nombre); es la entrada del scoring. */
async function listAllWithProducts(db, { limit = 500 } = {}) {
  const { rows } = await db.query(`SELECT ${MEDIA_COLUMNS} FROM media_catalog ORDER BY media_type, name LIMIT $1`, [limit]);
  const products = await loadProducts(db, rows.map((row) => row.id));
  return rows.map((row) => toMedia(row, products.get(row.id) || []));
}

/** Subconjunto de `ids` que existe en el catálogo. */
async function existingIds(db, ids) {
  const wanted = [...new Set(ids)];
  if (!wanted.length) return new Set();
  const { rows } = await db.query("SELECT id FROM media_catalog WHERE id = ANY($1::int[])", [wanted]);
  return new Set(rows.map((row) => row.id));
}

/** Nombre legal del proveedor por id de medio (para la auditoría). */
async function legalNamesByIds(db, ids) {
  const wanted = [...new Set(ids)];
  if (!wanted.length) return new Map();
  const { rows } = await db.query("SELECT id, legal_name FROM media_catalog WHERE id = ANY($1::int[])", [wanted]);
  return new Map(rows.map((row) => [row.id, asText(row.legal_name)]));
}

module.exports = { status, listMedia, getMedia, listAllWithProducts, existingIds, legalNamesByIds };
