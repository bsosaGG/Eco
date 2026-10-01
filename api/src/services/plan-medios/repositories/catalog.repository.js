// Acceso de solo lectura al catálogo de medios (media_catalog, media_products,
// catalog_import_runs). El catálogo lo carga el equipo mediante su proceso
// controlado; este módulo nunca lo modifica.
//
// IDENTIFICADORES: la BD usa UUID, pero el formulario y los expedientes ya guardados
// identifican cada medio con un entero ("alias") que es su posición (1, 2, 3...)
// al ordenar el catálogo por UUID. Se conserva ese contrato para no invalidar los
// expedientes existentes. Es estable mientras no se agreguen ni quiten medios.
const { text: asText } = require("../domain/text-utils");

const MEDIA_COLUMNS =
  "id, name, group_name, media_type, coverage, regions, languages, reach, ages, predominant_sex, nse, " +
  "interests, peak_hours, contact_person, contact_email, contact_phone, legal_name, nit, tax_status, " +
  "required_documents, minimum_investment, contracting_forms, discounts, rate_card_validity, imported_at";

const byString = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

/** Mapas alias <-> UUID calculados sobre el catálogo vigente. */
async function aliasMaps(db) {
  const { rows } = await db.query("SELECT id FROM media_catalog ORDER BY id");
  const aliasToUuid = new Map();
  const uuidToAlias = new Map();
  rows.forEach((row, index) => {
    aliasToUuid.set(index + 1, row.id);
    uuidToAlias.set(row.id, index + 1);
  });
  return { aliasToUuid, uuidToAlias };
}

async function status(db) {
  const [{ rows: media }, { rows: products }, { rows: runs }] = await Promise.all([
    db.query("SELECT count(*)::int AS total FROM media_catalog"),
    db.query("SELECT count(*)::int AS total FROM media_products"),
    db.query(
      "SELECT imported_at, source_path, orphan_product_count FROM catalog_import_runs ORDER BY imported_at DESC LIMIT 1"
    ),
  ]);
  const run = runs[0];
  return {
    status: "ready",
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
  const { uuidToAlias } = await aliasMaps(db);
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
  return rows.map(({ id, ...rest }) => ({ id: uuidToAlias.get(id), ...rest }));
}

function toProduct(row) {
  return {
    id: row.id,
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

function toMedia(row, alias, products) {
  const { id, imported_at: importedAt, ...columns } = row;
  return {
    ...columns,
    id: alias,
    imported_at: new Date(importedAt).toISOString(),
    products: products.sort(
      (a, b) =>
        byString(a.category, b.category) || byString(a.product_name, b.product_name) || byString(String(a.id), String(b.id))
    ),
  };
}

async function loadProducts(db, mediaIds) {
  if (!mediaIds.length) return new Map();
  const { rows } = await db.query(
    `SELECT id, media_id, category, product_name, format, schedule, prime_time, rating,
            estimated_audience, unit_cost, details
       FROM media_products WHERE media_id = ANY($1::uuid[])`,
    [mediaIds]
  );
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.media_id)) grouped.set(row.media_id, []);
    grouped.get(row.media_id).push(toProduct(row));
  }
  return grouped;
}

/** Detalle de un medio por su alias numérico; null si no existe. */
async function getMedia(db, alias) {
  const { aliasToUuid } = await aliasMaps(db);
  const uuid = aliasToUuid.get(Number(alias));
  if (!uuid) return null;
  const { rows } = await db.query(`SELECT ${MEDIA_COLUMNS} FROM media_catalog WHERE id = $1`, [uuid]);
  if (!rows[0]) return null;
  const products = await loadProducts(db, [uuid]);
  return toMedia(rows[0], Number(alias), products.get(uuid) || []);
}

/** Catálogo completo con productos, en el orden (tipo, nombre); es la entrada del scoring. */
async function listAllWithProducts(db, { limit = 500 } = {}) {
  const { uuidToAlias } = await aliasMaps(db);
  const { rows } = await db.query(
    `SELECT ${MEDIA_COLUMNS} FROM media_catalog ORDER BY media_type, name LIMIT $1`,
    [limit]
  );
  const products = await loadProducts(db, rows.map((row) => row.id));
  return rows.map((row) => toMedia(row, uuidToAlias.get(row.id), products.get(row.id) || []));
}

/** Nombre legal del proveedor por alias (para la auditoría). */
async function legalNamesByAlias(db, aliases) {
  const wanted = [...new Set(aliases)];
  if (!wanted.length) return new Map();
  const { aliasToUuid, uuidToAlias } = await aliasMaps(db);
  const uuids = wanted.map((alias) => aliasToUuid.get(alias)).filter(Boolean);
  if (!uuids.length) return new Map();
  const { rows } = await db.query("SELECT id, legal_name FROM media_catalog WHERE id = ANY($1::uuid[])", [uuids]);
  return new Map(rows.map((row) => [uuidToAlias.get(row.id), asText(row.legal_name)]));
}

module.exports = { aliasMaps, status, listMedia, getMedia, listAllWithProducts, legalNamesByAlias };
